import axios from 'axios'
import config from './config'

/**
 * Retrieves multiple products by their IDs in a single query
 * 
 * This is a utility function used to fetch product details after
 * prediction or recommendation operations that return only IDs.
 * 
 * @param {Array<string>} ids - Array of product IDs to fetch
 * @returns {Promise<Array>} Array of complete product objects
 */
export function getProductsByIds(ids) {
  return axios.post(`${config.aito.url}/api/v1/_query`, {
    "from": "products",     // Query the products table
    "where" : {
      "id": {
        // $or operator matches any ID in the array
        "$or": ids
      }
    }
  }, {
    headers: {
      'x-api-key': config.aito.apiKey
    },
  })
    .then(result => {
      return result.data.hits
    })
}

/**
 * Predicts products a user is likely to purchase for cart pre-filling
 * 
 * This advanced feature demonstrates predictive shopping behavior:
 * - Analyzes user's purchase history and patterns
 * - Predicts items they're likely to buy on their next visit
 * - Can be used for "quick reorder" or "smart shopping list" features
 * 
 * @param {string} userId - User identifier for prediction
 * @returns {Promise<Array>} Array of product IDs likely to be purchased
 */
export function getAutoFill(userId) {
  console.log(`getAutoFill: Starting prediction for userId: ${userId}`);
  
  var where = {}
  if (userId) {
    where['user'] = userId
  }
  console.log(`getAutoFill: Query where clause:`, where);

  // Predict future purchases based on historical patterns
  console.log(`getAutoFill: Making API call to ${config.aito.url}/api/v1/_predict`);
  return axios.post(`${config.aito.url}/api/v1/_predict`, {
    "from": "visits",        // Analyze visit/session data
    "where" : where,         // Filter by user if specified
    "predict":"purchases",   // Predict the purchases field (array of product IDs)
    
    // exclusiveness: false because users can buy multiple products
    "exclusiveness" : false,
    
    // Return probability and product ID for each prediction
    "select": ["$p", "$value"]
  }, {
    headers: {
      'x-api-key': config.aito.apiKey
    },
  })
    .then(result => {
      console.log(`getAutoFill: API response received:`, result.data);
      var ids = []

      // Filter predictions to include only high-confidence items
      result.data.hits.forEach(hit => {
        console.log(`getAutoFill: Processing hit - probability: ${hit.$p}, value: ${hit.$value}`);
        // Include products with 40%+ purchase probability
        // This threshold balances relevance with variety
        if (hit.$p >= 0.4) {
          ids.push(hit.$value)
        }
      })
      console.log(`getAutoFill: Filtered IDs (>= 0.4 probability):`, ids);
            
      return ids
    })
    .catch(error => {
      console.error(`getAutoFill: API error for userId ${userId}:`, error);
      throw error;
    })
}
