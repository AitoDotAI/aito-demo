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
      console.log('⏳ Waiting for crash analysis results...');
      
      // Wait for results to appear - multiple strategies
      let resultsLoaded = false;
      
      // Strategy 1: Wait for common result selectors
      try {
        await page.waitForSelector('.result, .analysis, .prediction, .sentiment, .category, [data-testid*="result"], .answer', { timeout: 5000 });
        console.log('✅ Result elements appeared');
        resultsLoaded = true;
      } catch (e) {
        console.log('⚠️ No result elements found, trying other strategies...');
      }
      
      // Strategy 2: Wait for page content to change (indicating results loaded)
      if (!resultsLoaded) {
        try {
          await page.waitForFunction(() => {
            const body = document.body.textContent || '';
            return body.includes('sentiment') || body.includes('category') || 
                   body.includes('confidence') || body.includes('score') ||
                   body.includes('negative') || body.includes('positive') ||
                   body.includes('product') || body.includes('request');
          }, { timeout: 5000 });
          console.log('✅ Results detected by content analysis');
          resultsLoaded = true;
        } catch (e) {
          console.log('⚠️ Content analysis timeout, proceeding anyway...');
        }
      }
      
      // Additional wait for animations and rendering
      await page.waitForTimeout(resultsLoaded ? 2000 : 5000);
      
      // Debug: Show what content is on the page
      const pageContent = await page.textContent('body');
      console.log(`📝 Page content sample: ${pageContent.slice(0, 200)}...`);
      
      // Expand viewport to capture more content
      await page.setViewportSize({ width: 1280, height: 900 });
      
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'nlp-processing-crash-result.png'),
        fullPage: true  // Changed to capture entire page
      });
      console.log('✅ Generated: nlp-processing-crash-result.png');
      
      // Reset viewport
      await page.setViewportSize({ width: 1280, height: 720 });
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
      console.log('⏳ Waiting for bananas request analysis results...');
      
      // Wait for results to appear - multiple strategies
      let resultsLoaded = false;
      
      // Strategy 1: Wait for common result selectors
      try {
        await page.waitForSelector('.result, .analysis, .prediction, .sentiment, .category, [data-testid*="result"], .answer', { timeout: 5000 });
        console.log('✅ Result elements appeared');
        resultsLoaded = true;
      } catch (e) {
        console.log('⚠️ No result elements found, trying other strategies...');
      }
      
      // Strategy 2: Wait for page content to change (indicating results loaded)
      if (!resultsLoaded) {
        try {
          await page.waitForFunction(() => {
            const body = document.body.textContent || '';
            return body.includes('sentiment') || body.includes('category') || 
                   body.includes('confidence') || body.includes('score') ||
                   body.includes('negative') || body.includes('positive') ||
                   body.includes('product') || body.includes('request');
          }, { timeout: 5000 });
          console.log('✅ Results detected by content analysis');
          resultsLoaded = true;
        } catch (e) {
          console.log('⚠️ Content analysis timeout, proceeding anyway...');
        }
      }
      
      // Additional wait for animations and rendering
      await page.waitForTimeout(resultsLoaded ? 2000 : 5000);
      
      // Debug: Show what content is on the page
      const pageContent = await page.textContent('body');
      console.log(`📝 Page content sample: ${pageContent.slice(0, 200)}...`);
      
      // Expand viewport to capture more content
      await page.setViewportSize({ width: 1280, height: 900 });
      
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'nlp-processing-bananas-result.png'),
        fullPage: true  // Changed to capture entire page
      });
      console.log('✅ Generated: nlp-processing-bananas-result.png');
      
      // Reset viewport
      await page.setViewportSize({ width: 1280, height: 720 });
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