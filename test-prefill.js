#!/usr/bin/env node
/**
 * Test script to reproduce the prefill JSON-leak issue.
 * Sends 5 parallel "prefill my cart" requests to the backend
 * and checks if responses contain raw JSON instead of natural language.
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3010';
const USER_ID = 'larry'; // Known test user with purchase history

async function sendPrefillRequest(requestId) {
  const startTime = Date.now();
  try {
    const response = await fetch(`${BACKEND_URL}/api/assistant/customer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Prefill my cart with my usual items',
        context: {
          userId: USER_ID,
          cartItems: [],
          currentPage: 'store'
        },
        conversationHistory: []
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return { requestId, success: false, error: `HTTP ${response.status}: ${err}`, duration: Date.now() - startTime };
    }

    const data = await response.json();
    const text = data.response || '';
    const duration = Date.now() - startTime;

    // Detect JSON leak patterns
    const issues = [];

    // Check for raw JSON objects in response
    if (/\{[\s]*"/.test(text)) {
      issues.push('Contains JSON object literal');
    }

    // Check for JSON arrays
    if (/\[[\s]*"/.test(text) && text.includes('6410') || text.includes('6411')) {
      issues.push('Contains raw product ID arrays');
    }

    // Check for technical field names
    const techFields = ['productIds', 'productId', '$p', '$value', 'success:', '"success"', '"products"', '"message"'];
    for (const field of techFields) {
      if (text.includes(field)) {
        issues.push(`Contains technical field: ${field}`);
      }
    }

    // Check for barcode-style IDs exposed directly
    const barcodePattern = /\b\d{13}\b/g;
    const barcodes = text.match(barcodePattern);
    if (barcodes && barcodes.length > 2) {
      issues.push(`Contains ${barcodes.length} raw barcode IDs`);
    }

    // Check for JSON.stringify-like output
    if (text.includes('\\n') || text.includes('\\"')) {
      issues.push('Contains escaped JSON characters');
    }

    const hasIssues = issues.length > 0;

    return {
      requestId,
      success: !hasIssues,
      duration,
      responseLength: text.length,
      toolsUsed: data.toolsUsed || [],
      issues: issues.length > 0 ? issues : ['Clean response'],
      responsePreview: text.substring(0, 300) + (text.length > 300 ? '...' : ''),
      fullResponse: text
    };
  } catch (error) {
    return { requestId, success: false, error: error.message, duration: Date.now() - startTime };
  }
}

async function runBatch(batchNum, count = 5) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`BATCH ${batchNum}: Sending ${count} parallel prefill requests...`);
  console.log('='.repeat(60));

  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(sendPrefillRequest(`${batchNum}-${i + 1}`));
  }

  const results = await Promise.all(promises);

  let passed = 0;
  let failed = 0;

  for (const result of results) {
    const status = result.success ? 'PASS' : 'FAIL';
    if (result.success) passed++;
    else failed++;

    console.log(`\n[${status}] Request ${result.requestId} (${result.duration}ms)`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    } else {
      console.log(`  Tools used: ${result.toolsUsed.join(', ') || 'none'}`);
      console.log(`  Issues: ${result.issues.join('; ')}`);
      console.log(`  Response preview: ${result.responsePreview}`);
    }
  }

  return { passed, failed, results };
}

async function main() {
  console.log('Prefill JSON-Leak Test');
  console.log(`Backend: ${BACKEND_URL}`);
  console.log(`User: ${USER_ID}`);

  // Check backend health
  try {
    const health = await fetch(`${BACKEND_URL}/health`);
    if (!health.ok) throw new Error(`Health check failed: ${health.status}`);
    console.log('Backend health: OK');
  } catch (error) {
    console.error(`Backend not reachable: ${error.message}`);
    console.error('Start the backend with: npm run start:backend');
    process.exit(1);
  }

  const totalPassed = { passed: 0, failed: 0 };
  const allResults = [];

  // Run 2 batches of 5 (10 total requests)
  for (let batch = 1; batch <= 2; batch++) {
    const { passed, failed, results } = await runBatch(batch, 5);
    totalPassed.passed += passed;
    totalPassed.failed += failed;
    allResults.push(...results);

    // Small delay between batches
    if (batch < 2) await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total: ${totalPassed.passed + totalPassed.failed} requests`);
  console.log(`Passed: ${totalPassed.passed}`);
  console.log(`Failed: ${totalPassed.failed}`);
  console.log(`Failure rate: ${((totalPassed.failed / (totalPassed.passed + totalPassed.failed)) * 100).toFixed(1)}%`);

  if (totalPassed.failed > 0) {
    console.log('\nFailed responses:');
    for (const r of allResults.filter(r => !r.success)) {
      console.log(`\n--- Request ${r.requestId} ---`);
      console.log(r.fullResponse || r.error);
    }
  }

  process.exit(totalPassed.failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
