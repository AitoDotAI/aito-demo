/**
 * Per-route content for the ContextPanel.
 * Each route maps to a title, description, Aito endpoints used,
 * an example query, and resource links.
 */

const GITHUB_REPO = 'https://github.com/AitoDotAI/aito-demo'
const GITHUB_SRC = `${GITHUB_REPO}/blob/main/src`
const GITHUB_DOCS = `${GITHUB_REPO}/blob/main/docs`
const AITO_DOCS = 'https://aito.ai/docs/api'
const USE_CASES = 'https://aito.ai/docs/api/use-cases'
const WORKBOOK = 'https://console.aito.ai/databases/aito-demo/workbooks/73b73f53-8a8b-461a-a154-d7276e62fe23'

export const CONTEXT_PANEL_CONTENT = {
  '/': {
    title: 'Smart Grocery Store',
    description:
      'Personalized search, autocomplete, and product recommendations powered by Aito\'s predictive database. Results adapt in real-time to each user persona.',
    endpoints: ['_recommend', '_query'],
    exampleQuery: `{
  "from": "impressions",
  "where": {
    "context.user": "larry"
  },
  "recommend": "product",
  "goal": { "purchase": true },
  "limit": 5
}`,
    links: {
      useCases: [
        { name: 'Recommendations', url: `${USE_CASES}/recommendations/` },
        { name: 'Smart Search', url: `${USE_CASES}/smart-search/` },
        { name: 'Autocomplete', url: `${USE_CASES}/autocomplete/` },
      ],
      workbook: WORKBOOK,
      apiDocs: `${AITO_DOCS}/_recommend`,
      sourceFiles: [
        { name: '01-recommend.js', url: `${GITHUB_SRC}/01-recommend.js` },
        { name: '03-search.js', url: `${GITHUB_SRC}/03-search.js` },
      ],
    },
  },

  '/help': {
    title: 'NLP Support Center',
    description:
      'Natural language classification of customer inquiries with sentiment analysis and automatic routing via the _predict endpoint.',
    endpoints: ['_predict'],
    exampleQuery: `{
  "from": "prompts",
  "where": {
    "prompt": "delivery is late"
  },
  "predict": "type",
  "select": ["$p", "type"]
}`,
    links: {
      useCases: [
        { name: 'Text Classification', url: `${USE_CASES}/nlp-processing/` },
      ],
      workbook: WORKBOOK,
      apiDocs: `${AITO_DOCS}/_predict`,
      sourceFiles: [
        { name: '06-prompt.js', url: `${GITHUB_SRC}/06-prompt.js` },
      ],
    },
  },

  '/customer-chat': {
    title: 'AI Shopping Assistant',
    description:
      'Conversational shopping interface combining LLM language understanding with Aito predictive tools for search, recommendations, and cart management.',
    endpoints: ['_recommend', '_query'],
    exampleQuery: null,
    links: {
      useCases: [
        { name: 'Recommendations', url: `${USE_CASES}/recommendations/` },
        { name: 'Smart Search', url: `${USE_CASES}/smart-search/` },
        { name: 'Assistant Integration Guide', url: `${GITHUB_DOCS}/tutorials/assistant-integration.md` },
      ],
      apiDocs: `${AITO_DOCS}/_recommend`,
      sourceFiles: [
        { name: '01-recommend.js', url: `${GITHUB_SRC}/01-recommend.js` },
      ],
    },
  },

  '/product': {
    title: 'Product Analytics',
    description:
      'Per-product performance metrics using batch queries, time-series analysis, and statistical correlation discovery across demographics.',
    endpoints: ['_relate', '_query'],
    exampleQuery: `{
  "from": "visits",
  "where": {
    "purchases": {
      "$has": "2000818700008"
    }
  },
  "relate": "user.tags"
}`,
    links: {
      useCases: [
        { name: 'Product Analytics', url: `${USE_CASES}/product-analytics/` },
        { name: 'Data Analytics', url: `${USE_CASES}/data-analytics/` },
      ],
      workbook: WORKBOOK,
      apiDocs: `${AITO_DOCS}/_relate`,
      sourceFiles: [
        { name: '09-product.js', url: `${GITHUB_SRC}/09-product.js` },
        { name: '07-relate.js', url: `${GITHUB_SRC}/07-relate.js` },
      ],
    },
  },

  '/analytics': {
    title: 'Preference Analytics',
    description:
      'Statistical correlation analysis using _relate to discover relationships between user demographics and product preferences.',
    endpoints: ['_relate', '_match'],
    exampleQuery: `{
  "from": "impressions",
  "where": {
    "context.user.tags": {
      "$has": "young"
    }
  },
  "relate": ["product.name"]
}`,
    links: {
      useCases: [
        { name: 'Data Analytics', url: `${USE_CASES}/data-analytics/` },
      ],
      workbook: WORKBOOK,
      apiDocs: `${AITO_DOCS}/_relate`,
      sourceFiles: [
        { name: '07-relate.js', url: `${GITHUB_SRC}/07-relate.js` },
      ],
    },
  },

  '/pricing': {
    title: 'Price-Demand Analytics',
    description:
      'Price optimization and demand forecasting using Aito\'s _estimate endpoint with regression, full explainability, and what-if analysis.',
    endpoints: ['_estimate'],
    exampleQuery: `{
  "from": "price_history",
  "where": {
    "product_id": "milk",
    "sale_price": 2.5
  },
  "estimate": "units_sold"
}`,
    links: {
      useCases: [
        { name: 'Price Optimization', url: `${USE_CASES}/price-optimization/` },
      ],
      apiDocs: `${AITO_DOCS}/_estimate`,
      sourceFiles: [
        { name: '12-price-estimation.js', url: `${GITHUB_SRC}/12-price-estimation.js` },
      ],
    },
  },

  '/invoicing': {
    title: 'Invoice Processing',
    description:
      'Automated GL code assignment and approval routing using document classification via _predict. Includes explainable AI with the $why operator.',
    endpoints: ['_predict'],
    exampleQuery: `{
  "from": "invoices",
  "where": {
    "Description": "office supplies"
  },
  "predict": "GLCode",
  "select": ["$p", "GLCode", "$why"]
}`,
    links: {
      useCases: [
        { name: 'Invoice Processing', url: `${USE_CASES}/invoice-processing/` },
      ],
      workbook: WORKBOOK,
      apiDocs: `${AITO_DOCS}/_predict`,
      sourceFiles: [
        { name: '08-predict-invoice.js', url: `${GITHUB_SRC}/08-predict-invoice.js` },
      ],
    },
  },

  '/admin': {
    title: 'Product Catalog',
    description:
      'AI-powered tag prediction, category classification, and price estimation for new products. Reduces manual catalog work.',
    endpoints: ['_predict'],
    exampleQuery: `{
  "from": "products",
  "where": {
    "name": "organic oat milk"
  },
  "predict": "category",
  "select": ["$p", "category"]
}`,
    links: {
      useCases: [
        { name: 'Automated Tagging', url: `${USE_CASES}/tag-prediction/` },
      ],
      apiDocs: `${AITO_DOCS}/_predict`,
      sourceFiles: [
        { name: '04-get-tag-suggestions.js', url: `${GITHUB_SRC}/04-get-tag-suggestions.js` },
        { name: '13-product-predictions.js', url: `${GITHUB_SRC}/13-product-predictions.js` },
      ],
    },
  },

  '/admin-chat': {
    title: 'Employee Assistant',
    description:
      'Business intelligence chatbot providing real-time analytics and insights through natural language, powered by LLM with Aito analytics tools.',
    endpoints: ['_query', '_relate'],
    exampleQuery: null,
    links: {
      useCases: [
        { name: 'Data Analytics', url: `${USE_CASES}/data-analytics/` },
        { name: 'Assistant Integration Guide', url: `${GITHUB_DOCS}/tutorials/assistant-integration.md` },
      ],
      apiDocs: `${AITO_DOCS}/_query`,
      sourceFiles: [],
    },
  },

  '/cart': {
    title: 'Predictive Cart Autofill',
    description:
      'Smart cart filling that predicts products you typically purchase based on your shopping patterns. Uses _predict on visit history with a confidence threshold to suggest your regular items.',
    endpoints: ['_predict', '_query'],
    exampleQuery: `{
  "from": "visits",
  "where": {
    "user": "larry"
  },
  "predict": "purchases",
  "exclusiveness": false,
  "select": ["$p", "$value"]
}`,
    links: {
      useCases: [
        { name: 'Autofill', url: `${USE_CASES}/autofill/` },
      ],
      workbook: WORKBOOK,
      apiDocs: `${AITO_DOCS}/_predict`,
      sourceFiles: [
        { name: '05-autofill.js', url: `${GITHUB_SRC}/05-autofill.js` },
      ],
    },
  },

  '/evaluation': {
    title: 'Model Quality Monitoring',
    description:
      'Real-time model evaluation using _evaluate. Measures accuracy, mean rank, and response time with configurable test/train splits.',
    endpoints: ['_evaluate'],
    exampleQuery: `{
  "test": {
    "$index": { "$mod": [5, 0] }
  },
  "evaluate": {
    "from": "invoices",
    "where": {
      "Description": { "$get": "Description" }
    },
    "predict": "GLCode"
  }
}`,
    links: {
      useCases: [
        { name: 'Quality Monitoring', url: `${USE_CASES}/quality-monitoring/` },
      ],
      workbook: WORKBOOK,
      apiDocs: `${AITO_DOCS}/_evaluate`,
      sourceFiles: [
        { name: '11-evaluate.js', url: `${GITHUB_SRC}/11-evaluate.js` },
      ],
    },
  },
}

export const DEFAULT_CONTEXT = {
  title: 'Aito Predictive Database',
  description:
    'Query-based ML inference without model training. SQL-like queries return predictions instead of raw data.',
  endpoints: [],
  exampleQuery: null,
  links: {
    useCases: [
      { name: 'All Use Cases', url: `${USE_CASES}/` },
    ],
    workbook: WORKBOOK,
    apiDocs: AITO_DOCS,
    sourceFiles: [
      { name: 'GitHub Repository', url: GITHUB_REPO },
    ],
  },
}
