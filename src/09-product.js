import { aitoPostRaw, productPropertyRelate, perCandidateAggregates } from './aito-client'

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
 * Retrieves statistical data for a specific product including purchase metrics
 * 
 * @param {string|number} id - The product ID to get statistics for
 * @returns {Promise<Object>} - Aggregated purchase statistics (sum and mean)
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
      return response.data    
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
    // Both panels below `get` through a link (context.queryPhrase,
    // context.week), where v2's per-candidate aggregates come back zero.
    // See perCandidateAggregates(); omitted there rather than charted.
    const aggregates = perCandidateAggregates('context.week')

    return aitoPostRaw('_batch',
    [
      { // Which of THIS product's property values are over-represented in
        // purchases, against the baseline of all impressions? Feeds the
        // "CTR by Product Property" panel.
        //
        // Answerable on both since aito-core 2.8.1 (the `$props` carrier).
        // The `limit: 0` stand-in remains for the case where a product has no
        // scalar properties at all: it keeps the batch indices aligned, since
        // the page reads results[0..4] positionally.
        "from": "impressions",
        "where": {"purchase": true},
        // `lift` and `related` only exist on a relate result. The stand-in
        // must therefore drop them too, or the whole _batch 400s with
        // "no such field 'lift'" and every panel on the page goes blank.
        ...(propertyRelate.supported
          ? { "relate": propertyRelate.relate, "select": ["lift", "related"] }
          : { "limit": 0 })
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
      { // Analyze which search terms lead to this product being purchased.
        // Ranked by purchases per phrase, which v2 cannot compute (zeros).
        "from": "impressions",
        "where": {
          "product.id": id
        },
        ...(aggregates
          ? {
            "get": "context.queryPhrase",
            "orderBy": { "$sum": {"$context": "purchase" } },
            "select": ["$score", "$value"],
          }
          : { "limit": 0 }),
      },
      { // Time-series analysis of purchase patterns. Same aggregate
        // limitation as the panel above.
        "from": "impressions",
        "where": {
          "product.id": id
        },
        ...(aggregates
          ? {
            "get": "context.week",
            "select": [
              "$value",
              "$f",
              {"$sum": {"$context": "purchase"}},
              {"$mean": {"$context": "purchase"}}
            ],
          }
          : { "limit": 0 }),
      }
    ])
      .then(response => {
        const results = response.data
        // Where v2 cannot ask the question, hand back an empty, explicitly
        // marked result rather than anything that could be read as an answer.
        if (!propertyRelate.supported && Array.isArray(results) && results[0]) {
          results[0] = { ...results[0], hits: [], unsupported: 'aito-core#1064' }
        }
        // Panels 3 and 4 read per-candidate aggregates, which v2 returns as
        // zeros. Empty beats a chart of flat zeroes that reads as real data.
        if (!aggregates && Array.isArray(results)) {
          for (const i of [3, 4]) {
            if (results[i]) results[i] = { ...results[i], hits: [], unsupported: 'v2-per-candidate-aggregates' }
          }
        }
        return results
      })
  })
}
