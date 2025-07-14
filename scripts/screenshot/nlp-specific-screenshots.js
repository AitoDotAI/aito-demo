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
    
    // Find the input element
    const input = page.locator('textarea, input[type="text"]').first();
    const processButton = page.locator('button:has-text("Process"), button:has-text("Analyze"), button[type="submit"]').first();
    
    // Check if elements exist
    const inputVisible = await input.isVisible();
    const buttonVisible = await processButton.isVisible();
    
    console.log(`Input visible: ${inputVisible}, Button visible: ${buttonVisible}`);
    
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
    
    // Scenario 1: App keeps crashing
    console.log('📱 Testing scenario 1: App keeps crashing');
    await input.fill('App keeps crashing');
    await page.waitForTimeout(1000);
    
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'nlp-processing-crash-query.png'),
      fullPage: false
    });
    console.log('✅ Generated: nlp-processing-crash-query.png');
    
    if (buttonVisible) {
      await processButton.click();
      await page.waitForTimeout(3000);
      
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'nlp-processing-crash-result.png'),
        fullPage: false
      });
      console.log('✅ Generated: nlp-processing-crash-result.png');
    }
    
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
    
    if (buttonVisible) {
      await processButton.click();
      await page.waitForTimeout(3000);
      
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'nlp-processing-bananas-result.png'),
        fullPage: false
      });
      console.log('✅ Generated: nlp-processing-bananas-result.png');
    }
    
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