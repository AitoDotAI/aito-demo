import axios from 'axios'
import config from './config'

/**
 * Predicts relevant tags for a product based on its name
 * 
 * This demonstrates Aito's _predict endpoint for classification tasks.
 * The system learns tag patterns from existing products to suggest
 * appropriate tags for new or updated products.
 * 
 * Use case: Auto-tagging products for better searchability
 * 
 * @param {string} productName - Name of the product to suggest tags for
 * @returns {Promise<Array>} Array of suggested tag strings
 */
export function getTagSuggestions(productName) {
  // Use Aito's _predict endpoint to find likely tags
  return axios.post(`${config.aito.url}/api/v1/_predict`, {
    from: 'products',        // Look at the products table
    where: {
      name: productName      // For products with this name
    },
    predict: 'tags',         // Predict the 'tags' field
    
    // exclusiveness: false means tags are not mutually exclusive
    // (a product can have multiple tags)
    exclusiveness: false,
    
    limit: 10               // Get top 10 tag predictions
  }, {
    headers: {
      'x-api-key': config.aito.apiKey
    },
  })
    .then(response => {
      return response.data.hits
        // Filter predictions with >50% confidence
        // $p is the probability score (0-1) for each prediction
        .filter(e => e.$p > 0.5)  
        // Extract just the tag value from each prediction
        .map(hit => hit.feature)
    })
}
