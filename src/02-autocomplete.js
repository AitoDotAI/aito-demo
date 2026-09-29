import { aitoPostRaw } from './aito-client'

/**
 * Provides intelligent search query autocomplete suggestions
 * 
 * This demonstrates Aito's ability to analyze historical search patterns
 * and provide personalized autocomplete suggestions based on:
 * - What the user has searched before
 * - What similar users have searched
 * - Overall search popularity
 * 
 * @param {string} userId - User identifier for personalized suggestions
 * @param {string} prefix - Current search input prefix to complete
 * @returns {Promise<Array>} Array of autocomplete suggestions with probabilities
 */
export function getAutoComplete(userId, prefix) {
  // Build filter conditions
  var where = {}
  
  // Filter queries that start with the typed prefix
  // $startsWith is Aito's string prefix matching operator
  if (prefix) {
    where['queryPhrase'] = {
      "$startsWith": prefix.toLowerCase()
    }
  } 
  
  // Personalize suggestions based on user's search history
  if (userId) {
    where['user'] = userId
  }
  
  // Query historical search contexts
  return aitoPostRaw('_query', {
    from: 'contexts',        // Table containing search history
    where: where,            // Apply prefix and user filters
    get: 'queryPhrase',      // Extract the search phrases
    
    // Order by probability ($p) - most likely completions first
    // This considers both frequency and user patterns
    orderBy: '$p',
    
    // Return probability score and the query phrase
    select: ["$p", "$value"]
  })
    .then(result => {
      // Return array of suggestions with their probability scores. A search
      // with no text is logged as the phrase "", and it is the MOST likely one
      // (Larry: p 0.436 against 0.038 for "bread"), so it is dropped here.
      return result.data.hits.filter(hit => typeof hit.$value === 'string' && hit.$value.trim() !== '')
    })
}
