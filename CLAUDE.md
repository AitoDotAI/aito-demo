# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Transformation Goals

This repository is being transformed from a sales demo into:
1. **Open Source Repository**: Clean, documented codebase for public use
2. **Web-Deployable Demo**: Live version accessible from aito.ai website  
3. **Documentation/Blog Content**: Use case examples with screenshots, queries, and schema explanations

## Commands

### Development
- `export NODE_OPTIONS=--openssl-legacy-provider` - Required before running other commands
- `npm install` - Install dependencies
- `npm start` - Start development server
- `npm run build` - Build production version
- `npm test` - Run tests

### Data Generation
- `node src/generator/index.js` - Regenerate all data files
- `node src/generator/index.js --info` - List all available tags and products
- `node src/generator/index.js --only-weekly-schedules` - Regenerate only weekly schedules
- `node src/generator/index.js -h` - Show generator help

## Architecture

This is a React-based demo application showcasing Aito.ai's predictive database capabilities through a grocery store interface. Aito.ai is a fully managed database with machine learning abilities that provides predictive queries through a database-like interface, eliminating traditional ML model training and deployment.

### Core Structure

- **App.js**: Main application component with routing, state management, and data fetcher abstraction
- **Data Layer**: All ML/AI functionality is abstracted through `dataFetchers` object in App.js
- **Exercise Files**: Root-level files (01-search.js, 02-recommend.js, etc.) contain Aito API integrations
- **Configuration**: `src/config.js` handles Aito API URL and key configuration

### Key Data Flow

1. **User Interaction**: Components trigger actions through `dataFetchers` prop
2. **Data Fetching**: App.js routes requests to appropriate data modules
3. **API Integration**: Exercise files (01-search.js, etc.) handle Aito API calls
4. **State Management**: React state in App.js manages cart, user selection, and UI state

### Aito.ai Integration

The demo showcases core Aito.ai API endpoints:

#### Main API Endpoints Used
- **_search**: Text-based product search with personalization
- **_recommend**: Personalized product recommendations based on user behavior
- **_predict**: Tag suggestions, invoice processing, and classification tasks
- **_query**: Generic queries for data retrieval and analysis

#### Use Cases Demonstrated
1. **Smart Search** (01-search.js): Personalized search results based on user preferences
2. **Recommendations** (02-recommend.js): Dynamic product suggestions excluding cart items
3. **Tag Prediction** (03-get-tag-suggestions.js): Automatic product tag generation
4. **Autocomplete** (04-autocomplete.js): Intelligent search suggestions
5. **Autofill** (05-autofill.js): Predictive form completion
6. **Natural Language Processing** (06-prompt.js): Question/feedback classification
7. **Relationship Analysis** (07-relate.js): Data correlation discovery
8. **Invoice Processing** (08-predict-invoice.js): Automated invoice field prediction
9. **Product Analytics** (09-product.js): Behavioral insights and statistics

### Data Schema

The application uses a relational schema with four main tables:
- `users`: User profiles (larry, veronica, alice)
- `products`: 42 grocery items with tags and pricing
- `sessions`: User shopping sessions
- `impressions`: Product views and purchase decisions

Additional tables for advanced features:
- `prompts`: Natural language processing examples
- `invoices`: Invoice processing training data

### Exercise Integration

The app is designed as a progressive learning tool:
- Each numbered file (01-search.js, 02-recommend.js, etc.) demonstrates specific Aito features
- Files can be updated with different API queries to show functionality evolution
- The data generator simulates realistic user behavior for ML training
- Progressive complexity from simple search to advanced NLP and document processing

### Configuration Notes

- `localHost` flag in config.js switches between local and cloud Aito instances
- API keys are environment-specific
- CORS workaround available for local development using Chrome flags
- Aito queries use JSON format similar to SQL but with ML-specific operators like `$match`, `$p`, `$similarity`

### Documentation Features

For blog posts and documentation:
- Each exercise file contains real Aito queries that can be copied/explained
- The data generator creates realistic datasets for meaningful demo results
- Schema.json provides clear data structure examples
- Multiple user personas (larry, veronica, alice) demonstrate personalization
- Visual components show prediction confidence scores and explanations