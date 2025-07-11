# Screenshot Generation Guide

This guide explains how to generate and update screenshots for the Aito demo repository.

## Prerequisites

1. **Install browser dependencies:**
   ```bash
   npx playwright install
   npx playwright install-deps  # May require sudo on Linux
   ```

2. **Start the application:**
   ```bash
   npm start
   ```
   Application should be running on `http://localhost:3000`

## Quick Commands

### Generate All Screenshots
```bash
npm run screenshots
```

### Generate Specific Categories
```bash
npm run screenshots:marketing    # Landing pages, mobile views
npm run screenshots:tutorials    # Feature tutorials and demos
npm run screenshots:docs         # Admin dashboard
```

### Generate Updated Screenshots (Per Request)
```bash
# Generate the 3 specific screenshots with custom content
node scripts/generate-specific-screenshots.js

# Or generate individual features
npm run screenshots:tutorials
```

## Specific Screenshot Requirements

### 1. Tag Prediction Screenshot (`tag-prediction.png`)
- **Page**: `/products` (Products page)
- **Content**: "rye bread" in the product name input field
- **Action**: Triggers tag prediction automatically
- **Location**: `docs/screenshots/features/tag-prediction.png`

### 2. Autofill Screenshot (`autofill-cart.png`)  
- **Action**: Click the "Autofill" button to fill cart
- **Result**: Shows cart populated with predicted items
- **Location**: `docs/screenshots/features/autofill-cart.png`

### 3. NLP Processing Screenshot (`nlp-processing.png`)
- **Page**: `/help` (Help page)
- **Content**: "Which payment methods do you provide?" in text input
- **Action**: Triggers NLP analysis with classification
- **Location**: `docs/screenshots/features/nlp-processing.png`

### 4. Invoice Automation Screenshot (`invoice-automation.png`)
- **Page**: `/invoicing` (Invoicing page)
- **Action**: Click "Load Sample Invoice" button
- **Result**: Shows loaded invoice with automated field extraction
- **Location**: `docs/screenshots/features/invoice-automation.png`

## Screenshot Types Available

### Marketing Screenshots
- `landingPage` - Main landing page views
- `mobileViews` - Mobile responsive views  
- `highResMarketing` - High-resolution marketing materials

### Feature Screenshots  
- `searchFeatures` - Search functionality demos
- `recommendations` - Recommendation system
- `tagPrediction` - Tag prediction with "rye bread" ✨
- `autofillFeature` - Autofill with button clicked ✨
- `nlpProcessing` - NLP with payment question ✨
- `invoiceProcessing` - Invoice automation workflow
- `chatInterface` - AI assistant interfaces

### Admin Screenshots
- `adminDashboard` - Analytics and admin views

## Troubleshooting

### Browser Dependencies Missing
```bash
# Install Playwright browsers
npx playwright install

# Install system dependencies (may need sudo)
npx playwright install-deps
```

### Application Not Running
```bash
# Start the application first
npm start

# Then in another terminal:
npm run screenshots
```

### Specific Features Not Found
The screenshot generators use flexible selectors to find UI elements. If specific features aren't being captured:

1. Check that the application is fully loaded
2. Verify the feature is visible on the page  
3. Update selectors in `scripts/screenshot-generator.js`

## File Locations

- **Script**: `scripts/screenshot-generator.js` - Main generator
- **Specific Script**: `scripts/generate-specific-screenshots.js` - Custom content screenshots
- **Output Directory**: `docs/screenshots/features/` - All feature screenshots
- **Marketing**: `docs/screenshots/marketing/` - Landing and mobile screenshots
- **Tutorials**: `docs/screenshots/tutorials/` - Tutorial and demo screenshots

## Verification

After generating screenshots, verify:

1. ✅ `tag-prediction.png` shows "rye bread" in input field on `/products` page
2. ✅ `autofill-cart.png` shows filled cart after button click
3. ✅ `nlp-processing.png` shows "Which payment methods do you provide?" text on `/help` page
4. ✅ `invoice-automation.png` shows loaded sample invoice on `/invoicing` page
5. ✅ All screenshots are clear and properly cropped
6. ✅ Screenshots are saved in correct directories

## Integration

Screenshots are referenced in:
- `README.md` - Feature showcase
- `docs/blog-post.md` - Technical blog post
- `docs/use-cases/*.md` - Individual use case guides
- `docs/tutorials/*.md` - Tutorial documentation

## Automation

For CI/CD integration, use the Docker-based screenshot generation:
```bash
npm run screenshots:docker
```

This ensures consistent screenshots across different environments.