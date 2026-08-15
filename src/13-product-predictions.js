import axios from 'axios'
import config from './config'

/**
 * Predicts category for a product based on its name
 *
 * This demonstrates Aito's _predict endpoint for classification tasks.
 * The system learns category patterns from existing products to suggest
 * appropriate category for new products.
 *
 * Use case: Auto-categorize products for better organization
 *
 * @param {string} productName - Name of the product to predict category for
 * @returns {Promise<Object|null>} Predicted category object with value and confidence, or null
 */
export function predictCategory(productName) {
  return axios.post(`${config.aito.apiBase}/_predict`, {
    from: 'products',
    where: {
      name: productName
    },
    predict: 'category',
    limit: 1
  }, {
    headers: {
      'x-api-key': config.aito.apiKey
    },
  })
    .then(response => {
      const hits = response.data.hits
      if (hits && hits.length > 0) {
        const prediction = hits[0]
        return {
          value: prediction.feature,
          confidence: prediction.$p
        }
      }
      return null
    })
}

/**
 * Predicts price for a product based on its name
 *
 * This demonstrates Aito's _predict endpoint for regression tasks.
 * The system learns pricing patterns from existing products to suggest
 * appropriate price for new products.
 *
 * Use case: Auto-price products based on similar items
 *
 * @param {string} productName - Name of the product to predict price for
 * @returns {Promise<Object|null>} Predicted price object with value and confidence, or null
 */
export function predictPrice(productName) {
  return axios.post(`${config.aito.apiBase}/_predict`, {
    from: 'products',
    where: {
      name: productName
    },
    predict: 'price',
    limit: 1
  }, {
    headers: {
      'x-api-key': config.aito.apiKey
    },
  })
    .then(response => {
      const hits = response.data.hits
      if (hits && hits.length > 0) {
        const prediction = hits[0]
        return {
          value: prediction.feature,
          confidence: prediction.$p
        }
      }
      return null
    })
}

/**
 * Predicts all product attributes (category, price, tags) at once
 *
 * @param {string} productName - Name of the product
 * @returns {Promise<Object>} Object containing all predictions
 */
export async function predictProductAttributes(productName) {
  try {
    const [category, price] = await Promise.all([
      predictCategory(productName),
      predictPrice(productName)
    ])

    return {
      category,
      price
    }
  } catch (error) {
    console.error('Error predicting product attributes:', error)
    return {
      category: null,
      price: null
    }
  }
}
