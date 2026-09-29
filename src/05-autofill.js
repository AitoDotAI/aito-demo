import { aitoPostRaw, nonExclusivePredict } from './aito-client'
import config from './config'

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

// Every product at or above CONFIDENT goes in. If that leaves the cart short of
// MIN_ITEMS, it is topped up with the next most likely products, but never below
// FLOOR, so a weak guess is still not added.
//
// A threshold alone failed in practice: per-product purchase probabilities for a
// regular customer cluster just under 0.4 (Larry on 2026-09-29: 0.417, then
// 0.393, 0.370, 0.360, 0.349 ...), so "autofill" put ONE item in the cart.
export const AUTOFILL = { CONFIDENT: 0.4, FLOOR: 0.3, MIN_ITEMS: 5 }

export function pickAutoFill(hits, { CONFIDENT, FLOOR, MIN_ITEMS } = AUTOFILL) {
  const ranked = [...hits].sort((a, b) => b.$p - a.$p)
  const confident = ranked.filter(h => h.$p >= CONFIDENT)
  const topUp = ranked
    .filter(h => h.$p < CONFIDENT && h.$p >= FLOOR)
    .slice(0, Math.max(0, MIN_ITEMS - confident.length))
  return [...confident, ...topUp].map(h => h.$value)
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
  
  var where = {}
  if (userId) {
    where['user'] = userId
  }
  console.log(`getAutoFill: Query where clause:`, where);

  // Predict future purchases based on historical patterns
  console.log(`getAutoFill: Making API call to ${config.aito.apiBase}/_predict`);
  return aitoPostRaw('_predict', {
    "from": "visits",        // Analyze visit/session data
    "where" : where,         // Filter by user if specified
    // Score each product independently — a user can buy several.
    ...nonExclusivePredict('purchases'),
    
    // Return probability and product ID for each prediction
    "select": ["$p", "$value"]
  })
    .then(result => {
      console.log(`getAutoFill: API response received:`, result.data);
      const ids = pickAutoFill(result.data.hits)
      console.log(`getAutoFill: picked IDs:`, ids);
      return ids
    })
    .catch(error => {
      console.error(`getAutoFill: API error for userId ${userId}:`, error);
      throw error;
    })
}
