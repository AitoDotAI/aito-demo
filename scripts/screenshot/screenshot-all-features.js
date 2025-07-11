#!/usr/bin/env node

/**
 * Comprehensive Screenshot Generator for All Aito Demo Features
 * Captures all main functionalities for documentation and marketing
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  screenshotDir: './docs/screenshots',
  viewports: {
    desktop: { width: 1280, height: 720 },
    mobile: { width: 375, height: 667 },
    wide: { width: 1440, height: 900 }
  },
  waitTime: 2000,
  users: [
    { name: 'larry', displayName: 'Larry (Lactose Intolerant)' },
    { name: 'veronica', displayName: 'Veronica (Health Conscious)' },
    { name: 'alice', displayName: 'Alice (General Shopper)' }
  ]
};

// Ensure directory exists
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Screenshot utility
const takeScreenshot = async (page, name, options = {}) => {
  const {
    fullPage = false,
    directory = 'features',
    clip = null,
    suffix = ''
  } = options;

  const screenshotDir = path.join(CONFIG.screenshotDir, directory);
  ensureDir(screenshotDir);

  const filename = suffix ? `${name}-${suffix}.png` : `${name}.png`;
  const screenshotPath = path.join(screenshotDir, filename);
  
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

// Wait for app
const waitForApp = async (page) => {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(CONFIG.waitTime);
};

// Main screenshot functions
async function captureAllFeatures() {
  console.log('🚀 Starting comprehensive screenshot capture...');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: CONFIG.viewports.desktop
  });
  
  const page = await context.newPage();

  try {
    // 1. Landing Page
    console.log('\n📸 1. Landing Page');
    await page.goto(CONFIG.baseUrl);
    await waitForApp(page);
    await takeScreenshot(page, 'landing-page', { directory: 'features', fullPage: true });

    // Navigate to main app - try demo button if exists, otherwise go directly
    try {
      await page.waitForSelector('text=Try the Demo', { timeout: 3000 });
      await page.click('text=Try the Demo');
      await waitForApp(page);
    } catch (error) {
      console.log('No demo button found, navigating directly to main app...');
      await page.goto(`${CONFIG.baseUrl}/`);
      await waitForApp(page);
    }

    // 2. Smart Search Feature
    console.log('\n📸 2. Smart Search (Personalized)');
    
    // Ensure we're on the main page with user selector
    try {
      await page.waitForSelector('select', { timeout: 5000 });
    } catch (error) {
      console.log('User selector not found, we might already be in the app');
    }
    
    for (const user of CONFIG.users) {
      try {
        await page.selectOption('select', user.name);
        await page.waitForTimeout(1000);
      } catch (error) {
        console.log(`Skipping user ${user.name} - selector not available`);
        continue;
      }
      
      // Search for milk - shows different results per user
      await page.fill('input[placeholder*="Search"]', 'milk');
      await page.waitForTimeout(2000);
      
      await takeScreenshot(page, 'smart-search-milk', {
        directory: 'features',
        suffix: user.name
      });
      
      await page.fill('input[placeholder*="Search"]', '');
    }

    // 3. Recommendations
    console.log('\n📸 3. Personalized Recommendations');
    await page.selectOption('select', 'veronica');
    await page.waitForTimeout(1000);
    
    // Show recommendations section
    const recoSection = page.locator('.recommendations-section, [data-testid="recommendations"]').first();
    if (await recoSection.isVisible()) {
      await recoSection.scrollIntoViewIfNeeded();
      await takeScreenshot(page, 'recommendations-veronica', { directory: 'features' });
    }

    // Add items to cart to show dynamic recommendations
    const firstProduct = page.locator('.product-list-item button').first();
    if (await firstProduct.isVisible()) {
      await firstProduct.click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'recommendations-dynamic', { directory: 'features' });
    }

    // 4. Autocomplete
    console.log('\n📸 4. Intelligent Autocomplete');
    await page.fill('input[placeholder*="Search"]', 'br');
    await page.waitForTimeout(1500);
    await takeScreenshot(page, 'autocomplete-suggestions', { directory: 'features' });
    await page.fill('input[placeholder*="Search"]', '');

    // 5. Shopping Assistant
    console.log('\n📸 5. Shopping Assistant (Customer Chat)');
    await page.goto(`${CONFIG.baseUrl}/customer-chat`);
    await waitForApp(page);
    await takeScreenshot(page, 'shopping-assistant-interface', { directory: 'features' });
    
    // Type a message
    const chatInput = page.locator('textarea, input[placeholder*="Type"]').last();
    if (await chatInput.isVisible()) {
      await chatInput.fill('I need gluten-free bread options');
      await page.waitForTimeout(500);
      await takeScreenshot(page, 'shopping-assistant-query', { directory: 'features' });
      
      // Send message and wait for response
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
      await takeScreenshot(page, 'shopping-assistant-response', { directory: 'features' });
    }

    // 6. Admin Assistant
    console.log('\n📸 6. Admin Assistant (Business Intelligence)');
    await page.goto(`${CONFIG.baseUrl}/admin-chat`);
    await waitForApp(page);
    await takeScreenshot(page, 'admin-assistant-interface', { directory: 'features' });
    
    // Admin query
    const adminInput = page.locator('textarea, input[placeholder*="Type"]').last();
    if (await adminInput.isVisible()) {
      await adminInput.fill('What are the top selling products this week?');
      await page.waitForTimeout(500);
      await takeScreenshot(page, 'admin-assistant-query', { directory: 'features' });
    }

    // 7. Invoice Processing
    console.log('\n📸 7. Invoice Automation');
    await page.goto(`${CONFIG.baseUrl}/invoicing`);
    await waitForApp(page);
    await takeScreenshot(page, 'invoice-processing-list', { directory: 'features', fullPage: true });
    
    // Click on an invoice to show details
    const firstInvoice = page.locator('.invoice-item, tr').nth(1);
    if (await firstInvoice.isVisible()) {
      await firstInvoice.click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'invoice-processing-detail', { directory: 'features' });
    }

    // 8. Analytics Dashboard
    console.log('\n📸 8. Analytics & Insights');
    await page.goto(`${CONFIG.baseUrl}/analytics`);
    await waitForApp(page);
    await takeScreenshot(page, 'analytics-dashboard', { directory: 'features', fullPage: true });
    
    // Specific chart sections
    const chartSections = [
      { selector: '.punch-card', name: 'analytics-heatmap' },
      { selector: '.chart-container', name: 'analytics-trends' }
    ];
    
    for (const section of chartSections) {
      const element = page.locator(section.selector).first();
      if (await element.isVisible()) {
        await element.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);
        await takeScreenshot(page, section.name, { directory: 'features' });
      }
    }

    // 9. NLP Processing (Prompts)
    console.log('\n📸 9. NLP Processing');
    await page.goto(`${CONFIG.baseUrl}/help`);
    await waitForApp(page);
    
    // Show prompt analysis
    const promptInput = page.locator('textarea, input[placeholder*="feedback"]').first();
    if (await promptInput.isVisible()) {
      await promptInput.fill('The organic vegetables were not fresh');
      await page.waitForTimeout(500);
      await takeScreenshot(page, 'nlp-processing-input', { directory: 'features' });
      
      // Submit and show analysis
      const analyzeBtn = page.locator('button:has-text("Analyze"), button:has-text("Submit")').first();
      if (await analyzeBtn.isVisible()) {
        await analyzeBtn.click();
        await page.waitForTimeout(2000);
        await takeScreenshot(page, 'nlp-processing-result', { directory: 'features' });
      }
    }

    // 10. Product Page with Relationship Analysis
    console.log('\n📸 10. Product Analytics & Relationships');
    await page.goto(`${CONFIG.baseUrl}/product`);
    await waitForApp(page);
    await takeScreenshot(page, 'product-analytics-page', { directory: 'features', fullPage: true });
    
    // Select a specific product to show relationships
    const productSelect = page.locator('select').nth(1);
    if (await productSelect.isVisible()) {
      await productSelect.selectOption({ index: 5 });
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'product-relationships', { directory: 'features' });
    }

    // 11. Tag Prediction
    console.log('\n📸 11. Tag Prediction');
    await page.goto(CONFIG.baseUrl);
    await page.click('text=Try the Demo');
    await waitForApp(page);
    
    // Find tag input area (usually in admin or product management)
    const tagInput = page.locator('input[placeholder*="tag"], input[placeholder*="Tag"]').first();
    if (await tagInput.isVisible()) {
      await tagInput.fill('New Organic Product');
      await page.waitForTimeout(1500);
      await takeScreenshot(page, 'tag-prediction-suggestions', { directory: 'features' });
    }

    // 12. Cart Management
    console.log('\n📸 12. Cart & Checkout');
    await page.goto(`${CONFIG.baseUrl}/cart`);
    await waitForApp(page);
    await takeScreenshot(page, 'cart-management', { directory: 'features' });

    // Mobile Screenshots
    console.log('\n📸 13. Mobile Responsive Views');
    await page.setViewportSize(CONFIG.viewports.mobile);
    
    // Mobile landing
    await page.goto(CONFIG.baseUrl);
    await waitForApp(page);
    await takeScreenshot(page, 'mobile-landing', { directory: 'features' });
    
    // Mobile app
    await page.click('text=Try the Demo');
    await waitForApp(page);
    await takeScreenshot(page, 'mobile-app-interface', { directory: 'features' });
    
    // Mobile chat
    await page.click('button[aria-label*="chat"], .chat-widget-button').first();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'mobile-chat-widget', { directory: 'features' });

    console.log('\n✅ All feature screenshots captured successfully!');
    
  } catch (error) {
    console.error('❌ Error capturing screenshots:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// CLI execution
if (require.main === module) {
  captureAllFeatures();
}

module.exports = { captureAllFeatures };