import {
  aitoPostRaw,
  productPropertyRelate,
  rankedCandidateSelect,
  setMemberLiftQueries,
  mergeSetMemberLifts,
} from './aito-client'

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
 * `_aggregate` takes either form:
 *
 *   ARRAY    ["purchase.$sum", "purchase.$mean"]
 *            -> keys are the spec strings: `purchase.$sum`,
 *               `purchase.$sum.samples`, `purchase.$mean`, …
 *   ALIASED  {"sum": "purchase.$sum", "mean": "purchase.$mean"}
 *            -> keys are the names you chose: `sum`, `sum.samples`, `mean`, …
 *
 * The page reads `sum`, `sum.samples` and `mean`, so it was written against the
 * ALIASED form — but this query has sent the ARRAY form since the first commit
 * that added the page (f379435). The keys therefore never matched, all three
 * tiles fell through to their `|| 0` and Product Analytics has shown
 * 0 IMPRESSIONS / 0 PURCHASES / 0.0% CTR ever since, on every API version.
 *
 * Aliasing here rather than renaming in the client, because the names the page
 * wants are a property of the question it is asking. Both forms, and the alias
 * suffixes, behave identically on v1 and v2 — measured, not assumed.
 *
 * @param {string|number} id - The product ID to get statistics for
 * @returns {Promise<Object>} - {sum, sum.samples, mean, mean.variance, …}
 */
export function getProductStats(id){

  return aitoPostRaw('_aggregate', 
    {
      "from": "impressions",
      "where": {
        "product.id": id
      },
      "aggregate": {
        "sum": "purchase.$sum",
        "mean": "purchase.$mean"
      }
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
    // v2 cannot name a linked SET member on the relate side, so each tag is
    // asked from the other end instead. Empty on v1, which needs no such help.
    // These ride in the SAME batch, after the five the page reads positionally,
    // so recovering them costs no extra round trip and cannot shift an index.
    const memberQueries = setMemberLiftQueries(productProps)

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
      { // Which search phrases lead to this product being purchased, ranked
        // by purchases per phrase. Both versions compute this since 2.8.2;
        // only the select name of the ranking value differs — see
        // rankedCandidateSelect(), and aito-compat aliases it back to
        // `$score` so the page reads one field.
        "from": "impressions",
        "where": {
          "product.id": id
        },
        "get": "context.queryPhrase",
        "orderBy": { "$sum": {"$context": "purchase" } },
        "select": rankedCandidateSelect({ "$sum": {"$context": "purchase"} })
      },
      { // Time-series analysis of purchase patterns. Identical body on both
        // versions since 2.8.2 restored linked-`get` aggregates.
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
      },
      ...memberQueries.map(q => q.body)
    ])
      .then(response => {
        const all = response.data
        // The page reads results[0..4] positionally; the member queries are
        // everything after that.
        const results = Array.isArray(all) ? all.slice(0, 5) : all
        const memberResults = Array.isArray(all) ? all.slice(5) : []

        // Where v2 cannot ask the question, hand back an empty, explicitly
        // marked result rather than anything that could be read as an answer.
        if (!propertyRelate.supported && Array.isArray(results) && results[0]) {
          results[0] = { ...results[0], hits: [], unsupported: 'aito-core#1064' }
        }
        if (Array.isArray(results) && results[0]) {
          results[0] = mergeSetMemberLifts(results[0], memberQueries, memberResults)
        }
        return results
      })
  })
}
