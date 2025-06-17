/**
 * Smart Search API Integration
 * Provides personalized product search using Aito's predictive database
 */

import axios from 'axios'
import config from '../config'

/**
 * Search for products with personalization
 * @param {string} userId - User identifier for personalization
 * @param {string} inputValue - Search query
 * @returns {Promise<Array>} Array of product search results
 */
export function getProductSearchResults(userId, inputValue) {
  // Build search criteria
  const where = {
    product: {
      $or: [
        { tags: { $match: inputValue } },
        { name: { $match: inputValue } },
      ],
    },
  }

  // Add user context for personalization if available
  if (userId) {
    where['context.user'] = String(userId)
  }

  return axios
    .post(
      `${config.aito.url}/api/v1/_query`,
      {
        from: 'impressions',
        where: where,
        get: 'product',
        orderBy: {
          $multiply: [
            '$similarity',
            {
              $p: {
                $context: {
                  purchase: true,
                },
              },
            },
          ],
        },
        select: ['name', 'id', 'tags', 'price', '$matches'],
        limit: 5,
      },
      {
        headers: { 'x-api-key': config.aito.apiKey },
      }
    )
    .then(response => {
      return response.data.hits
    })
    .catch(error => {
      console.error('Search API error:', error)
      throw new Error('Failed to fetch search results')
    })
}