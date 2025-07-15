/**
 * Dedicated script to generate NLP processing screenshots for specific scenarios
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Configuration
const APP_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = './docs/screenshots/features';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function generateNLPScreenshots() {
  console.log('🚀 Starting NLP-specific screenshot generation...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set viewport for consistent screenshots
  await page.setViewportSize({ width: 1280, height: 720 });
  
  try {
    console.log('📝 Navigating to help page...');
    await page.goto(`${APP_URL}/help`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Find the input element (help page uses Input component)
    const input = page.locator('input[type="text"], input:not([type])').first();
    
    // Check if input exists
    const inputVisible = await input.isVisible();
    
    console.log(`Help page input visible: ${inputVisible}`);
    
    if (!inputVisible) {
      console.log('❌ Input element not found on /help page');
      console.log('Available form elements:');
      const allInputs = await page.locator('input, textarea, button').all();
      for (const el of allInputs) {
        const tagName = await el.evaluate(node => node.tagName);
        const type = await el.evaluate(node => node.type || 'N/A');
        const placeholder = await el.evaluate(node => node.placeholder || 'N/A');
        const text = await el.evaluate(node => node.textContent?.slice(0, 50) || 'N/A');
        console.log(`  - ${tagName} (type: ${type}, placeholder: ${placeholder}, text: ${text})`);
      }
      await browser.close();
      return;
    }
    
    console.log('ℹ️ Note: Help page uses auto-submit (no button needed) - results appear after typing');
    
    // Scenario 1: App keeps crashing
    console.log('📱 Testing scenario 1: App keeps crashing');
    await input.fill('App keeps crashing');
    await page.waitForTimeout(1000);
    
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'nlp-processing-crash-query.png'),
      fullPage: false
    });
    console.log('✅ Generated: nlp-processing-crash-query.png');
    
    // Wait for auto-results to appear (no button click needed)
    console.log('⏳ Waiting for crash analysis results to auto-load...');
    
    // Wait for help page specific result elements
    let resultsLoaded = false;
    
    // Strategy 1: Wait for help page result container
    try {
      await page.waitForSelector('.HelpPage__result, .HelpPage__metadata', { timeout: 8000 });
      console.log('✅ Help page results appeared');
      resultsLoaded = true;
    } catch (e) {
      console.log('⚠️ Help page result container not found, trying other strategies...');
    }
    
    // Strategy 2: Wait for specific sentiment/category content
    if (!resultsLoaded) {
      try {
        await page.waitForFunction(() => {
          const body = document.body.textContent || '';
          return body.includes('Detected Sentiment') || body.includes('Category') || 
                 body.includes('feedback') || body.includes('Send Feedback') ||
                 body.includes('negative') || body.includes('positive');
        }, { timeout: 5000 });
        console.log('✅ Results detected by content analysis');
        resultsLoaded = true;
      } catch (e) {
        console.log('⚠️ Content analysis timeout, proceeding anyway...');
      }
    }
    
    // Additional wait for animations and rendering
    await page.waitForTimeout(resultsLoaded ? 2000 : 3000);
    
    // Debug: Show what content is on the page
    const pageContent = await page.textContent('body');
    console.log(`📝 Page content sample: ${pageContent.slice(0, 300)}...`);
    
    // Expand viewport to capture more content
    await page.setViewportSize({ width: 1280, height: 900 });
    
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'nlp-processing-crash-result.png'),
      fullPage: true
    });
    console.log('✅ Generated: nlp-processing-crash-result.png');
    
    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Clear and prepare for next scenario
    await input.clear();
    await page.waitForTimeout(500);
    
    // Scenario 2: Could you provide more bananas?
    console.log('🍌 Testing scenario 2: Bananas request');
    await input.fill('Could you provide more bananas?');
    await page.waitForTimeout(1000);
    
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'nlp-processing-bananas-query.png'),
      fullPage: false
    });
    console.log('✅ Generated: nlp-processing-bananas-query.png');
    
    // Wait for auto-results to appear (no button click needed)
    console.log('⏳ Waiting for bananas request analysis results to auto-load...');
    
    // Wait for help page specific result elements
    let resultsLoaded2 = false;
    
    // Strategy 1: Wait for help page result container
    try {
      await page.waitForSelector('.HelpPage__result, .HelpPage__metadata', { timeout: 8000 });
      console.log('✅ Help page results appeared');
      resultsLoaded2 = true;
    } catch (e) {
      console.log('⚠️ Help page result container not found, trying other strategies...');
    }
    
    // Strategy 2: Wait for specific content
    if (!resultsLoaded2) {
      try {
        await page.waitForFunction(() => {
          const body = document.body.textContent || '';
          return body.includes('Question & Answer') || body.includes('Send Feedback') || 
                 body.includes('Category') || body.includes('Detected Sentiment') ||
                 body.includes('product') || body.includes('request');
        }, { timeout: 5000 });
        console.log('✅ Results detected by content analysis');
        resultsLoaded2 = true;
      } catch (e) {
        console.log('⚠️ Content analysis timeout, proceeding anyway...');
      }
    }
    
    // Additional wait for animations and rendering
    await page.waitForTimeout(resultsLoaded2 ? 2000 : 3000);
    
    // Debug: Show what content is on the page
    const pageContent2 = await page.textContent('body');
    console.log(`📝 Page content sample: ${pageContent2.slice(0, 300)}...`);
    
    // Expand viewport to capture more content
    await page.setViewportSize({ width: 1280, height: 900 });
    
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'nlp-processing-bananas-result.png'),
      fullPage: true
    });
    console.log('✅ Generated: nlp-processing-bananas-result.png');
    
    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    
    console.log('🎉 NLP screenshot generation completed successfully!');
    
  } catch (error) {
    console.error('❌ Error generating NLP screenshots:', error);
  } finally {
    await browser.close();
  }
}

// Run the script
if (require.main === module) {
  generateNLPScreenshots().catch(console.error);
}

module.exports = { generateNLPScreenshots };