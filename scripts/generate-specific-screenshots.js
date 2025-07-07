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
  viewport: { width: 1280, height: 720 },
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
  
  await page.screenshot({
    path: screenshotPath,
    fullPage,
    clip
  });

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
    console.log('📸 1. Generating tag prediction screenshot with "rye bread"...');
    
    await page.goto(CONFIG.baseUrl);
    await waitForApp(page);

    // Try to find tag prediction area - check multiple possible locations
    const tagPredictionSelectors = [
      '[data-testid="tag-prediction"]',
      '.tag-prediction',
      'input[placeholder*="product"]',
      'input[placeholder*="name"]',
      'input[placeholder*="Product name"]',
      '.product-input'
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
    
    console.log('📸 3. Generating NLP processing screenshot with payment question...');
    
    // Look for NLP input area
    const nlpSelectors = [
      'textarea[placeholder*="question"]',
      'textarea[placeholder*="feedback"]',
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
    
    console.log('✅ Specific screenshot generation completed!');
    console.log(`📁 Screenshots saved to: ${CONFIG.screenshotDir}`);
    
    // Summary
    console.log('\n📋 Summary:');
    console.log(`✓ Tag prediction: ${foundTagInput ? 'Found input, added "rye bread"' : 'Input field not found, screenshot taken anyway'}`);
    console.log(`✓ Autofill: ${foundAutofill ? 'Found button, clicked it' : 'Button not found, screenshot taken anyway'}`);
    console.log(`✓ NLP processing: ${foundNlpInput ? 'Found input, added payment question' : 'Input field not found, screenshot taken anyway'}`);
    
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

This script generates the three specific screenshots with custom content:
1. tag-prediction.png - with "rye bread" text
2. autofill-cart.png - with autofill button clicked  
3. nlp-processing.png - with "Which payment methods do you provide?" text

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