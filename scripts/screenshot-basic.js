#!/usr/bin/env node

/**
 * Basic Screenshot Generator - Essential Screenshots Only
 * Focuses on the most important screenshots without complex navigation
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  screenshotDir: './docs/screenshots/features',
  viewport: { width: 1280, height: 720 },
  waitTime: 3000
};

// Ensure directory exists
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Screenshot utility
const takeScreenshot = async (page, name, options = {}) => {
  const { fullPage = false } = options;
  
  ensureDir(CONFIG.screenshotDir);
  const screenshotPath = path.join(CONFIG.screenshotDir, `${name}.png`);
  
  await page.screenshot({
    path: screenshotPath,
    fullPage
  });

  console.log(`✓ Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
};

// Wait for app
const waitForApp = async (page) => {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(CONFIG.waitTime);
};

async function generateBasicScreenshots() {
  console.log('🚀 Starting basic screenshot capture...');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: CONFIG.viewport
  });
  
  const page = await context.newPage();

  try {
    // 1. Landing Page
    console.log('\n📸 1. Landing Page');
    await page.goto(CONFIG.baseUrl);
    await waitForApp(page);
    await takeScreenshot(page, 'landing-page', { fullPage: true });

    // 2. Try to navigate to demo (if possible)
    try {
      console.log('\n📸 2. Attempting to access demo interface...');
      
      // Try direct URL navigation instead of clicking
      await page.goto(`${CONFIG.baseUrl}#demo`);
      await waitForApp(page);
      
      // Or try common navigation paths
      const demoButton = page.locator('text=Try the Demo, text=Enter Demo, a[href*="demo"], button:has-text("Demo")').first();
      if (await demoButton.isVisible({ timeout: 2000 })) {
        await demoButton.click();
        await waitForApp(page);
        await takeScreenshot(page, 'demo-interface');
      }
      
    } catch (navError) {
      console.log('⚠️  Could not navigate to demo interface, continuing with landing page screenshots');
    }

    // 3. Try different URLs that might exist
    const urls = [
      { path: '/demo', name: 'demo-page' },
      { path: '/app', name: 'app-page' },
      { path: '/#/demo', name: 'spa-demo' },
      { path: '/?demo=true', name: 'demo-param' }
    ];

    for (const urlTest of urls) {
      try {
        console.log(`📸 Testing URL: ${urlTest.path}`);
        await page.goto(CONFIG.baseUrl + urlTest.path);
        await page.waitForTimeout(2000);
        
        // Check if page loaded successfully (not 404)
        const title = await page.title();
        if (!title.includes('404') && !title.includes('Not Found')) {
          await waitForApp(page);
          await takeScreenshot(page, urlTest.name);
          console.log(`✓ Successfully captured: ${urlTest.name}`);
        }
      } catch (urlError) {
        console.log(`⚠️  Could not access ${urlTest.path}`);
      }
    }

    // 4. Take different viewport screenshots of landing page
    console.log('\n📸 4. Mobile viewport landing page');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(CONFIG.baseUrl);
    await waitForApp(page);
    await takeScreenshot(page, 'mobile-landing');

    // 5. High-res landing page
    console.log('\n📸 5. High-resolution landing page');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(CONFIG.baseUrl);
    await waitForApp(page);
    await takeScreenshot(page, 'landing-page-hires', { fullPage: true });

    console.log('\n✅ Basic screenshot generation completed!');
    
  } catch (error) {
    console.error('❌ Error generating screenshots:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// CLI execution
if (require.main === module) {
  generateBasicScreenshots();
}

module.exports = { generateBasicScreenshots };