#!/usr/bin/env node

/**
 * Screenshot Verification Utility
 * Verifies that all required screenshots exist and checks file sizes
 */

const fs = require('fs');
const path = require('path');

const SCREENSHOT_CONFIG = {
  baseDir: './docs/screenshots',
  requiredScreenshots: {
    'features': [
      'admin-assistant.png',
      'analytics-dashboard.png',
      'autocomplete-full.png',
      'autofill-cart.png',           // ← Updated with autofill button clicked
      'invoice-automation.png',
      'landing-page.png',
      'main-app-interface.png',
      'nlp-processing.png',          // ← Updated with payment question
      'product-analytics.png',
      'search-milk-results.png',
      'shopping-assistant.png',
      'tag-prediction.png'           // ← Updated with "rye bread" text
    ],
    'marketing': [
      'landing-page-full.png',
      'mobile-landing.png'
    ],
    'tutorials': [
      // Tutorial screenshots can vary
    ]
  },
  minFileSize: 5000 // 5KB minimum file size
};

function checkScreenshotExists(filepath) {
  if (!fs.existsSync(filepath)) {
    return { exists: false, size: 0, error: 'File does not exist' };
  }
  
  const stats = fs.statSync(filepath);
  const size = stats.size;
  
  if (size < SCREENSHOT_CONFIG.minFileSize) {
    return { 
      exists: true, 
      size, 
      error: `File too small (${size} bytes, minimum ${SCREENSHOT_CONFIG.minFileSize})` 
    };
  }
  
  return { exists: true, size, error: null };
}

function verifyScreenshots() {
  console.log('🔍 Verifying screenshot files...\n');
  
  let totalScreenshots = 0;
  let existingScreenshots = 0;
  let errors = [];
  
  for (const [category, screenshots] of Object.entries(SCREENSHOT_CONFIG.requiredScreenshots)) {
    console.log(`📁 Checking ${category} screenshots:`);
    
    for (const screenshot of screenshots) {
      totalScreenshots++;
      const filepath = path.join(SCREENSHOT_CONFIG.baseDir, category, screenshot);
      const result = checkScreenshotExists(filepath);
      
      if (result.exists && !result.error) {
        console.log(`  ✅ ${screenshot} (${Math.round(result.size / 1024)}KB)`);
        existingScreenshots++;
      } else {
        console.log(`  ❌ ${screenshot} - ${result.error}`);
        errors.push({
          file: screenshot,
          category,
          error: result.error
        });
      }
    }
    console.log('');
  }
  
  // Summary
  console.log('📊 Summary:');
  console.log(`  Total required: ${totalScreenshots}`);
  console.log(`  Existing: ${existingScreenshots}`);
  console.log(`  Missing/Invalid: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n🚨 Issues found:');
    errors.forEach(error => {
      console.log(`  • ${error.category}/${error.file}: ${error.error}`);
    });
    
    console.log('\n🔧 To fix issues:');
    console.log('  1. Start the application: npm start');
    console.log('  2. Generate screenshots: npm run screenshots:specific');
    console.log('  3. Or generate all: npm run screenshots');
    
    return false;
  } else {
    console.log('\n✅ All screenshots verified successfully!');
    return true;
  }
}

// Check for specific content requirements
function checkSpecificRequirements() {
  console.log('🎯 Checking specific content requirements...\n');
  
  const requirements = [
    {
      file: 'features/tag-prediction.png',
      description: 'Should show "rye bread" in input field'
    },
    {
      file: 'features/autofill-cart.png', 
      description: 'Should show cart filled after button click'
    },
    {
      file: 'features/nlp-processing.png',
      description: 'Should show "Which payment methods do you provide?" text'
    }
  ];
  
  requirements.forEach(req => {
    const filepath = path.join(SCREENSHOT_CONFIG.baseDir, req.file);
    const result = checkScreenshotExists(filepath);
    
    if (result.exists && !result.error) {
      console.log(`  ✅ ${req.file} exists (${Math.round(result.size / 1024)}KB)`);
      console.log(`     📝 ${req.description}`);
    } else {
      console.log(`  ❌ ${req.file} - ${result.error}`);
      console.log(`     📝 ${req.description}`);
    }
    console.log('');
  });
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔍 Screenshot Verification Tool

Usage: node scripts/verify-screenshots.js [options]

Options:
  --requirements    Check specific content requirements only
  --help, -h        Show this help message

This script verifies that all required screenshots exist and are valid.
    `);
    process.exit(0);
  }
  
  if (args.includes('--requirements')) {
    checkSpecificRequirements();
  } else {
    const success = verifyScreenshots();
    checkSpecificRequirements();
    
    if (!success) {
      process.exit(1);
    }
  }
}

module.exports = { verifyScreenshots, checkSpecificRequirements };