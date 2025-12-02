# Development Guide

Developer-oriented documentation for the Aito Grocery Store Demo. For user-facing information, see [README.md](README.md).

## Table of Contents

- [Quick Start](#quick-start)
- [Development Commands](#development-commands)
- [Project Structure](#project-structure)
- [Environment Configuration](#environment-configuration)
- [Screenshot Generation](#screenshot-generation)
- [Data Management](#data-management)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Quick Start

```bash
# Clone and setup
git clone https://github.com/AitoDotAI/aito-demo.git
cd aito-demo

# Install dependencies
npm install

# Copy environment file (includes working demo credentials)
cp .env.example .env

# Start development server
npm start
```

The application will be available at http://localhost:3000

## Development Commands

### Essential Commands

```bash
# Development
npm start                    # Start dev server on port 3000
npm run build               # Production build
npm test                    # Run tests in watch mode
npm run test:coverage       # Run tests with coverage report

# Code Quality
npm run lint                # Check code with ESLint
npm run lint:fix            # Auto-fix ESLint issues
npm run format              # Format code with Prettier
npm run format:check        # Check code formatting
```

### Screenshot Generation

```bash
# Option 1: Install Playwright dependencies (recommended for local dev)
npx playwright install-deps chromium
npm run screenshots:all     # Generate all screenshots

# Option 2: Docker-based (most reliable, requires Docker)
npm run screenshots:docker

# Option 3: Specific screenshot sets
npm run screenshots:marketing    # Marketing/landing page screenshots
npm run screenshots:tutorials    # Tutorial screenshots
npm run screenshots:specific     # Specific feature screenshots

# Verify screenshots
npm run screenshots:verify       # Check if screenshots exist
npm run screenshots:verify --requirements  # Detailed verification
```

**Screenshot Generation Troubleshooting:**

If you encounter browser dependency errors:
```bash
# Install system dependencies (Linux/Ubuntu)
sudo apt-get update && sudo apt-get install -y \
  libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
  libxdamage1 libxfixes3 libxrandr2 libgbm1 \
  libatspi2.0-0 libasound2
```

Or use the Docker approach which includes all dependencies:
```bash
chmod +x scripts/screenshot/docker-screenshots.sh
npm run screenshots:docker
```

### Data Management

```bash
# Upload data to Aito instance
npm run upload-data              # Upload all data tables
npm run upload-data:dry-run      # Test upload without actually uploading

# Data files location: src/data/
# - *.json files: Table data
# - schema.json: Database schema
# - *.ndjson: Alternative format for large datasets
```

**Note:** Data upload requires valid `AITO_URL` and `AITO_API_KEY` in `.env`

### Backend Server Commands

```bash
# Start backend on custom port
PORT=3001 npm run start:backend
PORT=3002 npm run start:backend

# Or use environment variable
BACKEND_PORT=3005 npm run start:backend
```

### Git Workflow

```bash
# Create a feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "Description of changes"

# Push and create PR
git push origin feature/my-feature
gh pr create --title "Feature: My Feature" --body "Description"
```

## Project Structure

```
aito-demo/
├── src/
│   ├── 01-recommend.js              # Recommendation engine
│   ├── 02-autocomplete.js           # Search autocomplete
│   ├── 03-search.js                 # Smart search
│   ├── 04-get-tag-suggestions.js    # Tag prediction
│   ├── 05-autofill.js               # Cart autofill
│   ├── 06-prompt.js                 # NLP processing
│   ├── 07-relate.js                 # Statistical analysis
│   ├── 08-predict-invoice.js        # Invoice classification
│   ├── 09-product.js                # Product analytics
│   ├── 10-get-distinct-values.js    # Data queries
│   ├── 11-evaluate.js               # Model evaluation
│   ├── 12-price-estimation.js       # Price/demand analytics
│   ├── 13-product-predictions.js    # Category/price prediction
│   │
│   ├── app/
│   │   ├── App.js                   # Main application component
│   │   ├── components/              # Reusable UI components
│   │   ├── pages/                   # Page components
│   │   │   ├── LandingPage.js       # Store front
│   │   │   ├── AdminPage.js         # Product Catalog
│   │   │   ├── AnalyticsPage.js     # Preference Analytics
│   │   │   ├── InvoicingPage.js     # Invoice Processing
│   │   │   ├── EvaluationPage.js    # Model Quality
│   │   │   ├── PricingPage.js       # Price-Demand Analytics
│   │   │   ├── ProductPage.js       # Product Analytics
│   │   │   ├── HelpPage.js          # Help page
│   │   │   ├── CustomerChatPage.js  # Customer Assistant
│   │   │   └── AdminChatPage.js     # Employee Assistant
│   │   └── data/                    # Data abstraction layer
│   │
│   ├── data/                        # JSON data files
│   ├── services/                    # API clients and utilities
│   └── config/                      # Configuration files
│
├── docs/
│   ├── screenshots/                 # Generated screenshots
│   ├── use-cases/                   # Feature documentation
│   │   ├── 01-recommendations.md
│   │   ├── 02-autocomplete.md
│   │   ├── 03-smart-search.md
│   │   ├── 04-tag-prediction.md
│   │   ├── 05-autofill.md
│   │   ├── 06-nlp-processing.md
│   │   ├── 07-data-analytics.md
│   │   ├── 08-invoice-processing.md
│   │   ├── 09-product-analytics.md
│   │   ├── 10-quality-monitoring.md
│   │   └── 11-price-optimization.md
│   └── tutorials/                   # Implementation guides
│
├── scripts/
│   └── screenshot/                  # Screenshot automation
│
├── tests/                           # Test files
├── public/                          # Static assets
└── config/                          # Build configuration
```

## Environment Configuration

### Environment Variables

Create `.env` file (or copy from `.env.example`):

```bash
# Aito Configuration
AITO_URL=https://shared.aito.ai/db/aito-demo
AITO_API_KEY=bvss2i2dIkaWUfBCdzEO89LpPNhqjD

# Application
PORT=3000
REACT_APP_API_URL=http://localhost:3001

# Build
GENERATE_SOURCEMAP=false

# Claude AI (optional, for assistant features)
ANTHROPIC_API_KEY=your_api_key_here
```

### Using Your Own Aito Instance

To use your own Aito instance instead of the shared demo:

1. Create an Aito account at https://aito.ai
2. Update `.env`:
   ```bash
   AITO_URL=https://your-instance.aito.ai
   AITO_API_KEY=your_api_key
   ```
3. Upload schema and data:
   ```bash
   npm run upload-data
   ```

## Screenshot Generation

Screenshots are used in README, documentation, and marketing materials.

### Prerequisites

**Option 1: Local Playwright (recommended for development)**
```bash
# Install Playwright browsers
npx playwright install chromium

# Install system dependencies (Linux/Ubuntu)
npx playwright install-deps chromium
```

**Option 2: Docker (recommended for CI/production)**
```bash
# Requires Docker installed
docker --version  # Verify Docker is available
```

### Generate Screenshots

```bash
# Full screenshot suite
npm run screenshots:all              # All screenshots
npm run screenshots:marketing        # Landing page variants
npm run screenshots:tutorials        # Feature tutorials
npm run screenshots:specific         # Specific scenarios

# Verify results
npm run screenshots:verify
```

### Screenshot Locations

Generated screenshots are saved to:
- `docs/screenshots/features/` - Feature screenshots
- `docs/screenshots/marketing/` - Marketing materials
- `docs/screenshots/tutorials/` - Tutorial images

### Docker-based Generation

If local dependencies are problematic:

```bash
# Build and run screenshot container
npm run screenshots:docker

# Or manually
cd scripts/screenshot
./docker-screenshots.sh
```

## Data Management

### Data Schema

The application uses the following Aito tables:

**E-commerce Core:**
- `products` (42 items) - Product catalog with Google Analytics
- `users` (67 entries) - Customer demographics
- `visits` (736 entries) - Shopping sessions
- `contexts` (5,290 entries) - Search interactions
- `impressions` (90,087 entries) - Product views and purchases

**Enterprise Features:**
- `invoices` (100 entries) - Purchase invoices
- `employees` (10 entries) - Organizational hierarchy
- `glCodes` (10 entries) - Financial GL codes

**NLP/Support:**
- `prompts` (350 entries) - Customer inquiries
- `questions` (150 entries) - Q&A pairs
- `answers` (50 entries) - Support responses

**Analytics:**
- `price_history` - Historical pricing and demand data

### Uploading Data

```bash
# Upload all tables
npm run upload-data

# Dry run (test without uploading)
npm run upload-data:dry-run
```

See [UPLOAD_README.md](UPLOAD_README.md) for detailed instructions.

## Testing

### Running Tests

```bash
# Interactive watch mode
npm test

# Single run with coverage
npm run test:coverage

# Specific test file
npm test -- ProductPage.test.js

# Playwright tests (screenshots)
npm run test:screenshots
```

### Test Structure

- Unit tests: `src/__tests__/`
- Integration tests: `tests/`
- Screenshot tests: `scripts/screenshot/screenshots.spec.js`

## Deployment

The application is configured for multiple platforms:

### Azure Web Apps (Primary)

Currently deployed at https://demo.aito.ai/

```bash
# Build for production
npm run build

# Deploy (via Azure CLI or GitHub Actions)
```

### Netlify

Configuration in `netlify.toml`:

```bash
# Build
npm run build

# Deploy
netlify deploy --prod
```

### Vercel

Configuration in `vercel.json`:

```bash
# Deploy
vercel --prod
```

### Docker

Multi-stage Docker build with nginx:

```bash
# Build image
docker build -t aito-demo .

# Run container
docker run -p 3000:80 aito-demo
```

See deployment configs:
- `netlify.toml` - Netlify configuration
- `vercel.json` - Vercel configuration
- `Dockerfile` - Docker container
- `nginx.conf` - Nginx configuration

## Troubleshooting

### Common Issues

**Port 3000 already in use:**
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm start
```

**Backend server not starting:**
```bash
# Check if port is available
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001

# Start on different port
PORT=3002 npm run start:backend
```

**Screenshot generation failing:**
```bash
# Install Playwright dependencies
npx playwright install-deps chromium

# Or use Docker
npm run screenshots:docker
```

**Aito API connection issues:**
```bash
# Verify credentials in .env
cat .env | grep AITO

# Test connection
curl -X POST $AITO_URL/api/v1/_predict \
  -H "X-API-Key: $AITO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"from": "products", "where": {}, "predict": "tags"}'
```

**Build errors:**
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Git merge conflicts:**
```bash
# View conflicted files
git status

# Resolve conflicts, then
git add .
git commit -m "Resolve merge conflicts"
```

### Debug Mode

Enable verbose logging:

```bash
# React app debug mode
REACT_APP_DEBUG=true npm start

# Playwright debug mode
DEBUG=pw:api npm run screenshots:all
```

### Getting Help

- **Issues**: https://github.com/AitoDotAI/aito-demo/issues
- **Aito Docs**: https://aito.ai/docs
- **Aito API Reference**: https://aito.ai/docs/api

## Development Workflow

### Adding a New Feature

1. **Create feature branch:**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Implement feature:**
   - Add API module in `src/` (e.g., `14-my-feature.js`)
   - Create page component in `src/app/pages/`
   - Add route in `src/app/App.js`
   - Update menu in `src/app/components/NavBar.js`

3. **Add data fetcher:**
   - Export function from `src/app/data/index.js`
   - Wire up in `App.js` dataFetchers object

4. **Document feature:**
   - Add use case doc in `docs/use-cases/`
   - Update README.md with feature description
   - Generate screenshots

5. **Test and commit:**
   ```bash
   npm test
   npm run lint
   git add .
   git commit -m "Add my feature"
   ```

6. **Create PR:**
   ```bash
   git push origin feature/my-feature
   gh pr create --title "Feature: My Feature"
   ```

### Code Style

- Follow ESLint configuration
- Use Prettier for formatting
- Add JSDoc comments for complex functions
- Keep components focused and reusable

### Commit Messages

Follow conventional commits:

```
feat: Add price prediction to Product Catalog
fix: Resolve CSS conflict in Analytics page
docs: Update screenshot generation guide
refactor: Simplify recommendation logic
test: Add unit tests for invoice processing
```

## Performance Tips

### Development

```bash
# Skip browser download for Playwright
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install

# Use fast refresh
npm start  # Hot reload enabled by default
```

### Production Build

```bash
# Optimize build
npm run build

# Analyze bundle size
npm install -g source-map-explorer
source-map-explorer 'build/static/js/*.js'
```

## Additional Resources

- [Main README](README.md) - User-facing documentation
- [CLAUDE.md](CLAUDE.md) - AI assistant context
- [UPLOAD_README.md](UPLOAD_README.md) - Data upload guide
- [Design System](org/guides/ui-design-system.md) - UI/UX guidelines
- [Screenshot Guide](scripts/screenshot/SCREENSHOT_GUIDE.md) - Screenshot details

## License

Apache 2.0 - See [LICENSE.txt](LICENSE.txt)
