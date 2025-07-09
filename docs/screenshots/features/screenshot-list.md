# Feature Screenshots Available

This document lists all the screenshots that can be generated using the automated screenshot system.

## Core Features

### 1. Landing Page
- `landing-page.png` - Main landing page with hero section and feature overview

### 2. Smart Search (Personalized)
- `smart-search-milk-larry.png` - Larry's search results (lactose-free focus)
- `smart-search-milk-veronica.png` - Veronica's search results (health-conscious)
- `smart-search-milk-alice.png` - Alice's search results (general preferences)

### 3. Personalized Recommendations
- `recommendations-veronica.png` - Recommendation section for health-conscious user
- `recommendations-dynamic.png` - Dynamic recommendations excluding cart items

### 4. Intelligent Autocomplete
- `autocomplete-suggestions.png` - Smart autocomplete dropdown with context-aware suggestions

### 5. Shopping Assistant (Customer Chat)
- `shopping-assistant-interface.png` - Initial chat interface
- `shopping-assistant-query.png` - User typing a query
- `shopping-assistant-response.png` - AI assistant providing product recommendations

### 6. Admin Assistant (Business Intelligence)
- `admin-assistant-interface.png` - Admin chat dashboard
- `admin-assistant-query.png` - Business query being typed
- `admin-assistant-analytics.png` - Analytics response with charts

### 7. Invoice Automation
- `invoice-processing-list.png` - List of invoices with ML-powered classification
- `invoice-processing-detail.png` - Individual invoice with predicted GL codes

### 8. Analytics & Insights
- `analytics-dashboard.png` - Full analytics dashboard view
- `analytics-heatmap.png` - Purchase pattern heatmap
- `analytics-trends.png` - Sales and behavior trend charts

### 9. NLP Processing
- `nlp-processing-input.png` - Customer feedback input form
- `nlp-processing-result.png` - Sentiment analysis and categorization results

### 10. Product Analytics & Relationships
- `product-analytics-page.png` - Full product analytics page
- `product-relationships.png` - Product relationship analysis and correlations

### 11. Tag Prediction
- `tag-prediction-suggestions.png` - ML-powered tag suggestions for new products

### 12. Cart Management
- `cart-management.png` - Shopping cart with smart features

### 13. Mobile Responsive Views
- `mobile-landing.png` - Mobile landing page
- `mobile-app-interface.png` - Mobile app interface
- `mobile-chat-widget.png` - Mobile chat widget

## How to Generate Screenshots

### Prerequisites
1. Start the development server: `npm start`
2. Ensure Playwright dependencies are installed: `npx playwright install-deps`

### Generate All Screenshots
```bash
npm run screenshots:all
```

### Generate Specific Categories
```bash
npm run screenshots:marketing     # Landing page, mobile views
npm run screenshots:tutorials     # Feature demonstrations
npm run screenshots:docs          # Technical documentation
```

### Manual Screenshot Generation
```bash
# Using the comprehensive script
node scripts/screenshot-all-features.js

# Using Playwright tests
npx playwright test tests/screenshots.spec.js
```

## Screenshot Usage in Documentation

These screenshots are referenced in:
- README.md - Feature overview section
- Tutorial guides - Step-by-step instructions
- Blog posts - Technical demonstrations
- API documentation - Visual examples

## File Organization

```
docs/screenshots/
├── features/           # Main functionality screenshots
├── tutorials/          # Step-by-step tutorial images
├── marketing/          # High-resolution marketing materials
└── documentation/      # Technical documentation images
```

## Best Practices

1. **Consistency** - All screenshots use the same viewport size (1280x720)
2. **Context** - Include user personas to show personalization
3. **Clarity** - Wait for animations and loading to complete
4. **Currency** - Regenerate after UI changes or feature updates

---

*Screenshots are automatically generated and can be updated by running the screenshot generation scripts.*