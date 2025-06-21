# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About This Project

A comprehensive React-based demonstration of Aito.ai's predictive database capabilities through an intelligent grocery store application. This project showcases 9 real-world ML use cases in e-commerce, from personalized search to automated document processing.

## Commands

### Essential Development Commands
```bash
# Setup (first time)
npm install
cp .env.example .env

# Development
npm start                    # Start development server (http://localhost:3000)
npm run build               # Build production version
npm test                    # Run tests in watch mode
npm run test:coverage       # Run tests with coverage report

# Code Quality
npm run lint                # Check code with ESLint
npm run lint:fix            # Fix ESLint issues automatically
npm run format              # Format code with Prettier
npm run format:check        # Check code formatting

# Data Management
npm run upload-data           # Upload all data to Aito.ai instance
npm run upload-data:dry-run   # Test upload process without actual upload

# Note: Data files are provided as static JSON files in src/data/
# See UPLOAD_README.md for detailed upload instructions
```

### Environment Notes
- **No API key setup required** - Uses public demo instance by default
- The `.env.example` contains working credentials for immediate use
- Source maps disabled (`GENERATE_SOURCEMAP=false`) for smaller builds
- **Custom Aito Instance**: Set `AITO_URL` and `AITO_API_KEY` environment variables to use your own instance

## Architecture Overview

### High-Level Structure
This is a single-page React application that demonstrates 9 different Aito.ai use cases through a cohesive grocery store interface. The architecture emphasizes educational value while maintaining production-ready code quality.

**Key Design Principles:**
- Each Aito.ai feature is isolated in numbered files (01-search.js through 09-product.js)
- All API interactions are abstracted through a `dataFetchers` object passed down as props
- Components are designed for both functionality and educational clarity
- Three distinct user personas (Larry, Veronica, Alice) demonstrate personalization

### Core Application Flow
1. **App.js** - Central hub managing state, routing, and data fetching abstraction
2. **DataFetchers** - Clean API layer that maps UI actions to Aito.ai calls
3. **API Modules** (01-09.js) - Individual files demonstrating specific Aito capabilities
4. **Components** - React components for UI with integrated ML features

### Technology Stack
- **Frontend**: React 18.3.1 with Create React App
- **UI Components**: Reactstrap (Bootstrap 5), React Icons, Recharts for visualization
- **HTTP Client**: Axios for API calls
- **Styling**: Custom CSS with Bootstrap integration
- **State Management**: Component-based state (no Redux/Context API)
- **Quality Tools**: ESLint, Prettier, Husky git hooks

### Aito.ai Integration Patterns

The application showcases these core Aito.ai capabilities:

**Search & Discovery:**
- `01-search.js` - Personalized search with `$match`, `$similarity`, and purchase probability ranking
- `04-autocomplete.js` - Smart query completion using `$startsWith` and user patterns

**Machine Learning:**
- `02-recommend.js` - Goal-oriented recommendations using `_recommend` endpoint
- `03-get-tag-suggestions.js` - Classification using `_predict` with confidence thresholds
- `05-autofill.js` - Predictive user behavior analysis

**Advanced Analytics:**
- `06-prompt.js` - Natural language processing with explainable AI (`$why` operator)
- `07-relate.js` - Statistical correlation discovery using `_relate` endpoint
- `08-predict-invoice.js` - Enterprise document classification with GL code assignment
- `09-product.js` - Comprehensive analytics using batch queries and time-series analysis

**Enterprise Features:**
- **Invoice Processing**: Automatic GL code assignment and approval routing
- **Customer Support**: NLP-powered inquiry classification and auto-assignment
- **Demographic Targeting**: Tag-based user segmentation for personalized experiences
- **Temporal Analytics**: Day-of-week and seasonal pattern analysis

### Data Architecture

**User Demographics**: 67 users with tag-based segmentation (young/older, male/female, club-member) plus the original 3 personas (Larry, Veronica, Alice) for demonstration purposes

**Core E-commerce Tables:**
- `impressions` - Product interactions and purchase decisions (90,087 entries - primary ML training data)
- `contexts` - Search interactions and basket states (5,290 entries)
- `visits` - Shopping sessions with temporal tracking (736 entries)
- `products` - 42 grocery items with Google Analytics integration (clicks, impressions)
- `users` - Customer demographics with tag-based segmentation (67 entries)

**Enterprise Functionality Tables:**
- `invoices` - Purchase invoices with approval workflows (100 entries)
- `employees` - Organizational hierarchy for document processing (10 entries)
- `glCodes` - General Ledger codes for financial categorization (10 entries)

**NLP and Support Tables:**
- `prompts` - Customer service inquiries with classification (350 entries)
- `questions` - Q&A pairs for support automation (150 entries)
- `answers` - Standardized responses for customer support (50 entries)

**Key Relationships:**
- `users` → `visits` → `contexts` → `impressions` → `products` (core shopping flow)
- `employees` ← `invoices` → `glCodes` (enterprise document processing)
- `prompts`/`questions` → `answers` → `employees` (support system)

### Key Aito.ai Concepts Implemented

**Query Operators:**
- `$match` - Fuzzy text matching across multiple fields
- `$similarity` - Text relevance scoring
- `$p` - Probability calculations and conditional queries
- `$or`, `$and`, `$not` - Logical combinations
- `$startsWith` - String prefix matching
- `$why` - Explainable AI with decision highlighting

**API Endpoints:**
- `_query` - Flexible data retrieval with ordering and filtering
- `_predict` - Classification and regression with confidence scores
- `_recommend` - Goal-oriented ML recommendations
- `_relate` - Statistical relationship analysis
- `_batch` - Multiple queries for comprehensive analytics

### Development Patterns

**API Integration:**
- All Aito calls return promises and include proper error handling
- User context is consistently passed for personalization
- Confidence thresholds filter low-quality predictions
- Results include match highlighting and explanation data

**State Management:**
- Central state in App.js manages user selection, cart, and navigation
- Clean separation between UI state and API data
- Real-time updates reflect user actions and ML predictions

**Educational Design:**
- Each numbered file serves as a standalone tutorial
- Comprehensive JSDoc comments explain business logic and ML concepts
- Progressive complexity from basic search to advanced document processing
- Real-world use cases with practical business value

### Testing Strategy

**Framework**: Jest with React Testing Library
**Pattern**: Mock-based testing for API calls
**Location**: Tests in `src/__tests__/` directory
**Coverage**: Run `npm run test:coverage` for coverage reports

### Deployment Configuration

**Multi-platform deployment ready:**
- **Netlify** (primary) - `netlify.toml` with performance optimizations and API proxies
- **Vercel** - `vercel.json` with serverless configuration  
- **Docker** - Multi-stage builds with nginx, health checks, and security best practices
- **Traditional hosting** - nginx configuration included

## Design System

The application follows a comprehensive design system documented in [`org/guides/ui-design-system.md`](org/guides/ui-design-system.md). Key design principles include:

- **Orange Accent Theme**: `#FF6B35` used consistently for interactive elements, buttons, and highlights
- **Professional Layout**: Clean typography, proper spacing, and visual hierarchy
- **Responsive Design**: Mobile-first approach with CSS Grid and Flexbox
- **Component Consistency**: Unified styling across landing page, invoice page, and all UI elements

For detailed styling guidelines, color palettes, spacing systems, and implementation patterns, refer to the full design system documentation.