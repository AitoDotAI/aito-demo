import axios from 'axios'
import config from './config'

/**
 * Retrieves detailed information for a specific product by ID
 * 
 * @param {string|number} id - The product ID to retrieve details for
 * @returns {Promise<Object>} - Product details from the database
 */
export function getProductDetails(id){
  return axios.post(`${config.aito.apiBase}/_query`,
    {
      from: 'products',
      where: { id: id },
      limit: 1
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
  return axios.post(`${config.aito.apiBase}/_query`,
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

  return axios.post(`${config.aito.apiBase}/_aggregate`, 
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

  // First fetch the product so we can pass its full set of properties
  // as the relate proposition. Passing the object lets Aito enumerate
  // propositions on each property of THIS product (name, category, tags,
  // cost, price, googleClicks, ...) without the duplicate-condition issue
  // we got from `relate: {product: id}` after the proposition-selection
  // change.
  return getProductDetails(id).then(productResp => {
    const product = (productResp.hits && productResp.hits[0]) || {}
    const { id: _ignored, ...productProps } = product

    return axios.post(`${config.aito.apiBase}/_batch`,
    [
      { // Which of this product's properties are over-represented in
        // purchases vs the baseline of all impressions?
        "from": "impressions",
        "where": {"purchase": true},
        "relate": {"product": productProps},
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
      .then(response => response.data)
  })
}
