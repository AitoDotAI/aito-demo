#!/usr/bin/env node

/**
 * Generate specific screenshots with custom content
 * This script targets the specific requirements:
 * 1. Tag prediction with "rye bread" text
 * 2. Autofill with button clicked
 * 3. NLP processing with "Which payment methods do you provide?"
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const CONFIG = {
  baseUrl: 'http://localhost:3000',
  screenshotDir: './docs/screenshots/features',
  viewport: { width: 1280, height: 900 },
  waitTime: 2000
};

// Ensure directory exists
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const takeScreenshot = async (page, filename, options = {}) => {
  const { fullPage = false, clip = null } = options;
  
  ensureDir(CONFIG.screenshotDir);
  const screenshotPath = path.join(CONFIG.screenshotDir, filename);
  
  const screenshotOptions = {
    path: screenshotPath,
    fullPage
  };
  
  if (clip) {
    screenshotOptions.clip = clip;
  }
  
  await page.screenshot(screenshotOptions);

  console.log(`✓ Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
};

const waitForApp = async (page) => {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(CONFIG.waitTime);
};

async function generateSpecificScreenshots() {
  console.log('🚀 Starting specific screenshot generation...');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: CONFIG.viewport
  });
  
  const page = await context.newPage();

  try {
    console.log('📸 1. Generating tag prediction screenshot with "rye bread" on /products page...');
    
    // Navigate to products page for tag prediction
    await page.goto(`${CONFIG.baseUrl}/admin`);
    await waitForApp(page);

    // Find tag prediction input on products page
    const tagPredictionSelectors = [
      'input[placeholder*="product"]',
      'input[placeholder*="name"]',
      'input[placeholder*="Product name"]',
      '[data-testid="tag-prediction-input"]',
      '.product-input',
      'input[type="text"]'
    ];

    let foundTagInput = false;
    for (const selector of tagPredictionSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        await element.fill('rye bread');
        await page.waitForTimeout(1000);
        
        // Look for prediction button
        const predictButtons = [
          'button:has-text("Predict")',
          'button:has-text("Get Tags")',
          'button:has-text("Suggest")',
          'button:has-text("Generate")',
          '[data-testid="predict-button"]'
        ];
        
        for (const btnSelector of predictButtons) {
          const btn = page.locator(btnSelector).first();
          if (await btn.isVisible()) {
            await btn.click();
            await page.waitForTimeout(2000);
            break;
          }
        }
        
        foundTagInput = true;
        break;
      }
    }
    
    await takeScreenshot(page, 'tag-prediction.png');
    
    // Navigate to cart page for autofill
    await page.goto(`${CONFIG.baseUrl}/cart`);
    await waitForApp(page);

    console.log('📸 2. Generating autofill screenshot with button clicked...');
    
    // Look for autofill button
    const autofillSelectors = [
      'button:has-text("Autofill")',
      'button:has-text("Auto-fill")',
      'button:has-text("Fill Cart")',
      '[data-testid="autofill-button"]',
      '.autofill-btn'
    ];

    let foundAutofill = false;
    for (const selector of autofillSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        await element.scrollIntoViewIfNeeded();
        await element.click();
        await page.waitForTimeout(2000);
        foundAutofill = true;
        break;
      }
    }
    
    await takeScreenshot(page, 'autofill-cart.png');
    
    console.log('📸 3. Generating NLP processing screenshot with payment question on /help page...');
    
    // Navigate to help page for NLP processing
    await page.goto(`${CONFIG.baseUrl}/help`);
    await waitForApp(page);

    // Look for NLP input area on help page
    const nlpSelectors = [
      'textarea[placeholder*="question"]',
      'textarea[placeholder*="feedback"]',
      'textarea[placeholder*="message"]',
      'input[placeholder*="question"]',
      'input[placeholder*="feedback"]',
      '[data-testid="nlp-input"]',
      '.nlp-input',
      'textarea',
      'input[type="text"]:not([placeholder*="search"]):not([placeholder*="product"])'
    ];

    let foundNlpInput = false;
    for (const selector of nlpSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        await element.scrollIntoViewIfNeeded();
        await element.fill('Which payment methods do you provide?');
        await page.waitForTimeout(1000);
        
        // Look for process button
        const processButtons = [
          'button:has-text("Process")',
          'button:has-text("Analyze")',
          'button:has-text("Submit")',
          'button:has-text("Send")',
          'button:has-text("Ask")',
          '[data-testid="nlp-process"]'
        ];
        
        for (const btnSelector of processButtons) {
          const btn = page.locator(btnSelector).first();
          if (await btn.isVisible()) {
            await btn.click();
            await page.waitForTimeout(2000);
            break;
          }
        }
        
        foundNlpInput = true;
        break;
      }
    }
    
    await takeScreenshot(page, 'nlp-processing.png');
    
    console.log('📸 4. Generating invoice automation screenshot with "Load Sample Invoice" clicked...');
    
    // Navigate to invoicing page
    await page.goto(`${CONFIG.baseUrl}/invoicing`);
    await waitForApp(page);

    // Look for "Load Sample Invoice" button
    const invoiceButtonSelectors = [
      'button:has-text("Load Sample Invoice")',
      'button:has-text("Load Sample")',
      'button:has-text("Sample Invoice")',
      '[data-testid="load-sample-invoice"]',
      '.load-sample-btn'
    ];

    let foundInvoiceButton = false;
    for (const selector of invoiceButtonSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        await element.scrollIntoViewIfNeeded();
        await element.click();
        await page.waitForTimeout(2000);
        foundInvoiceButton = true;
        break;
      }
    }
    
    await takeScreenshot(page, 'invoice-automation.png');
    
    console.log('✅ Specific screenshot generation completed!');
    console.log(`📁 Screenshots saved to: ${CONFIG.screenshotDir}`);
    
    // Summary
    console.log('\n📋 Summary:');
    console.log(`✓ Tag prediction (/products): ${foundTagInput ? 'Found input, added "rye bread"' : 'Input field not found, screenshot taken anyway'}`);
    console.log(`✓ Autofill: ${foundAutofill ? 'Found button, clicked it' : 'Button not found, screenshot taken anyway'}`);
    console.log(`✓ NLP processing (/help): ${foundNlpInput ? 'Found input, added payment question' : 'Input field not found, screenshot taken anyway'}`);
    console.log(`✓ Invoice automation (/invoicing): ${foundInvoiceButton ? 'Found button, clicked "Load Sample Invoice"' : 'Button not found, screenshot taken anyway'}`);
    
  } catch (error) {
    console.error('❌ Error generating screenshots:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
📸 Specific Screenshot Generator

This script generates the four specific screenshots with custom content:
1. tag-prediction.png - with "rye bread" text on /products page
2. autofill-cart.png - with autofill button clicked  
3. nlp-processing.png - with "Which payment methods do you provide?" text on /help page
4. invoice-automation.png - with "Load Sample Invoice" button clicked on /invoicing page

Usage: node scripts/generate-specific-screenshots.js

Prerequisites:
- Application running on http://localhost:3000
- Playwright browsers installed: npx playwright install
    `);
    process.exit(0);
  }
  
  generateSpecificScreenshots();
}

module.exports = { generateSpecificScreenshots };