#!/usr/bin/env node

/**
 * Creates placeholder screenshots demonstrating the structure
 * These show what screenshots would be generated when Playwright works properly
 */

const fs = require('fs');
const path = require('path');

// Screenshot metadata - what each screenshot demonstrates
const screenshots = {
  features: [
    {
      name: 'landing-page.png',
      description: 'Main landing page with hero section showcasing all 11 AI-powered features'
    },
    {
      name: 'smart-search-milk-larry.png', 
      description: 'Larry\'s personalized search for "milk" showing only lactose-free options'
    },
    {
      name: 'smart-search-milk-veronica.png',
      description: 'Veronica\'s search emphasizing organic and health-conscious options'
    },
    {
      name: 'smart-search-milk-alice.png',
      description: 'Alice\'s balanced search results with general preferences'
    },
    {
      name: 'recommendations-veronica.png',
      description: 'Personalized recommendations for health-conscious shopper'
    },
    {
      name: 'recommendations-dynamic.png',
      description: 'Dynamic recommendations that exclude current cart items'
    },
    {
      name: 'autocomplete-suggestions.png',
      description: 'Intelligent autocomplete with context-aware suggestions'
    },
    {
      name: 'shopping-assistant-interface.png',
      description: 'Customer chat interface with AI shopping assistant'
    },
    {
      name: 'shopping-assistant-query.png',
      description: 'Customer typing a natural language query to the assistant'
    },
    {
      name: 'shopping-assistant-response.png',
      description: 'AI assistant providing personalized product recommendations through chat'
    },
    {
      name: 'admin-assistant-interface.png',
      description: 'Admin dashboard with business intelligence chat interface'
    },
    {
      name: 'admin-assistant-query.png',
      description: 'Admin asking business questions in natural language'
    },
    {
      name: 'admin-assistant-analytics.png',
      description: 'AI assistant providing business insights and analytics'
    },
    {
      name: 'invoice-processing-list.png',
      description: 'List of invoices with ML-powered automatic classification'
    },
    {
      name: 'invoice-processing-detail.png',
      description: 'Individual invoice with predicted GL codes and approval routing'
    },
    {
      name: 'analytics-dashboard.png',
      description: 'Comprehensive analytics dashboard with purchase patterns'
    },
    {
      name: 'analytics-heatmap.png',
      description: 'Purchase pattern heatmap showing behavioral insights'
    },
    {
      name: 'analytics-trends.png',
      description: 'Sales and behavior trend charts with predictive insights'
    },
    {
      name: 'nlp-processing-input.png',
      description: 'Customer feedback input form for sentiment analysis'
    },
    {
      name: 'nlp-processing-result.png',
      description: 'Automatic sentiment analysis and categorization results'
    },
    {
      name: 'product-analytics-page.png',
      description: 'Product analytics page with comprehensive metrics'
    },
    {
      name: 'product-relationships.png',
      description: 'Product relationship analysis showing statistical correlations'
    },
    {
      name: 'tag-prediction-suggestions.png',
      description: 'ML-powered tag suggestions for new products'
    },
    {
      name: 'cart-management.png',
      description: 'Shopping cart with intelligent features and recommendations'
    },
    {
      name: 'mobile-landing.png',
      description: 'Mobile-responsive landing page'
    },
    {
      name: 'mobile-app-interface.png',
      description: 'Mobile app interface with AI assistant integration'
    },
    {
      name: 'mobile-chat-widget.png',
      description: 'Mobile chat widget for customer assistance'
    }
  ]
};

