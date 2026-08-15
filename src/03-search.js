import { aitoPostRaw } from './aito-client'

/**
 * Performs personalized product search using Aito.ai's intelligent query API
 * 
 * This function demonstrates several key Aito.ai features:
 * 1. Text matching across multiple fields (tags and name)
 * 2. User-based personalization through context
 * 3. Purchase probability-weighted ranking
 * 4. Match highlighting for search results
 * 
 * @param {string} userId - User identifier for personalization (e.g., 'larry', 'veronica', 'alice')
 * @param {string} inputValue - Search query text from user input
 * @returns {Promise<Array>} Array of product search results with match highlights
 */
export function getProductSearchResults(userId, inputValue) {
  // Build the search query with Aito's $match operator
  // $match performs fuzzy text matching on Text fields
  // Note: tags is now an array field (String[]) so we search only on name
  var where = {
    'product.name': { "$match": inputValue }
  }
  
  // Add user context for personalization if userId is provided
  // This allows Aito to learn from user's past purchase behavior
  if (userId) {
    where['context.user'] = String(userId)
  }

  // Execute Aito query with personalized ranking
  return aitoPostRaw('_query', {
    from: 'impressions',      // Query the impressions table (product views)
    where: where,             // Apply search and user filters
    get: 'product',           // Extract product information
    
    // Intelligent ranking formula that combines:
    // 1. Text similarity ($similarity) - how well the product matches search terms
    // 2. Purchase probability ($p) - likelihood of purchase given context
    orderBy: { 
      '$multiply': [
        "$similarity",        // Text relevance score (0-1)
        {
          "$p": {             // Conditional probability operator
            "$context": {     // Given the current context...
              "purchase": true // ...what's the probability of purchase?
            }
          }
        }
      ]
    },
    
    // Select the product fields the result list renders. `$matches` used to
    // be requested here for match highlighting but nothing ever read it, and
    // v2 has no equivalent ("'$matches' is not a supported computed select
    // expression"), so it is dropped rather than made version-conditional.
    select: ["name", "id", "tags", "price"],
    limit: 5  // Return top 5 results
  })
    .then(response => {
      // Return the hits array containing matched products
      return response.data.hits
    })
}
