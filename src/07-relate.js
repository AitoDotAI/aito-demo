import axios from 'axios'
import config from './config'

/**
 * Analyzes statistical relationships between data fields
 * 
 * This demonstrates Aito's _relate endpoint, which performs correlation analysis
 * to find statistical relationships between different data dimensions.
 * 
 * Key insight: Finds products that are statistically correlated with
 * specific field values (e.g., what products do users from certain
 * demographics tend to purchase?)
 * 
 * @param {string} field - Field name to analyze relationships for (e.g., 'user.demographics')
 * @param {any} value - Specific value of the field to analyze
 * @returns {Promise<Array>} Array of related items with lift scores
 */
export function relate(field, value) {
  // Build query condition for the field-value pair
  var where = {}
  where[field] = value

  // Step 1: Find statistical relationships using _relate endpoint
  return axios.post(`${config.aito.url}/api/v1/_relate`, {
    "from": "visits",        // Analyze visitor session data
    "where": where,          // Filter by the specified field-value condition
    "relate": "purchases"    // Find relationships with the purchases field
  }, {
    headers: {
      'x-api-key': config.aito.apiKey
    },
  })
    .then(results => {
      // Extract product IDs from the relation results
      // Each result contains a "related" field with the correlated purchase
      const ids = results.data.hits.map(x => {
        return x["related"]["purchases"]["$has"]
      })

      // Step 2: Get full product details for the related product IDs
      return axios.post(`${config.aito.url}/api/v1/_query`, {
        "from": "products",    // Query the products table
        "where": {
          "id": {
            "$or": ids        // Match any of the related product IDs
          }
        },
        limit: ids.length
      }, {
        headers: {
          'x-api-key': config.aito.apiKey
        },
      }).then(products => {
        // Create a lookup map from product ID to product details
        var idsToProducts = {}
        console.log("hits: " + JSON.stringify(products.data.hits))
        products.data.hits.forEach(i => {
          idsToProducts[i.id] = i
        })
        
        // Combine relation statistics with product information
        var rv = results.data.hits.map(i => {
          const value = idsToProducts[i.related.purchases.$has].name 
          return {
            lift: i.lift,     // Statistical lift score (how much more likely)
            value: value      // Product name
          }
        })        

        return rv
      })
    })
}