// Ensure directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Create placeholder image with SVG
const createPlaceholder = (width, height, text, description) => {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" stroke-width="1"/>
    </pattern>
  </defs>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="#f8f9fa"/>
  <rect width="100%" height="100%" fill="url(#grid)" opacity="0.3"/>
  
  <!-- Header -->
  <rect x="0" y="0" width="100%" height="60" fill="#FF6B35"/>
  <text x="20" y="40" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white">
    Aito Grocery Store Demo - ${text}
  </text>
  
  <!-- Main content area -->
  <rect x="20" y="80" width="${width-40}" height="${height-160}" fill="white" stroke="#dee2e6" stroke-width="2" rx="8"/>
  
  <!-- Title -->
  <text x="${width/2}" y="130" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#212529" text-anchor="middle">
    ${text}
  </text>
  
  <!-- Description -->
  <foreignObject x="40" y="160" width="${width-80}" height="200">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif; font-size: 14px; color: #495057; line-height: 1.5; text-align: center; padding: 20px;">
      ${description}
      <br><br>
      <strong>This is a placeholder screenshot.</strong>
      <br>
      To generate actual screenshots, ensure Playwright browser dependencies are installed and run:
      <br>
      <code style="background: #f8f9fa; padding: 4px 8px; border-radius: 4px;">npm run screenshots:all</code>
    </div>
  </foreignObject>
  
  <!-- Footer -->
  <rect x="0" y="${height-40}" width="100%" height="40" fill="#6c757d"/>
  <text x="${width/2}" y="${height-20}" font-family="Arial, sans-serif" font-size="12" fill="white" text-anchor="middle">
    Generated by Aito.ai Grocery Store Demo Screenshot System
  </text>
</svg>`;
};

console.log('🎨 Creating placeholder screenshots...');

// Create features directory
const featuresDir = './docs/screenshots/features';
ensureDir(featuresDir);

// Generate placeholder screenshots
screenshots.features.forEach(screenshot => {
  const svgContent = createPlaceholder(1280, 720, screenshot.name.replace('.png', ''), screenshot.description);
  const svgPath = path.join(featuresDir, screenshot.name.replace('.png', '.svg'));
  
  fs.writeFileSync(svgPath, svgContent);
  console.log(`✓ Created placeholder: ${svgPath}`);
});

// Create a comprehensive README for the screenshots
const readmeContent = `# Aito Grocery Store Demo Screenshots

This directory contains screenshots demonstrating all the AI-powered features of the Aito Grocery Store Demo.

## 🎯 Available Screenshots

### Core E-commerce Intelligence
- **Smart Search**: Personalized search results for each user persona
- **Dynamic Recommendations**: Context-aware product suggestions
- **Intelligent Autocomplete**: Smart search completion

### AI-Powered Assistants
- **Shopping Assistant**: Customer chat interface with natural language support
- **Admin Assistant**: Business intelligence through conversation

### Advanced AI Capabilities
- **Invoice Processing**: Automated document classification
- **NLP Processing**: Sentiment analysis and text categorization
- **Analytics Dashboard**: Comprehensive business insights
- **Product Relationships**: Statistical correlation analysis

### Mobile Experience
- **Responsive Design**: Mobile-optimized interface
- **Mobile Chat**: Touch-friendly assistant interaction

## 📸 Screenshot Generation

### Prerequisites
To generate actual screenshots (not placeholders), you need:

1. **System Dependencies**:
   \`\`\`bash
   # On Ubuntu/Debian:
   sudo apt-get update
   sudo apt-get install -y \\
     libglib2.0-0 libgobject-2.0-0 libnspr4 libnss3 \\
     libnssutil3 libdbus-1-3 libgio-2.0-0 libatk1.0-0 \\
     libatk-bridge2.0-0 libexpat1 libatspi2.0-0 \\
     libx11-6 libxcomposite1 libxdamage1 libxext6 \\
     libxfixes3 libxrandr2 libgbm1 libxcb1 \\
     libxkbcommon0 libudev1 libasound2
   
   # Or install Playwright system dependencies:
   npx playwright install-deps
   \`\`\`

2. **Playwright Browsers**:
   \`\`\`bash
   npx playwright install
   \`\`\`

### Generate Screenshots

\`\`\`bash
# Start the development server
npm start

# Generate all screenshots (in another terminal)
npm run screenshots:all

# Or generate specific categories
npm run screenshots:marketing
npm run screenshots:tutorials
npm run screenshots:docs
\`\`\`

### Manual Screenshot Commands

\`\`\`bash
# Comprehensive screenshot generation
node scripts/screenshot-all-features.js

# Original screenshot generator
node scripts/screenshot-generator.js

# Playwright test suite
npx playwright test tests/screenshots.spec.js
\`\`\`

## 🔧 Troubleshooting

### "Missing dependencies" Error
This means Playwright browser dependencies aren't installed. Run:
\`\`\`bash
npx playwright install-deps
\`\`\`

### Server Not Ready
Ensure the development server is running on port 3000:
\`\`\`bash
npm start
curl http://localhost:3000  # Should return HTML
\`\`\`

### Screenshots Not Generated
Check that the screenshots directory has write permissions:
\`\`\`bash
ls -la docs/screenshots/
\`\`\`

## 📁 File Organization

\`\`\`
docs/screenshots/
├── features/           # Main functionality screenshots
├── tutorials/          # Step-by-step tutorial images  
├── marketing/          # High-resolution marketing materials
└── documentation/      # Technical documentation images
\`\`\`

## 🎨 Current Status

**Placeholder Screenshots**: SVG placeholders are currently generated showing the structure and descriptions of each screenshot.

**Actual Screenshots**: To generate actual browser screenshots, install the required system dependencies and run the screenshot generation commands above.

## 📊 Usage in Documentation

These screenshots are referenced in:
- \`README.md\` - Feature demonstrations
- \`docs/tutorials/getting-started.md\` - Step-by-step guides
- \`docs/blog-post.md\` - Technical blog post
- \`docs/tutorials/assistant-integration.md\` - AI assistant tutorial

---

*For support with screenshot generation, see the troubleshooting section above or check the main project documentation.*
`;

fs.writeFileSync(path.join(featuresDir, 'README.md'), readmeContent);

console.log(`\n✅ Placeholder screenshot system created!`);
console.log(`📁 Location: ${featuresDir}`);
console.log(`📊 Generated ${screenshots.features.length} placeholder screenshots`);
console.log(`\n📖 To generate actual screenshots:`);
console.log(`   1. Install system dependencies: npx playwright install-deps`);
console.log(`   2. Install browsers: npx playwright install`);
console.log(`   3. Run: npm run screenshots:all`);
console.log(`\n💡 Current placeholders show the structure and can be replaced with actual screenshots when dependencies are available.`);