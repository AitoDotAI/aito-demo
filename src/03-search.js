import axios from 'axios'
import config from './config'

/**
 * Performs personalized product search using Aito.ai's intelligent query API
 * 
 * This function demonstrates several key Aito.ai features:
 * 1. Text matching across multiple fields (tags and name)
 * 2. User-based personalization through context
 * 3. Purchase probability-weighted ranking
 * 4. Match highlighting for search results
 * 
 * @param {string} userId - User identifier for personalization (e.g., 'larry', 'veronica', 'alice')
 * @param {string} inputValue - Search query text from user input
 * @returns {Promise<Array>} Array of product search results with match highlights
 */
export function getProductSearchResults(userId, inputValue) {
  // Build the search query with Aito's $match operator
  // $match performs fuzzy text matching on fields
  var where = {
    'product' : {
      // Use $or to search across multiple fields
      '$or': [
        {'tags': { "$match": inputValue }},  // Search in product tags
        {'name': { "$match": inputValue }}   // Search in product names
      ]
    }
  }
  
  // Add user context for personalization if userId is provided
  // This allows Aito to learn from user's past purchase behavior
  if (userId) {
    where['context.user'] = String(userId)
  }

  // Execute Aito query with personalized ranking
  return axios.post(`${config.aito.url}/api/v1/_query`, {
    from: 'impressions',      // Query the impressions table (product views)
    where: where,             // Apply search and user filters
    get: 'product',           // Extract product information
    
    // Intelligent ranking formula that combines:
    // 1. Text similarity ($similarity) - how well the product matches search terms
    // 2. Purchase probability ($p) - likelihood of purchase given context
    orderBy: { 
      '$multiply': [
        "$similarity",        // Text relevance score (0-1)
        {
          "$p": {             // Conditional probability operator
            "$context": {     // Given the current context...
              "purchase": true // ...what's the probability of purchase?
            }
          }
        }
      ]
    },
    
    // Select specific fields to return, including match highlights
    select: ["name", "id", "tags", "price", "$matches"],
    limit: 5  // Return top 5 results
  }, {
    headers: { 'x-api-key': config.aito.apiKey },
  })
    .then(response => {
      // Return the hits array containing matched products
      return response.data.hits
    })
}
