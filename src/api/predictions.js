/**
 * Predictions API Integration
 * Handles various prediction tasks using Aito's predictive capabilities
 */

import axios from 'axios'
import config from '../config'

/**
 * Get tag suggestions for a product name
 * @param {string} productName - Name of the product
 * @returns {Promise<Array>} Array of suggested tags
 */
export function getTagSuggestions(productName) {
  return axios
    .post(
      `${config.aito.url}/api/v1/_predict`,
      {
        from: 'products',
        where: {
          name: productName,
        },
        predict: 'tags',
        exclusiveness: false,
        limit: 10,
      },
      {
        headers: {
          'x-api-key': config.aito.apiKey,
        },
      }
    )
    .then(response => {
      return response.data.hits
        .filter(e => e.$p > 0.5) // Filter out low-confidence results
        .map(hit => hit.feature)
    })
    .catch(error => {
      console.error('Tag suggestions API error:', error)
      throw new Error('Failed to fetch tag suggestions')
    })
}

/**
 * Predict invoice fields from input data
 * @param {Object} input - Input data for prediction
 * @param {Array} output - Fields to predict
 * @returns {Promise<Array>} Array of predictions for each field
 */
export function predictInvoice(input, output) {
  const outputFields = {
    Processor: ['Name', 'Role', 'Department', 'Superior'],
    Acceptor: ['Name', 'Role', 'Department', 'Superior'],
    GLCode: ['Name', 'GLCode', 'Department'],
  }

  return Promise.all(
    output.map(predicted => {
      const select = [
        '$p',
        {
          $why: {
            highlight: {
              posPreTag: '<b>',
              posPostTag: '</b>',
            },
          },
        },
      ]

      // Add fields specific to the prediction type
      if (outputFields[predicted]) {
        outputFields[predicted].forEach(field => {
          select.push(field)
        })
      }

      return axios
        .post(
          `${config.aito.url}/api/v1/_predict`,
          {
            from: 'invoices',
            where: input,
            predict: predicted,
            select: select,
            limit: 10,
          },
          {
            headers: {
              'x-api-key': config.aito.apiKey,
            },
          }
        )
        .then(response => response.data.hits)
    })
  ).catch(error => {
    console.error('Invoice prediction API error:', error)
    throw new Error('Failed to predict invoice fields')
  })
}