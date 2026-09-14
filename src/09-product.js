import { aitoPostRaw, productPropertyRelate } from './aito-client'

/**
 * Retrieves detailed information for a specific product by ID
 * 
 * @param {string|number} id - The product ID to retrieve details for
 * @returns {Promise<Object>} - Product details from the database
 */
export function getProductDetails(id){
  return aitoPostRaw('_query',
    {
      from: 'products',
      where: { id: id },
      limit: 1
    })
    .then(response => {
      return response.data
  })
}

/**
 * Retrieves all products from the database (limited to 100)
 * 
 * @returns {Promise<Object>} - Array of all products with their details
 */
export function getAllProducts(){
  return aitoPostRaw('_query',
    {
      from: 'products',
      limit: 100
    })
    .then(response => {
      return response.data    
  })
}

/**
 * Retrieves statistical data for a specific product including purchase metrics.
 *
 * `_aggregate` names its results after the field and the operator, so the
 * response is keyed `purchase.$sum`, `purchase.$sum.samples` and
 * `purchase.$mean` — on BOTH API versions, identically. The three headline
 * tiles on the product page read `sum`, `sum.samples` and `mean`, which no
 * response has ever contained, so all three have rendered their `|| 0`
 * fallback since the page was written: 0 IMPRESSIONS, 0 PURCHASES, 0.0% CTR.
 * Nothing was wrong with the query or the data — `Pirkka banana` has had
 * 2928 impressions, 334 purchases and an 11.4% CTR throughout.
 *
 * The named fields below are that response under the names the page means, so
 * the tiles read something that exists. No arithmetic: `impressions` is the
 * sample count the sum was taken over, `purchases` is the sum, and `ctr` is
 * the mean of a Boolean, which IS the click-through rate. The raw keys are
 * kept alongside so nothing that reads them breaks.
 *
 * @param {string|number} id - The product ID to get statistics for
 * @returns {Promise<Object>} - the raw aggregate, plus impressions/purchases/ctr
 */
export function getProductStats(id){

  return aitoPostRaw('_aggregate', 
    {
      "from": "impressions",
      "where": {
        "product.id": id
      },
      "aggregate": ["purchase.$sum", "purchase.$mean"]
    })
    .then(response => {
      const stats = response.data || {}
      return {
        ...stats,
        impressions: stats["purchase.$sum.samples"],
        purchases: stats["purchase.$sum"],
        ctr: stats["purchase.$mean"],
      }
  })
}

/**
 * Performs comprehensive analytics for a product including:
 * - Related product properties
 * - User demographics correlation
 * - Shopping basket analysis
 * - Search query analysis
 * - Purchase trends over time
 *
 * @param {string|number} id - The product ID to analyze
 * @returns {Promise<Object>} - Comprehensive analytics data
 */
export function getProductAnalytics(id){

  // Fetch the product first: v1 relates on its property values directly, and
  // v2 needs them to narrow a population-wide ranking back down to it.
  return getProductDetails(id).then(productResp => {
    const product = (productResp.hits && productResp.hits[0]) || {}
    const { id: _ignored, ...productProps } = product
    const propertyRelate = productPropertyRelate(productProps)

    return aitoPostRaw('_batch',
    [
      { // Which of THIS product's property values are over-represented in
        // purchases, against the baseline of all impressions? Feeds the
        // "CTR by Product Property" panel.
        //
        // v2 has no form that asks this — see productPropertyRelate(). When
        // unsupported, a `limit: 0` stand-in keeps the batch indices aligned
        // (the page reads results[0..4] positionally) and the panel renders
        // empty rather than showing figures from a different question.
        "from": "impressions",
        "where": {"purchase": true},
        ...(propertyRelate.supported
          ? { "relate": propertyRelate.relate }
          : { "limit": 0 }),
        "select": ["lift", "related"]
      },
      { // Analyze correlation between user demographics and this product
        "from": "visits",
        "where": {
          "purchases": {"$has": id}
        },
        "relate": ["user.tags"],
        "select": ["lift", "related"]
      },
      { // Market basket analysis - what other products are bought together
        "from": "visits",
        "where": {
          "purchases": {"$has": id}
        },
        "relate": ["purchases"],
        "select": ["lift", "related"]
      },
      { // Analyze which search terms lead to this product being purchased
        "from": "impressions",
        "where": {
          "product.id": id
        },
        "get": "context.queryPhrase",
        "orderBy": { "$sum": {"$context": "purchase" } },
        "select": ["$score", "$value"]
      },
      { // Time-series analysis of purchase patterns
        "from": "impressions",
        "where": {
          "product.id": id
        }, 
        "get": "context.week",
        "select": [
          "$value",
          "$f",
          {"$sum": {"$context": "purchase"}},
          {"$mean": {"$context": "purchase"}}
        ]
      }
    ])
      .then(response => {
        const results = response.data
        // Where v2 cannot ask the question, hand back an empty, explicitly
        // marked result rather than anything that could be read as an answer.
        if (!propertyRelate.supported && Array.isArray(results) && results[0]) {
          results[0] = { ...results[0], hits: [], unsupported: 'aito-core#1064' }
        }
        return results
      })
  })
}
