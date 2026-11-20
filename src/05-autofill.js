import { aitoPostRaw, nonExclusivePredict } from './aito-client'
import config from './config'
import { isEmptyPopulation } from './aito-client'

/**
 * Retrieves multiple products by their IDs in a single query
 * 
 * This is a utility function used to fetch product details after
 * prediction or recommendation operations that return only IDs.
 * 
 * @param {Array<string>} ids - Array of product IDs to fetch
 * @returns {Promise<Array>} Array of complete product objects
 */
export function getProductsByIds(ids) {
  return aitoPostRaw('_query', {
    "from": "products",     // Query the products table
    "where" : {
      "id": {
        // $or operator matches any ID in the array
        "$or": ids
      }
    }
  })
    .then(result => {
      return result.data.hits
    })
}

/**
 * Predicts products a user is likely to purchase for cart pre-filling
 * 
 * This advanced feature demonstrates predictive shopping behavior:
 * - Analyzes user's purchase history and patterns
 * - Predicts items they're likely to buy on their next visit
 * - Can be used for "quick reorder" or "smart shopping list" features
 * 
 * @param {string} userId - User identifier for prediction
 * @returns {Promise<Array>} Array of product IDs likely to be purchased
 */
export function getAutoFill(userId) {
  console.log(`getAutoFill: Starting prediction for userId: ${userId}`);
  
  // The user is a POPULATION, not evidence.
  //
  // This used to send `where: { user: userId }` at the top level, which reads
  // as "given that the shopper is Larry" while still drawing on every visit by
  // every shopper. Larry's next basket was being predicted partly from
  // strangers'. A nested `from` makes it a boundary instead — the same shape
  // 06-prompt.js already uses to scope prompts to `type: "request"`.
  //
  // With no userId there is no boundary to draw, so the plain table is the
  // honest spelling of "all visits".
  const from = userId
    ? { "from": "visits", "where": { "user": userId } }
    : "visits"
  console.log(`getAutoFill: population:`, from);

  // Predict future purchases based on historical patterns
  console.log(`getAutoFill: Making API call to ${config.aito.apiBase}/_predict`);
  return aitoPostRaw('_predict', {
    "from": from,            // this shopper's visits, not everyone's
    // Score each product independently — a user can buy several.
    ...nonExclusivePredict('purchases'),
    
    // Return probability and product ID for each prediction
    "select": ["$p", "$value"]
  })
    .then(result => {
      console.log(`getAutoFill: API response received:`, result.data);
      var ids = []

      // Filter predictions to include only high-confidence items
      result.data.hits.forEach(hit => {
        console.log(`getAutoFill: Processing hit - probability: ${hit.$p}, value: ${hit.$value}`);
        // Include products with 40%+ purchase probability
        // This threshold balances relevance with variety
        if (hit.$p >= 0.4) {
          ids.push(hit.$value)
        }
      })
      console.log(`getAutoFill: Filtered IDs (>= 0.4 probability):`, ids);
            
      return ids
    })
    .catch(error => {
      // A nested `from` whose restriction matches nothing is a 400, not an
      // empty result: "nested from: the restriction matched no rows of
      // 'visits'". So scoping to a shopper with no visits turns what used to
      // be an unhelpful answer into a broken page. Measured against shared
      // 2026-10-01; the three demo personas all have visits (9/8/6), which is
      // why this is luck rather than safety.
      //
      // Nothing to prefill is the honest answer for a shopper with no history,
      // and it is what the pooled version effectively returned. Falling back to
      // everyone's visits would be worse: prefilling a stranger's basket.
      if (isEmptyPopulation(error)) {
        console.log(`getAutoFill: no visits for ${userId}; nothing to prefill`);
        return [];
      }
      console.error(`getAutoFill: API error for userId ${userId}:`, error);
      throw error;
    })
}
