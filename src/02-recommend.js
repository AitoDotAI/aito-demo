import axios from 'axios'
import config from './config'

/**
 * Get personalized product recommendations using Aito's _recommend endpoint
 * 
 * This demonstrates Aito's core ML capability: goal-oriented recommendations.
 * The system learns from historical data to recommend products that maximize
 * the likelihood of achieving the specified goal (purchase).
 * 
 * Key features:
 * - User-specific recommendations based on purchase history
 * - Excludes items already in the shopping basket
 * - Optimizes for purchase probability
 * 
 * @param {string} userId - User identifier for personalization
 * @param {Array} currentShoppingBasket - Products already in cart (to exclude)
 * @param {number} count - Number of recommendations to return
 * @returns {Promise<Array>} Array of recommended products
 */
export function getRecommendedProducts(userId, currentShoppingBasket, count) {
  // Aito's _recommend endpoint uses machine learning to find items
  // that maximize the probability of achieving a specified goal
  return axios.post(`${config.aito.url}/api/v1/_recommend`, {
    from: 'impressions',  // Analyze product impression data
    
    where: {
      // Filter recommendations for specific user
      'context.user': String(userId),
      
      // Exclude products already in basket using $not operator
      // This creates an AND condition of NOT conditions for each basket item
      'product.id': {
        $and: currentShoppingBasket.map(item => ({ $not: item.id })),
      }
    },
    
    recommend: 'product',       // Field to recommend (product details)
    goal: { 'purchase': true }, // Optimize for purchase likelihood
    
    // Fields to return for each recommendation
    select: ["name", "id", "tags", "price"],
    limit: count  // Number of recommendations
  }, {
    headers: {
      'x-api-key': config.aito.apiKey
    },
  })
    .then(result => {
      // Return array of recommended products with their scores
      return result.data.hits
    })
}
