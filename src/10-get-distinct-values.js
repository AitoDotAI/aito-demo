import { aitoPostRaw } from './aito-client'

/**
 * Gets distinct values for a specific field from the visits table
 *
 * This function queries Aito to retrieve all unique values for a given field,
 * which is useful for populating dropdown menus with available options.
 * For user.id field, it filters to only show the main demo personas.
 * For array fields like user.tags, uses $feature to get individual values.
 *
 * @param {string} field - Field name to get distinct values for (e.g., 'user.tags', 'user.id', 'weekday')
 * @returns {Promise<Array>} Array of distinct values found in the field
 */
export function getDistinctValues(field) {
  // For user.id field, return the predefined demo personas
  if (field === 'user.id') {
    return Promise.resolve(['larry', 'veronica', 'alice'])
  }

  // Array fields need to use $feature to get individual values
  const arrayFields = ['user.tags']
  const isArrayField = arrayFields.includes(field)
  const matchField = isArrayField ? `${field}.$feature` : field

  // Query the visits table to get distinct values for the specified field
  return aitoPostRaw('_match', {
    from: 'visits',           // Table to query
    match: matchField,        // Field to extract values from (use $feature for array fields)
    limit: 50                 // Get up to 50 distinct values
  })
    .then(result => {
      // Extract the distinct values from the response
      if (isArrayField) {
        // For array fields using $feature, the value is in 'feature'
        return result.data.hits.map(hit => hit.feature).filter(value => value != null)
      }
      // For regular fields, the value is in '$value'
      return result.data.hits.map(hit => hit.$value).filter(value => value != null)
    })
    .catch(error => {
      console.error('Error fetching distinct values:', error)
      return []
    })
}