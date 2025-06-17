/**
 * Recommendations API Integration
 * Provides personalized product recommendations using Aito's ML capabilities
 */

import axios from 'axios'
import config from '../config'

/**
 * Get personalized product recommendations
 * Excludes items already in the shopping basket
 * @param {string} userId - User identifier for personalization
 * @param {Array} currentShoppingBasket - Items currently in cart
 * @param {number} count - Number of recommendations to return
 * @returns {Promise<Array>} Array of recommended products
 */
export function getRecommendedProducts(userId, currentShoppingBasket, count) {
  const where = {
    'context.user': String(userId),
  }

  // Exclude items already in cart
  if (currentShoppingBasket && currentShoppingBasket.length > 0) {
    where['product.id'] = {
      $and: currentShoppingBasket.map(item => ({ $not: item.id })),
    }
  }

  return axios
    .post(
      `${config.aito.url}/api/v1/_recommend`,
      {
        from: 'impressions',
        where: where,
        recommend: 'product',
        goal: { purchase: true },
        select: ['name', 'id', 'tags', 'price'],
        limit: count,
      },
      {
        headers: {
          'x-api-key': config.aito.apiKey,
        },
      }
    )
    .then(result => {
      return result.data.hits
    })
    .catch(error => {
      console.error('Recommendations API error:', error)
      throw new Error('Failed to fetch recommendations')
    })
}