# Aito Grocery Store Demo Screenshots

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
   ```bash
   # On Ubuntu/Debian:
   sudo apt-get update
   sudo apt-get install -y \
     libglib2.0-0 libgobject-2.0-0 libnspr4 libnss3 \
     libnssutil3 libdbus-1-3 libgio-2.0-0 libatk1.0-0 \
     libatk-bridge2.0-0 libexpat1 libatspi2.0-0 \
     libx11-6 libxcomposite1 libxdamage1 libxext6 \
     libxfixes3 libxrandr2 libgbm1 libxcb1 \
     libxkbcommon0 libudev1 libasound2
   
   # Or install Playwright system dependencies:
   npx playwright install-deps
   ```

2. **Playwright Browsers**:
   ```bash
   npx playwright install
   ```

### Generate Screenshots

```bash
# Start the development server
npm start

# Generate all screenshots (in another terminal)
npm run screenshots:all

# Or generate specific categories
npm run screenshots:marketing
npm run screenshots:tutorials
npm run screenshots:docs
```

### Manual Screenshot Commands

```bash
# Comprehensive screenshot generation
node scripts/screenshot-all-features.js

# Original screenshot generator
node scripts/screenshot-generator.js

# Playwright test suite
npx playwright test tests/screenshots.spec.js
```

## 🔧 Troubleshooting

### "Missing dependencies" Error
This means Playwright browser dependencies aren't installed. Run:
```bash
npx playwright install-deps
```

### Server Not Ready
Ensure the development server is running on port 3000:
```bash
npm start
curl http://localhost:3000  # Should return HTML
```

### Screenshots Not Generated
Check that the screenshots directory has write permissions:
```bash
ls -la docs/screenshots/
```

## 📁 File Organization

```
docs/screenshots/
├── features/           # Main functionality screenshots
├── tutorials/          # Step-by-step tutorial images  
├── marketing/          # High-resolution marketing materials
└── documentation/      # Technical documentation images
```

## 🎨 Current Status

**Placeholder Screenshots**: SVG placeholders are currently generated showing the structure and descriptions of each screenshot.

**Actual Screenshots**: To generate actual browser screenshots, install the required system dependencies and run the screenshot generation commands above.

## 📊 Usage in Documentation

These screenshots are referenced in:
- `README.md` - Feature demonstrations
- `docs/tutorials/getting-started.md` - Step-by-step guides
- `docs/blog-post.md` - Technical blog post
- `docs/tutorials/assistant-integration.md` - AI assistant tutorial

---

*For support with screenshot generation, see the troubleshooting section above or check the main project documentation.*
