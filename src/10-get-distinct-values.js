import axios from 'axios'
import config from './config'

/**
 * Gets distinct values for a specific field from the visits table
 * 
 * This function queries Aito to retrieve all unique values for a given field,
 * which is useful for populating dropdown menus with available options.
 * For user.id field, it filters to only show the main demo personas.
 * 
 * @param {string} field - Field name to get distinct values for (e.g., 'user.tags', 'user.id', 'weekday')
 * @returns {Promise<Array>} Array of distinct values found in the field
 */
export function getDistinctValues(field) {
  // For user.id field, return the predefined demo personas
  if (field === 'user.id') {
    return Promise.resolve(['larry', 'veronica', 'alice'])
  }

  // Query the visits table to get distinct values for the specified field
  return axios.post(`${config.aito.url}/api/v1/_query`, {
    from: 'visits',           // Table to query
    get: field,              // Field to extract values from
    orderBy: '$p',           // Order by probability (most common first)
    select: ['$value']       // Return just the values
  }, {
    headers: {
      'x-api-key': config.aito.apiKey
    },
  })
    .then(result => {
      // Extract the distinct values from the response
      return result.data.hits.map(hit => hit.$value).filter(value => value != null)
    })
    .catch(error => {
      console.error('Error fetching distinct values:', error)
      return []
    })
}