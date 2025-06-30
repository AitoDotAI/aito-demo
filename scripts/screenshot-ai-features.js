#!/usr/bin/env node

/**
 * AI Features Screenshot Generator
 * Focused on shopping and admin assistants + core ML features
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const CONFIG = {
  baseUrl: 'http://localhost:3000',
  screenshotDir: './docs/screenshots/features',
  viewport: { width: 1280, height: 720 },
  waitTime: 3000
};

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const takeScreenshot = async (page, name, options = {}) => {
  const { fullPage = false, clip = null } = options;
  ensureDir(CONFIG.screenshotDir);
  
  const screenshotPath = path.join(CONFIG.screenshotDir, `${name}.png`);
  const screenshotOptions = { path: screenshotPath, fullPage };
  
  if (clip) {
    screenshotOptions.clip = clip;
  }
  
  await page.screenshot(screenshotOptions);
  console.log(`✓ ${name}.png`);
  return screenshotPath;
};

async function captureAIFeatures() {
  console.log('🤖 AI Features Screenshot Generator\n');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({ viewport: CONFIG.viewport });
  const page = await context.newPage();

  try {
    // 1. Main App Interface
    console.log('📸 Main Interface...');
    await page.goto(CONFIG.baseUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(CONFIG.waitTime);
    
    // Skip demo button and go straight to app
    try {
      await page.waitForSelector('text=Try the Demo', { timeout: 3000 });
      await page.click('text=Try the Demo');
      await page.waitForTimeout(2000);
    } catch (error) {
      // If no demo button, we're likely already in the app
    }
    
    await takeScreenshot(page, 'main-app-interface');

    // 2. Shopping Assistant 
    console.log('📸 Shopping Assistant...');
    await page.goto(`${CONFIG.baseUrl}/customer-chat`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(CONFIG.waitTime);
    await takeScreenshot(page, 'shopping-assistant', { fullPage: true });

    // 3. Admin Assistant
    console.log('📸 Admin Assistant...');
    await page.goto(`${CONFIG.baseUrl}/admin-chat`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(CONFIG.waitTime);
    await takeScreenshot(page, 'admin-assistant', { fullPage: true });

    // 4. Analytics Dashboard
    console.log('📸 Analytics Dashboard...');
    await page.goto(`${CONFIG.baseUrl}/analytics`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(CONFIG.waitTime);
    await takeScreenshot(page, 'analytics-dashboard', { fullPage: true });

    // 5. Invoice Processing
    console.log('📸 Invoice Processing...');
    await page.goto(`${CONFIG.baseUrl}/invoicing`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(CONFIG.waitTime);
    await takeScreenshot(page, 'invoice-automation', { fullPage: true });

    // 6. Product Analytics
    console.log('📸 Product Analytics...');
    await page.goto(`${CONFIG.baseUrl}/product`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(CONFIG.waitTime);
    await takeScreenshot(page, 'product-analytics', { fullPage: true });

    // 7. Help & NLP
    console.log('📸 NLP Processing...');
    await page.goto(`${CONFIG.baseUrl}/help`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(CONFIG.waitTime);
    await takeScreenshot(page, 'nlp-processing', { fullPage: true });

    console.log('\n✅ AI feature screenshots completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  captureAIFeatures();
}

module.exports = { captureAIFeatures };