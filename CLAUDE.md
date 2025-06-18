# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About This Project

A comprehensive React-based demonstration of Aito.ai's predictive database capabilities through an intelligent grocery store application. This repository has been transformed from a sales demo into a production-ready open source project with comprehensive documentation and modern development practices.

## Commands

### Essential Development Commands
```bash
# Setup (first time)
npm install
cp .env.example .env

# Development
npm start                    # Start development server
npm run build               # Build production version
npm test                    # Run tests in watch mode
npm run test:coverage       # Run tests with coverage report

# Code Quality
npm run lint                # Check code with ESLint
npm run lint:fix            # Fix ESLint issues automatically
npm run format              # Format code with Prettier
npm run format:check        # Check code formatting

# Data Generation
npm run generate-data       # Regenerate demo data
```

### Environment Notes
- **No API key setup required** - Uses public demo instance by default
- The `.env.example` contains working credentials for immediate use
- Modern Node.js versions (17+) are fully supported (OpenSSL issues resolved)

## Architecture Overview

### High-Level Structure
This is a single-page React application that demonstrates 9 different Aito.ai use cases through a cohesive grocery store interface. The architecture emphasizes educational value while maintaining production-ready code quality.

**Key Design Principles:**
- Each Aito.ai feature is isolated in numbered files (01-search.js through 09-product.js)
- All API interactions are abstracted through a `dataFetchers` object
- Components are designed for both functionality and educational clarity
- Comprehensive documentation serves as implementation tutorials

### Core Application Flow
1. **App.js** - Central hub managing state, routing, and data fetching abstraction
2. **DataFetchers** - Clean API layer that maps UI actions to Aito.ai calls
3. **API Modules** (01-09.js) - Individual files demonstrating specific Aito capabilities
4. **Components** - React components for UI with integrated ML features

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
- `08-predict-invoice.js` - Document classification with highlighted decision factors
- `09-product.js` - Comprehensive analytics using batch queries and time-series analysis

### Data Architecture

**User Personas**: Three distinct user types (Larry - lactose-free, Veronica - vegetarian, Alice - all-goes) demonstrate personalization

**Core Tables:**
- `impressions` - Product interactions and purchase decisions (primary ML training data)
- `products` - 42 grocery items with tags, prices, and metadata
- `visits` - User shopping sessions with basket analysis
- `contexts` - Search history for autocomplete functionality

**Specialized Tables:**
- `prompts` - NLP examples for question/feedback classification
- `invoices` - Document processing training data with approval workflows

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

### Testing and Quality

The codebase includes:
- ESLint configuration for consistent code style
- Prettier for automated formatting
- Jest testing framework setup
- CI/CD pipeline with automated testing and deployment
- Security scanning and dependency management

### Deployment Configuration

**Multi-platform deployment ready:**
- Netlify (primary) - `netlify.toml` with optimizations
- Vercel - `vercel.json` with serverless configuration  
- Docker - Multi-stage builds with security best practices
- Traditional hosting - nginx configuration included