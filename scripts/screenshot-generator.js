#!/usr/bin/env node

/**
 * Screenshot Generator Utility
 * Automated screenshot capture for tutorials, documentation, and marketing
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
    tablet: { width: 768, height: 1024 },
    highRes: { width: 1920, height: 1080 }
  },
  waitTime: 2000,
  users: [
    { name: 'larry', displayName: 'Larry (Young Male)' },
    { name: 'veronica', displayName: 'Veronica (Older Female)' },
    { name: 'alice', displayName: 'Alice (Young Female)' }
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
    fullPage = true,
    directory = 'general',
    clip = null,
    mask = [],
    suffix = ''
  } = options;

  const screenshotDir = path.join(CONFIG.screenshotDir, directory);
  ensureDir(screenshotDir);

  const filename = suffix ? `${name}-${suffix}.png` : `${name}.png`;
  const screenshotPath = path.join(screenshotDir, filename);
  
  await page.screenshot({
    path: screenshotPath,
    fullPage,
    clip,
    mask
  });

  console.log(`✓ Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
};

// Wait for app to be ready
const waitForApp = async (page) => {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(CONFIG.waitTime);
};

// Screenshot generators
const screenshotGenerators = {
  
  async landingPage(page) {
    console.log('📸 Capturing landing page screenshots...');
    
    await page.goto(CONFIG.baseUrl);
    await waitForApp(page);

    // Full landing page
    await takeScreenshot(page, 'landing-page-full', {
      directory: 'marketing',
      fullPage: true
    });

    // Hero section
    await takeScreenshot(page, 'landing-page-hero', {
      directory: 'marketing',
      fullPage: false,
      clip: { x: 0, y: 0, width: 1280, height: 600 }
    });
  },

  async searchFeatures(page) {
    console.log('📸 Capturing search feature screenshots...');
    
    await page.goto(CONFIG.baseUrl);
    await page.click('text=Try the Demo');
    await waitForApp(page);

    for (const user of CONFIG.users) {
      console.log(`  📱 Capturing for user: ${user.displayName}`);
      
      // Select user
      await page.selectOption('select', user.name);
      await page.waitForTimeout(1000);

      // Empty search state
      await takeScreenshot(page, 'search-empty', {
        directory: 'tutorials',
        suffix: user.name
      });

      // Search for different terms
      const searchTerms = ['milk', 'bread', 'organic'];
      for (const term of searchTerms) {
        await page.fill('input[placeholder*="Search"]', term);
        await page.waitForTimeout(2000);

        await takeScreenshot(page, `search-results-${term}`, {
          directory: 'tutorials',
          suffix: user.name
        });
      }

      // Clear search
      await page.fill('input[placeholder*="Search"]', '');
      await page.waitForTimeout(1000);
    }
  },

  async recommendations(page) {
    console.log('📸 Capturing recommendation screenshots...');
    
    await page.goto(CONFIG.baseUrl);
    await page.click('text=Try the Demo');
    await waitForApp(page);

    for (const user of CONFIG.users) {
      await page.selectOption('select', user.name);
      await page.waitForTimeout(1000);

      const recommendationsSection = page.locator('.recommendations-section, [data-testid="recommendations"]').first();
      if (await recommendationsSection.isVisible()) {
        await recommendationsSection.scrollIntoViewIfNeeded();
        await takeScreenshot(page, 'recommendations', {
          directory: 'tutorials',
          suffix: user.name
        });
      }
    }
  },

  async invoiceProcessing(page) {
    console.log('📸 Capturing invoice processing screenshots...');
    
    await page.goto(CONFIG.baseUrl);
    await page.click('text=Try the Demo');
    await waitForApp(page);

    // Navigate to Invoice Processing
    const invoiceLink = page.locator('text=Invoice Processing, a[href*="invoice"]').first();
    if (await invoiceLink.isVisible()) {
      await invoiceLink.click();
      await waitForApp(page);

      await takeScreenshot(page, 'invoice-processing-full', {
        directory: 'tutorials',
        fullPage: true
      });

      // Invoice list
      const invoiceList = page.locator('.invoice-list, .invoices-table').first();
      if (await invoiceList.isVisible()) {
        await takeScreenshot(page, 'invoice-list', {
          directory: 'tutorials'
        });
      }
    }
  },

  async chatInterface(page) {
    console.log('📸 Capturing chat interface screenshots...');
    
    await page.goto(CONFIG.baseUrl);
    await page.click('text=Try the Demo');
    await waitForApp(page);

    // Customer Chat
    const chatLink = page.locator('text=Customer Chat, a[href*="chat"]').first();
    if (await chatLink.isVisible()) {
      await chatLink.click();
      await waitForApp(page);

      await takeScreenshot(page, 'customer-chat-interface', {
        directory: 'tutorials'
      });

      // Try sending a message
      const chatInput = page.locator('textarea, input[type="text"]').last();
      if (await chatInput.isVisible()) {
        await chatInput.fill('I need help with my order');
        await page.waitForTimeout(1000);
        
        await takeScreenshot(page, 'customer-chat-with-message', {
          directory: 'tutorials'
        });
      }
    }
  },

  async adminDashboard(page) {
    console.log('📸 Capturing admin dashboard screenshots...');
    
    await page.goto(CONFIG.baseUrl);
    await page.click('text=Try the Demo');
    await waitForApp(page);

    const adminLink = page.locator('text=Admin Analytics, a[href*="admin"]').first();
    if (await adminLink.isVisible()) {
      await adminLink.click();
      await waitForApp(page);

      await takeScreenshot(page, 'admin-dashboard-full', {
        directory: 'tutorials',
        fullPage: true
      });
    }
  },

  async mobileViews(page) {
    console.log('📸 Capturing mobile view screenshots...');
    
    // Set mobile viewport
    await page.setViewportSize(CONFIG.viewports.mobile);
    
    await page.goto(CONFIG.baseUrl);
    await waitForApp(page);

    // Mobile landing page
    await takeScreenshot(page, 'mobile-landing-page', {
      directory: 'marketing',
      fullPage: true
    });

    // Enter demo
    await page.click('text=Try the Demo');
    await waitForApp(page);

    // Mobile app interface
    await takeScreenshot(page, 'mobile-app-interface', {
      directory: 'marketing'
    });

    // Mobile search
    await page.fill('input[placeholder*="Search"]', 'bread');
    await page.waitForTimeout(2000);
    
    await takeScreenshot(page, 'mobile-search-results', {
      directory: 'tutorials'
    });
  },

  async highResMarketing(page) {
    console.log('📸 Capturing high-resolution marketing screenshots...');
    
    // Set high-res viewport
    await page.setViewportSize(CONFIG.viewports.highRes);
    
    await page.goto(CONFIG.baseUrl);
    await waitForApp(page);

    // High-res landing page
    await takeScreenshot(page, 'landing-page-hires', {
      directory: 'marketing',
      fullPage: true
    });

    // Enter demo
    await page.click('text=Try the Demo');
    await waitForApp(page);

    // High-res app interface
    await takeScreenshot(page, 'app-interface-hires', {
      directory: 'marketing'
    });

    // Search demo
    await page.fill('input[placeholder*="Search"]', 'organic');
    await page.waitForTimeout(2000);

    await takeScreenshot(page, 'search-demo-hires', {
      directory: 'marketing'
    });
  }
};

// Main execution function
async function generateScreenshots(types = []) {
  console.log('🚀 Starting screenshot generation...');
  
  // Ensure base screenshot directory exists
  ensureDir(CONFIG.screenshotDir);
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: CONFIG.viewports.desktop
  });
  
  const page = await context.newPage();

  try {
    // If no specific types requested, run all
    const requestedTypes = types.length > 0 ? types : Object.keys(screenshotGenerators);
    
    for (const type of requestedTypes) {
      if (screenshotGenerators[type]) {
        await screenshotGenerators[type](page);
        // Reset viewport for next generator
        await page.setViewportSize(CONFIG.viewports.desktop);
      } else {
        console.warn(`⚠️  Unknown screenshot type: ${type}`);
      }
    }
    
    console.log('✅ Screenshot generation completed!');
    console.log(`📁 Screenshots saved to: ${CONFIG.screenshotDir}`);
    
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
  const types = args.length > 0 ? args : [];
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
📸 Screenshot Generator for Aito Grocery Store Demo

Usage: node scripts/screenshot-generator.js [types...]

Available types:
  landingPage       - Landing page marketing screenshots
  searchFeatures    - Search functionality tutorials
  recommendations   - Recommendation system screenshots
  invoiceProcessing - Invoice processing workflow
  chatInterface     - Customer chat interface
  adminDashboard    - Admin analytics dashboard
  mobileViews       - Mobile responsive screenshots
  highResMarketing  - High-resolution marketing materials

Examples:
  node scripts/screenshot-generator.js                    # Generate all screenshots
  node scripts/screenshot-generator.js landingPage        # Landing page only
  node scripts/screenshot-generator.js searchFeatures recommendations
    `);
    process.exit(0);
  }
  
  generateScreenshots(types);
}

module.exports = { generateScreenshots, screenshotGenerators };