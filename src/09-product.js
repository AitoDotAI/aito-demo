import axios from 'axios'
import config from './config'

/**
 * Retrieves detailed information for a specific product by ID
 * 
 * @param {string|number} id - The product ID to retrieve details for
 * @returns {Promise<Object>} - Product details from the database
 */
export function getProductDetails(id){
  return axios.post(`${config.aito.url}/api/v1/_query`,
    {
      from: 'products',
      limit:1,
      offset: id
    }, {
    headers: { 'x-api-key': config.aito.apiKey },
  })
    .then(response => {
      return response.data    
  })
}

/**
 * Retrieves all products from the database (limited to 100)
 * 
 * @returns {Promise<Object>} - Array of all products with their details
 */
export function getAllProducts(){
  return axios.post(`${config.aito.url}/api/v1/_query`,
    {
      from: 'products',
      limit: 100
    }, {
    headers: { 'x-api-key': config.aito.apiKey },
  })
    .then(response => {
      return response.data    
  })
}

/**
 * Retrieves statistical data for a specific product including purchase metrics
 * 
 * @param {string|number} id - The product ID to get statistics for
 * @returns {Promise<Object>} - Aggregated purchase statistics (sum and mean)
 */
export function getProductStats(id){

  return axios.post(`${config.aito.url}/api/v1/_aggregate`, 
    {
      "from": "impressions",
      "where": {
        "product.id": id
      },
      "aggregate": ["purchase.$sum", "purchase.$mean"]
    }, {
    headers: { 'x-api-key': config.aito.apiKey },
  })
    .then(response => {
      return response.data    
  })
}

/**
 * Performs comprehensive analytics for a product including:
 * - Related product properties
 * - User demographics correlation
 * - Shopping basket analysis
 * - Search query analysis
 * - Purchase trends over time
 * 
 * @param {string|number} id - The product ID to analyze
 * @returns {Promise<Object>} - Comprehensive analytics data
 */
export function getProductAnalytics(id){

  // Execute multiple analytics queries in parallel using batch API
  return axios.post(`${config.aito.url}/api/v1/_batch`,
    [
      { // Analyze which product properties correlate with purchases
        "from": "impressions",
        "where": {"purchase": true},
        "relate": {
          "product": id
        },
        "select": ["lift", "related"]
      },
      { // Analyze correlation between user demographics and this product
        "from": "visits",
        "where": {
          "purchases": {"$has": id}
        },
        "relate": "user.tags",
        "select": ["lift", "related"]
      },
      { // Market basket analysis - what other products are bought together
        "from": "visits",
        "where": {
          "purchases": {"$has": id}
        },
        "relate": "purchases",
        "select": ["lift", "related"]
      },
      { // Analyze which search terms lead to this product being purchased
        "from": "impressions",
        "where": {
          "product.id": id
        },
        "get": "context.queryPhrase",
        "orderBy": { "$sum": {"$context": "purchase" } },
        "select": ["$score", "$value"]
      },
      { // Time-series analysis of purchase patterns
        "from": "impressions",
        "where": {
          "product.id": id
        }, 
        "get": "context.week",
        "select": [
          "$value",
          "$f",
          {"$sum": {"$context": "purchase"}},
          {"$mean": {"$context": "purchase"}}
        ]
      }
    ], {
    headers: { 'x-api-key': config.aito.apiKey },
  })
    .then(response => {
      return response.data    
  })
}
