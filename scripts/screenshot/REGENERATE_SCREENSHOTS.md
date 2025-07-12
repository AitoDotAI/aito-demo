# Screenshot Regeneration Instructions

This document provides step-by-step instructions for regenerating the screenshots with the updated requirements.

## Prerequisites

### 1. System Dependencies (Linux/Ubuntu)
```bash
# Install browser dependencies
sudo apt-get update
sudo apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libasound2 \
    libatspi2.0-0 \
    libgtk-3-0

# Or install Playwright dependencies
npx playwright install-deps
```

### 2. Install Playwright Browsers
```bash
npx playwright install
```

### 3. Start the Application
```bash
npm start
```
The application should be running on `http://localhost:3000`

## Regeneration Steps

### Step 1: Generate Specific Screenshots
```bash
npm run screenshots:specific
```

This will generate 4 specific screenshots:
1. **tag-prediction.png** - "rye bread" on /products page
2. **autofill-cart.png** - Autofill button clicked
3. **nlp-processing.png** - Payment question on /help page  
4. **invoice-automation.png** - Sample invoice loaded on /invoicing page

### Step 2: Verify Results
```bash
npm run screenshots:verify --requirements
```

### Step 3: Generate All Screenshots (Optional)
```bash
npm run screenshots:tutorials
```

This will regenerate all tutorial screenshots including the updated ones.

## Expected Output

### Successful Generation
```
🚀 Starting specific screenshot generation...
📸 1. Generating tag prediction screenshot with "rye bread" on /products page...
📸 2. Generating autofill screenshot with button clicked...
📸 3. Generating NLP processing screenshot with payment question on /help page...
📸 4. Generating invoice automation screenshot with "Load Sample Invoice" clicked...
✅ Specific screenshot generation completed!
📁 Screenshots saved to: ./docs/screenshots/features

📋 Summary:
✓ Tag prediction (/products): Found input, added "rye bread"
✓ Autofill: Found button, clicked it
✓ NLP processing (/help): Found input, added payment question
✓ Invoice automation (/invoicing): Found button, clicked "Load Sample Invoice"
```

### Verification Results
```
🎯 Checking specific content requirements...

  ✅ features/tag-prediction.png exists (53KB+)
     📝 Should show "rye bread" in input field on /products page

  ✅ features/autofill-cart.png exists (55KB+)
     📝 Should show cart filled after button click

  ✅ features/nlp-processing.png exists (56KB+)
     📝 Should show "Which payment methods do you provide?" text on /help page

  ✅ features/invoice-automation.png exists (75KB+)
     📝 Should show loaded sample invoice after clicking "Load Sample Invoice" on /invoicing page
```

## Troubleshooting

### Browser Dependencies Missing
If you see errors about missing libraries:
```bash
# Install system dependencies
sudo apt-get install -y libglib2.0-0 libgobject-2.0-0 libnspr4 libnss3 libsmime3 libdbus-1-3
```

### Application Not Running
```bash
# Check if port 3000 is available
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000

# If not 200, start the application
npm start
```

### Elements Not Found
If the script reports elements not found but still generates screenshots:
- The screenshots will still be taken
- Check the generated images to verify content
- Update selectors in the script if needed

## File Locations

After successful generation, screenshots will be saved to:
- `docs/screenshots/features/tag-prediction.png`
- `docs/screenshots/features/autofill-cart.png`
- `docs/screenshots/features/nlp-processing.png`
- `docs/screenshots/features/invoice-automation.png`

## What Changed

### Before
- Tag prediction: Used generic page, no specific content
- NLP processing: Generic location, no specific text
- Invoice automation: No button interaction

### After  
- ✅ Tag prediction: `/products` page with "rye bread" text
- ✅ NLP processing: `/help` page with "Which payment methods do you provide?"
- ✅ Invoice automation: `/invoicing` page with "Load Sample Invoice" clicked
- ✅ Autofill: Button clicked to show filled cart

## Integration

These screenshots are referenced in:
- `README.md` - Feature showcase section
- `docs/blog-post.md` - Technical blog post
- `docs/use-cases/` - Individual use case guides

The updated screenshots will show:
1. More realistic usage scenarios
2. Specific content that demonstrates functionality
3. Proper page context for each feature
4. Interactive elements in action

## Alternative: Docker-based Generation

If local dependencies are problematic:
```bash
npm run screenshots:docker
```

This uses a containerized environment with all dependencies pre-installed.

---

**Note**: The screenshot generation system has been updated and is ready to use. The scripts will automatically navigate to the correct pages, input the specified text, and click the required buttons to demonstrate each feature properly.