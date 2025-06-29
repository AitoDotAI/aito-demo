/**
 * Help content for all features with descriptions and use case links
 */

const GITHUB_BASE = 'https://github.com/AitoDotAI/aito-demo/blob/main/docs/use-cases'

export const HELP_CONTENT = {
  'Smart Search': {
    title: 'Smart Search with Personalization',
    description: 'Intelligent product search that learns from user behavior to deliver personalized, relevant results. Unlike traditional keyword matching, this system considers your shopping history and preferences to show products you\'re most likely to purchase.',
    technicalDetails: 'Uses Aito.ai\'s _query endpoint with behavioral data. Combines text similarity with purchase probability scoring using the $multiply operator on $similarity and $p values.',
    useCaseLink: `${GITHUB_BASE}/01-smart-search.md`
  },
  
  'Recommendations': {
    title: 'Personalized Product Recommendations',
    description: 'Dynamic product suggestions that adapt to your shopping cart and personal preferences. The system automatically excludes items already in your cart and suggests complementary products you\'re likely to enjoy.',
    technicalDetails: 'Leverages Aito.ai\'s _recommend endpoint with goal optimization. Uses behavioral data from the impressions table to predict purchase likelihood while filtering out cart contents.',
    useCaseLink: `${GITHUB_BASE}/02-recommendations.md`
  },
  
  'Tag Prediction': {
    title: 'Automatic Tag Prediction',
    description: 'AI-powered product categorization that automatically suggests relevant tags for new products. This feature dramatically reduces manual catalog management while ensuring consistent and comprehensive product labeling.',
    technicalDetails: 'Uses Aito.ai\'s _predict endpoint to analyze product names and descriptions. Learns from existing product-tag relationships to suggest appropriate categories with confidence scores.',
    useCaseLink: `${GITHUB_BASE}/03-tag-prediction.md`
  },
  
  'Autocomplete': {
    title: 'Intelligent Search Autocomplete',
    description: 'Context-aware search suggestions that predict what you\'re looking for as you type. Goes beyond simple prefix matching to understand user intent and provide relevant product suggestions.',
    technicalDetails: 'Combines prefix matching with behavioral analysis using Aito.ai queries. Analyzes user search patterns and product interactions to rank suggestions by relevance and likelihood.',
    useCaseLink: `${GITHUB_BASE}/04-autocomplete.md`
  },
  
  'Autofill': {
    title: 'Predictive Cart Autofill',
    description: 'Smart cart filling that predicts and adds products you typically purchase based on your shopping patterns. Saves time by automatically suggesting your regular items and discovering new products you might enjoy.',
    technicalDetails: 'Analyzes historical purchase data using Aito.ai\'s predictive capabilities. Uses user behavior patterns and seasonal trends to suggest optimal cart contents.',
    useCaseLink: `${GITHUB_BASE}/05-autofill.md`
  },
  
  'NLP Processing': {
    title: 'Natural Language Processing & Classification',
    description: 'Automatic analysis and classification of customer feedback, support tickets, and user queries. Understands sentiment, categorizes content, and routes messages without complex preprocessing.',
    technicalDetails: 'Uses Aito.ai\'s text analysis capabilities with the _predict endpoint. Processes natural language text to determine sentiment, category, and appropriate routing actions.',
    useCaseLink: `${GITHUB_BASE}/06-nlp-processing.md`
  },
  
  'Product Analytics': {
    title: 'AI-Powered Product Analytics',
    description: 'Comprehensive product performance insights including sales trends, customer preferences, and statistical relationships. Discover hidden patterns in your product data with interactive visualizations.',
    technicalDetails: 'Uses Aito.ai\'s _relate endpoint for correlation analysis and _batch queries for comprehensive analytics. Combines multiple data sources for rich insights.',
    useCaseLink: `${GITHUB_BASE}/09-product-analytics.md`
  },
  
  'Invoice Processing': {
    title: 'Automated Invoice Processing',
    description: 'Intelligent document processing that automatically extracts fields, assigns GL codes, and routes invoices for approval. Reduces manual processing time and improves accuracy.',
    technicalDetails: 'Uses Aito.ai\'s classification capabilities to analyze invoice content and predict appropriate categorization and routing based on historical patterns.',
    useCaseLink: `${GITHUB_BASE}/08-invoice-processing.md`
  },
  
  'Shopping Assistant': {
    title: 'AI Shopping Assistant',
    description: 'Natural language shopping interface that helps customers find products, manage their cart, and get personalized recommendations through conversation. Combines the power of GPT with Aito.ai\'s predictive database.',
    technicalDetails: 'Integrates OpenAI GPT for natural language understanding with Aito.ai tools for product search, recommendations, and cart management. Uses function calling to execute shopping actions.',
    useCaseLink: `${GITHUB_BASE}/../tutorials/assistant-integration.md`
  },
  
  'Admin Assistant': {
    title: 'Business Intelligence Assistant',
    description: 'Conversational analytics interface that provides real-time business insights through natural language queries. Ask questions about sales, customer behavior, and product performance in plain English.',
    technicalDetails: 'Combines GPT\'s language understanding with Aito.ai\'s analytics capabilities. Uses specialized tools to query business metrics, generate reports, and provide actionable insights.',
    useCaseLink: `${GITHUB_BASE}/../tutorials/assistant-integration.md`
  },
  
  'Data Analytics': {
    title: 'Statistical Data Analysis',
    description: 'Explore statistical relationships and correlations in your data using AI-powered analysis. Discover hidden patterns and insights by selecting different data fields and values to see what factors are related.',
    technicalDetails: 'Uses Aito.ai\'s _relate endpoint to perform statistical correlation analysis. Calculates lift values to show positive and negative relationships between different data dimensions.',
    useCaseLink: `${GITHUB_BASE}/07-data-analytics.md`
  }
}

export default HELP_CONTENT