import { aitoPostRaw } from './aito-client'

/**
 * Get personalized product recommendations using Aito's _recommend endpoint
 * 
 * This demonstrates Aito's core ML capability: goal-oriented recommendations.
 * The system learns from historical data to recommend products that maximize
 * the likelihood of achieving the specified goal (purchase).
 * 
 * Key features:
 * - User-specific recommendations based on purchase history
 * - Excludes items already in the shopping basket
 * - Optimizes for purchase probability
 * 
 * @param {string} userId - User identifier for personalization
 * @param {Array} currentShoppingBasket - Products already in cart (to exclude)
 * @param {number} count - Number of recommendations to return
 * @returns {Promise<Array>} Array of recommended products
 */
export function getRecommendedProducts(userId, currentShoppingBasket, count) {
  // Aito's _recommend endpoint uses machine learning to find items
  // that maximize the probability of achieving a specified goal
  // Use config.aito.apiBase so the same code targets either v1
  // (Rep1, master env) or v2 (Rep2, named env) depending on
  // REACT_APP_USE_REP2 / REACT_APP_AITO_ENV. See src/config.js.
  return aitoPostRaw('_recommend', {
    from: 'impressions',  // Analyze product impression data
    
    where: {
      // Filter recommendations for specific user
      'context.user': String(userId),

      // Exclude products already in the basket: an AND of NOT conditions,
      // one per basket item.
      //
      // Omitted entirely when the basket is empty. An empty `$and: []` is a
      // no-op that v1 accepts, but v2 answers 501 "empty.reduceLeft" — an
      // unguarded fold over the empty clause list. The basket IS empty on
      // first load, so sending it would fail the store landing page for
      // every new visitor on v2 while working the moment anything is added
      // to the cart. Filed upstream; this guard is correct on both versions
      // regardless, since the clause says nothing when there is nothing to
      // exclude.
      ...(currentShoppingBasket.length
        ? {
          'product.id': {
            $and: currentShoppingBasket.map(item => ({ $not: item.id })),
          },
        }
        : {}),
    },
    
    recommend: 'product',       // Field to recommend (product details)
    goal: { 'purchase': true }, // Optimize for purchase likelihood
    
    // Fields to return for each recommendation
    select: ["name", "id", "tags", "price"],
    limit: count  // Number of recommendations
  })
    .then(result => {
      // Return array of recommended products with their scores
      return result.data.hits
    })
}
