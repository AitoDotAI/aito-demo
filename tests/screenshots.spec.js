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
  
  const screenshotOptions = {
    path: screenshotPath,
    fullPage,
    mask
  };
  
  if (clip) {
    screenshotOptions.clip = clip;
  }
  
  await page.screenshot(screenshotOptions);

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
    
    // Try to enter the demo if landing page is shown
    try {
      const demoButton = page.locator('text=Try the Demo');
      if (await demoButton.isVisible({ timeout: 3000 })) {
        await demoButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(WAIT_TIME);
      }
    } catch (error) {
      // Already in the app, continue
    }
  });

  test('Landing Page Screenshots', async ({ page }) => {
    // Navigate back to landing page
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(WAIT_TIME);
    
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
    // Make sure we're in the app's main view
    const userSelector = page.locator('select');
    
    for (const user of users) {
      // Select user if selector is available
      try {
        if (await userSelector.isVisible({ timeout: 3000 })) {
          await page.selectOption('select', user.name);
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        console.log(`User selector not found for ${user.name}, continuing...`);
      }

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
    // Make sure we're in the app's main view
    const userSelector = page.locator('select');
    
    for (const user of users) {
      // Select user if selector is available
      try {
        if (await userSelector.isVisible({ timeout: 3000 })) {
          await page.selectOption('select', user.name);
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        console.log(`User selector not found for ${user.name}, continuing...`);
      }

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
    
    // Navigate to landing page
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(WAIT_TIME);

    // Mobile landing page
    await takeScreenshot(page, 'mobile-landing-page', {
      directory: 'marketing',
      fullPage: true
    });


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
    
    // Additional mobile screenshots for documentation
    await takeScreenshot(page, 'mobile-landing', {
      directory: 'features',
      fullPage: false
    });
    
    // Mobile chat widget
    try {
      const chatWidget = page.locator('.chat-widget, .chat-button, [data-testid="chat"]');
      if (await chatWidget.isVisible()) {
        await takeScreenshot(page, 'mobile-chat-widget', {
          directory: 'features',
          fullPage: false
        });
      }
    } catch (error) {
      console.log('Mobile chat widget not found');
    }
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

  test('Specific Feature Screenshots', async ({ page }) => {
    // Taller viewport for feature screenshots to show more content
    await page.setViewportSize({ width: 1280, height: 900 });
    
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(WAIT_TIME);
    
    // 1. Tag Prediction Screenshot with "rye bread" on /admin page
    console.log('📸 1. Generating tag prediction screenshot with "rye bread" on /admin page...');
    
    // Navigate to admin page
    await page.goto(`${APP_URL}/admin`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(WAIT_TIME);

    // Find tag prediction input
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
    
    await takeScreenshot(page, 'tag-prediction', {
      directory: 'features',
      fullPage: false
    });
    
    // 2. Autofill Screenshot with button clicked
    console.log('📸 2. Generating autofill screenshot with button clicked...');
    
    // Navigate to cart page for autofill
    await page.goto(`${APP_URL}/cart`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(WAIT_TIME);
    
    // Look for autofill button on cart page
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
    
    await takeScreenshot(page, 'autofill-cart', {
      directory: 'features',
      fullPage: true
    });
    
    // 3. NLP Processing Screenshot with payment question on /help page
    console.log('📸 3. Generating NLP processing screenshot with payment question on /help page...');
    
    // Navigate to help page
    await page.goto(`${APP_URL}/help`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(WAIT_TIME);

    // Find NLP input area
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
            
            // Wait for the answer/response to appear
            try {
              await page.waitForSelector('.response, .answer, .result, .output', { timeout: 8000 });
              await page.waitForTimeout(2000); // Extra wait for content to fully load
            } catch (error) {
              console.log('No response section found, continuing...');
            }
            break;
          }
        }
        
        foundNlpInput = true;
        break;
      }
    }
    
    await takeScreenshot(page, 'nlp-processing', {
      directory: 'features',
      fullPage: true
    });
    
    // 4. Invoice Automation Screenshot with "Load Sample Invoice" clicked
    console.log('📸 4. Generating invoice automation screenshot with "Load Sample Invoice" clicked...');
    
    // Navigate to invoicing page
    await page.goto(`${APP_URL}/invoicing`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(WAIT_TIME);

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
        
        // Wait for invoice processing and predictions to load
        try {
          await page.waitForSelector('.prediction, .analysis, .result, .processed', { timeout: 8000 });
          await page.waitForTimeout(3000); // Extra wait for all predictions to appear
        } catch (error) {
          console.log('No prediction results found, continuing...');
        }
        
        foundInvoiceButton = true;
        break;
      }
    }
    
    await takeScreenshot(page, 'invoice-automation', {
      directory: 'features',
      fullPage: true
    });
    
    // Summary
    console.log('\n📋 Summary:');
    console.log(`✓ Tag prediction (/products): ${foundTagInput ? 'Found input, added "rye bread"' : 'Input field not found, screenshot taken anyway'}`);
    console.log(`✓ Autofill: ${foundAutofill ? 'Found button, clicked it' : 'Button not found, screenshot taken anyway'}`);
    console.log(`✓ NLP processing (/help): ${foundNlpInput ? 'Found input, added payment question' : 'Input field not found, screenshot taken anyway'}`);
    console.log(`✓ Invoice automation (/invoicing): ${foundInvoiceButton ? 'Found button, clicked "Load Sample Invoice"' : 'Button not found, screenshot taken anyway'}`);
  });

  test('Comprehensive Use Case Screenshots', async ({ page }) => {
    // Standard viewport for use case screenshots
    await page.setViewportSize({ width: 1280, height: 900 });
    
    console.log('📸 Generating comprehensive use case screenshots...');
    
    // 1. Main app interface
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(WAIT_TIME);
    
    await takeScreenshot(page, 'main-app-interface', {
      directory: 'features',
      fullPage: false
    });
    
    // 2. Landing page (main)
    await takeScreenshot(page, 'landing-page', {
      directory: 'features',
      fullPage: false
    });
    
    // 3. Search results for different users with milk
    const users = ['larry', 'veronica', 'alice'];
    
    for (const user of users) {
      try {
        const userSelector = page.locator('select');
        if (await userSelector.isVisible({ timeout: 3000 })) {
          await page.selectOption('select', user);
          await page.waitForTimeout(1000);
        }
        
        // Search for milk
        await page.fill('input[placeholder*="Search"]', 'milk');
        await page.waitForTimeout(3000);
        
        await takeScreenshot(page, `smart-search-milk-${user}`, {
          directory: 'features',
          fullPage: false
        });
        
        await takeScreenshot(page, `search-milk-results`, {
          directory: 'features',
          fullPage: false
        });
        
        // Clear search
        await page.fill('input[placeholder*="Search"]', '');
        await page.waitForTimeout(1000);
        
      } catch (error) {
        console.log(`Could not generate search screenshots for ${user}`);
      }
    }
    
    // 4. Recommendations
    try {
      const userSelector = page.locator('select');
      if (await userSelector.isVisible({ timeout: 3000 })) {
        await page.selectOption('select', 'veronica');
        await page.waitForTimeout(2000);
      }
      
      const recommendationsSection = page.locator('.recommendations-section, [data-testid="recommendations"]');
      if (await recommendationsSection.isVisible()) {
        await recommendationsSection.scrollIntoViewIfNeeded();
        await takeScreenshot(page, 'recommendations-veronica', {
          directory: 'features',
          fullPage: false
        });
        
        await takeScreenshot(page, 'recommendations-dynamic', {
          directory: 'features',
          fullPage: false
        });
      }
    } catch (error) {
      console.log('Could not generate recommendations screenshots');
    }
    
    // 5. Autocomplete
    try {
      const searchInput = page.locator('input[placeholder*="Search"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('bre');
        await page.waitForTimeout(2000);
        
        await takeScreenshot(page, 'autocomplete-suggestions', {
          directory: 'features',
          fullPage: false
        });
        
        await takeScreenshot(page, 'autocomplete-full', {
          directory: 'features',
          fullPage: false
        });
        
        await searchInput.fill('');
      }
    } catch (error) {
      console.log('Could not generate autocomplete screenshots');
    }
    
    // 6. Shopping Assistant / Chat Interface
    try {
      await page.goto(`${APP_URL}/customer-chat`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(WAIT_TIME);
      
      await takeScreenshot(page, 'shopping-assistant-interface', {
        directory: 'features',
        fullPage: false
      });
      
      await takeScreenshot(page, 'shopping-assistant', {
        directory: 'features',
        fullPage: false
      });
      
      // Try to show interaction
      const chatInput = page.locator('textarea, input[type="text"]').last();
      if (await chatInput.isVisible()) {
        await chatInput.fill('I need help finding organic products');
        await page.waitForTimeout(1000);
        
        await takeScreenshot(page, 'shopping-assistant-query', {
          directory: 'features',
          fullPage: false
        });
        
        // Try to submit and get response
        const submitBtn = page.locator('button:has-text("Send"), button:has-text("Submit")').first();
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          await page.waitForTimeout(3000);
          
          await takeScreenshot(page, 'shopping-assistant-response', {
            directory: 'features',
            fullPage: false
          });
        }
      }
    } catch (error) {
      console.log('Could not generate shopping assistant screenshots');
    }
    
    // 7. Admin Assistant / Analytics
    try {
      await page.goto(`${APP_URL}/admin-chat`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(WAIT_TIME);
      
      await takeScreenshot(page, 'admin-assistant-interface', {
        directory: 'features',
        fullPage: false
      });
      
      await takeScreenshot(page, 'admin-assistant', {
        directory: 'features',
        fullPage: false
      });
      
      // Try to show admin assistant interaction
      const adminChatInput = page.locator('textarea, input[type="text"]').last();
      if (await adminChatInput.isVisible()) {
        await adminChatInput.fill('Show me user analytics and revenue trends');
        await page.waitForTimeout(1000);
        
        await takeScreenshot(page, 'admin-assistant-query', {
          directory: 'features',
          fullPage: false
        });
        
        // Try to submit and get response
        const submitBtn = page.locator('button:has-text("Send"), button:has-text("Submit")').first();
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          await page.waitForTimeout(4000);
          
          await takeScreenshot(page, 'admin-assistant-analytics', {
            directory: 'features',
            fullPage: false
          });
        }
      }
      
    } catch (error) {
      console.log('Could not generate admin assistant screenshots');
    }
    
    // 8. Analytics Dashboard (separate from admin assistant)
    try {
      await page.goto(`${APP_URL}/analytics`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(WAIT_TIME);
      
      await takeScreenshot(page, 'analytics-dashboard', {
        directory: 'features',
        fullPage: true
      });
      
      // Try to capture specific analytics sections
      const chartsSection = page.locator('.charts-section, .analytics-charts, .chart-container');
      if (await chartsSection.first().isVisible()) {
        await chartsSection.first().scrollIntoViewIfNeeded();
        await takeScreenshot(page, 'analytics-heatmap', {
          directory: 'features',
          fullPage: false
        });
        
        await takeScreenshot(page, 'analytics-trends', {
          directory: 'features',
          fullPage: false
        });
      }
      
    } catch (error) {
      console.log('Could not generate analytics dashboard screenshots');
    }
    
    // 9. Product Analytics
    try {
      await page.goto(`${APP_URL}/products`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(WAIT_TIME);
      
      await takeScreenshot(page, 'product-analytics-page', {
        directory: 'features',
        fullPage: true
      });
      
      await takeScreenshot(page, 'product-analytics', {
        directory: 'features',
        fullPage: false
      });
      
      await takeScreenshot(page, 'product-relationships', {
        directory: 'features',
        fullPage: false
      });
      
      await takeScreenshot(page, 'tag-prediction-suggestions', {
        directory: 'features',
        fullPage: false
      });
      
    } catch (error) {
      console.log('Could not generate product analytics screenshots');
    }
    
    // 10. Cart Management
    try {
      await page.goto(`${APP_URL}/cart`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(WAIT_TIME);
      
      await takeScreenshot(page, 'cart-management', {
        directory: 'features',
        fullPage: false
      });
      
    } catch (error) {
      console.log('Could not generate cart management screenshots');
    }
    
    // 11. Invoice Processing (additional views)
    try {
      await page.goto(`${APP_URL}/invoicing`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(WAIT_TIME);
      
      await takeScreenshot(page, 'invoice-processing-list', {
        directory: 'features',
        fullPage: false
      });
      
      await takeScreenshot(page, 'invoice-processing-detail', {
        directory: 'features',
        fullPage: false
      });
      
    } catch (error) {
      console.log('Could not generate additional invoice screenshots');
    }
    
    // 12. NLP Processing (additional views)
    try {
      await page.goto(`${APP_URL}/help`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(WAIT_TIME);
      
      await takeScreenshot(page, 'nlp-processing-input', {
        directory: 'features',
        fullPage: false
      });
      
      // Try to show processing result
      const nlpInput = page.locator('textarea, input[type="text"]').first();
      if (await nlpInput.isVisible()) {
        await nlpInput.fill('I am very disappointed with my recent order');
        await page.waitForTimeout(1000);
        
        const processBtn = page.locator('button:has-text("Process"), button:has-text("Analyze")').first();
        if (await processBtn.isVisible()) {
          await processBtn.click();
          await page.waitForTimeout(3000);
          
          await takeScreenshot(page, 'nlp-processing-result', {
            directory: 'features',
            fullPage: false
          });
        }
      }
      
    } catch (error) {
      console.log('Could not generate NLP processing screenshots');
    }
    
    console.log('✅ Comprehensive use case screenshots completed!');
  });
});