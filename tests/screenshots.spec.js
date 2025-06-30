/**
 * Playwright screenshot automation for Aito Grocery Store Demo
 * Captures screenshots for tutorials, documentation, and marketing materials
 */

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// Configuration
const SCREENSHOT_BASE_DIR = './docs/screenshots';
const APP_URL = 'http://localhost:3000';
const WAIT_TIME = 2000; // Wait for animations and loading

// Ensure screenshot directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Screenshot utility function
const takeScreenshot = async (page, name, options = {}) => {
  const {
    fullPage = true,
    directory = 'general',
    clip = null,
    mask = []
  } = options;

  const screenshotDir = path.join(SCREENSHOT_BASE_DIR, directory);
  ensureDir(screenshotDir);

  const screenshotPath = path.join(screenshotDir, `${name}.png`);
  
  await page.screenshot({
    path: screenshotPath,
    fullPage,
    clip,
    mask
  });

  console.log(`Screenshot saved: ${screenshotPath}`);
};

// User personas for personalized screenshots
const users = [
  { name: 'larry', displayName: 'Larry (Young Male)' },
  { name: 'veronica', displayName: 'Veronica (Older Female)' },
  { name: 'alice', displayName: 'Alice (Young Female)' }
];

test.describe('Aito Grocery Store Screenshots', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent screenshots
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Navigate to the app
    await page.goto(APP_URL);
    
    // Wait for app to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(WAIT_TIME);
  });

  test('Landing Page Screenshots', async ({ page }) => {
    // Full landing page
    await takeScreenshot(page, 'landing-page-full', {
      directory: 'marketing',
      fullPage: true
    });

    // Hero section only
    await takeScreenshot(page, 'landing-page-hero', {
      directory: 'marketing',
      fullPage: false,
      clip: { x: 0, y: 0, width: 1280, height: 600 }
    });

    // Use cases section
    const useCasesSection = page.locator('.use-cases-section');
    if (await useCasesSection.isVisible()) {
      await useCasesSection.scrollIntoViewIfNeeded();
      await takeScreenshot(page, 'landing-page-use-cases', {
        directory: 'marketing',
        fullPage: false,
        clip: { x: 0, y: 400, width: 1280, height: 800 }
      });
    }
  });

  test('Search Feature Screenshots', async ({ page }) => {
    // Click "Try the Demo" to enter the app
    await page.click('text=Try the Demo');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(WAIT_TIME);

    for (const user of users) {
      // Select user
      await page.selectOption('select', user.name);
      await page.waitForTimeout(1000);

      // Empty search state
      await takeScreenshot(page, `search-empty-${user.name}`, {
        directory: 'tutorials',
        fullPage: false
      });

      // Search for "milk"
      await page.fill('input[placeholder*="Search"]', 'milk');
      await page.waitForTimeout(2000); // Wait for search results

      await takeScreenshot(page, `search-results-milk-${user.name}`, {
        directory: 'tutorials',
        fullPage: false
      });

      // Clear search
      await page.fill('input[placeholder*="Search"]', '');
      await page.waitForTimeout(1000);
    }
  });

  test('Recommendations Screenshots', async ({ page }) => {
    await page.click('text=Try the Demo');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(WAIT_TIME);

    for (const user of users) {
      await page.selectOption('select', user.name);
      await page.waitForTimeout(1000);

      // Recommendations section
      const recommendationsSection = page.locator('.recommendations-section, [data-testid="recommendations"]');
      if (await recommendationsSection.isVisible()) {
        await recommendationsSection.scrollIntoViewIfNeeded();
        await takeScreenshot(page, `recommendations-${user.name}`, {
          directory: 'tutorials',
          fullPage: false
        });
      }
    }
  });

  test('Product Page Screenshots', async ({ page }) => {
    await page.click('text=Try the Demo');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(WAIT_TIME);

    // Navigate to Product Analytics page
    const productLink = page.locator('text=Product Analytics, a[href*="product"]').first();
    if (await productLink.isVisible()) {
      await productLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(WAIT_TIME);

      await takeScreenshot(page, 'product-analytics-full', {
        directory: 'tutorials',
        fullPage: true
      });

      // Analytics charts section
      const chartsSection = page.locator('.charts-section, .analytics-charts');
      if (await chartsSection.isVisible()) {
        await chartsSection.scrollIntoViewIfNeeded();
        await takeScreenshot(page, 'product-analytics-charts', {
          directory: 'tutorials',
          fullPage: false
        });
      }
    }
  });

  test('Invoice Processing Screenshots', async ({ page }) => {
    await page.click('text=Try the Demo');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(WAIT_TIME);

    // Navigate to Invoice Processing
    const invoiceLink = page.locator('text=Invoice Processing, a[href*="invoice"]').first();
    if (await invoiceLink.isVisible()) {
      await invoiceLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(WAIT_TIME);

      await takeScreenshot(page, 'invoice-processing-full', {
        directory: 'tutorials',
        fullPage: true
      });

      // Invoice list
      const invoiceList = page.locator('.invoice-list, .invoices-table');
      if (await invoiceList.isVisible()) {
        await takeScreenshot(page, 'invoice-list', {
          directory: 'tutorials',
          fullPage: false
        });
      }
    }
  });

  test('Chat Interface Screenshots', async ({ page }) => {
    await page.click('text=Try the Demo');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(WAIT_TIME);

    // Navigate to Customer Chat
    const chatLink = page.locator('text=Customer Chat, a[href*="chat"]').first();
    if (await chatLink.isVisible()) {
      await chatLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(WAIT_TIME);

      await takeScreenshot(page, 'customer-chat-interface', {
        directory: 'tutorials',
        fullPage: false
      });

      // Try sending a message
      const chatInput = page.locator('textarea, input[type="text"]').last();
      if (await chatInput.isVisible()) {
        await chatInput.fill('I need help with my order');
        await page.waitForTimeout(1000);
        
        await takeScreenshot(page, 'customer-chat-with-message', {
          directory: 'tutorials',
          fullPage: false
        });
      }
    }
  });

  test('Admin Dashboard Screenshots', async ({ page }) => {
    await page.click('text=Try the Demo');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(WAIT_TIME);

    // Navigate to Admin Analytics
    const adminLink = page.locator('text=Admin Analytics, a[href*="admin"]').first();
    if (await adminLink.isVisible()) {
      await adminLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(WAIT_TIME);

      await takeScreenshot(page, 'admin-dashboard-full', {
        directory: 'tutorials',
        fullPage: true
      });

      // Individual dashboard sections
      const sections = [
        { selector: '.analytics-overview', name: 'admin-overview' },
        { selector: '.charts-container', name: 'admin-charts' },
        { selector: '.metrics-grid', name: 'admin-metrics' }
      ];

      for (const section of sections) {
        const element = page.locator(section.selector);
        if (await element.isVisible()) {
          await element.scrollIntoViewIfNeeded();
          await takeScreenshot(page, section.name, {
            directory: 'tutorials',
            fullPage: false
          });
        }
      }
    }
  });

  test('Mobile Screenshots', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(WAIT_TIME);

    // Mobile landing page
    await takeScreenshot(page, 'mobile-landing-page', {
      directory: 'marketing',
      fullPage: true
    });

    // Enter the demo app
    await page.click('text=Try the Demo');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(WAIT_TIME);

    // Mobile app interface
    await takeScreenshot(page, 'mobile-app-interface', {
      directory: 'marketing',
      fullPage: false
    });

    // Mobile search
    await page.fill('input[placeholder*="Search"]', 'bread');
    await page.waitForTimeout(2000);
    
    await takeScreenshot(page, 'mobile-search-results', {
      directory: 'tutorials',
      fullPage: false
    });
  });

  test('High-res Marketing Screenshots', async ({ page }) => {
    // Set high resolution for marketing materials
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(WAIT_TIME);

    // High-res landing page
    await takeScreenshot(page, 'landing-page-hires', {
      directory: 'marketing',
      fullPage: true
    });

    // Enter demo
    await page.click('text=Try the Demo');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(WAIT_TIME);

    // High-res app interface
    await takeScreenshot(page, 'app-interface-hires', {
      directory: 'marketing',
      fullPage: false
    });

    // Show search in action
    await page.fill('input[placeholder*="Search"]', 'organic');
    await page.waitForTimeout(2000);

    await takeScreenshot(page, 'search-demo-hires', {
      directory: 'marketing',
      fullPage: false
    });
  });
});