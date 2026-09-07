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
 * Keep only the relations whose value actually belongs to `product`, so the
 * panel describes THIS product rather than the catalogue at large. `related`
 * has already been normalised to `{field: {$has: value}}` by aito-client.
 */
function narrowToProduct(hits, product) {
  if (!Array.isArray(hits)) return hits
  return hits.filter(hit => {
    const related = hit && hit.related
    if (!related) return false
    return Object.entries(related).some(([field, wrapped]) => {
      const value = wrapped && wrapped.$has
      const own = product[field.replace(/^product\./, '')]
      if (own === undefined || value === undefined) return false
      if (Array.isArray(own)) {
        return Array.isArray(value)
          ? value.some(v => own.includes(v))
          : own.includes(value)
      }
      // `product.name` relates on tokens, so match on containment there.
      if (typeof own === 'string' && typeof value === 'string') {
        return own.toLowerCase().includes(value.toLowerCase())
      }
      return own === value
    })
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
    const { relate, limit, narrow } = productPropertyRelate(productProps)

    return aitoPostRaw('_batch',
    [
      { // Which of THIS product's property values are over-represented in
        // purchases, against the baseline of all impressions? Feeds the
        // "CTR by Product Property" panel. The argument shape differs per API
        // version — see productPropertyRelate() for why.
        "from": "impressions",
        "where": {"purchase": true},
        "relate": relate,
        "select": ["lift", "related"],
        ...(limit ? { limit } : {})
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
        // Batch result 0 is the product-property relation. On v2 it is a
        // population-wide ranking and must be narrowed to this product; on v1
        // it already contains only this product's propositions, so narrowing
        // there would only risk dropping valid rows.
        if (narrow && Array.isArray(results) && results[0] && Array.isArray(results[0].hits)) {
          results[0] = { ...results[0], hits: narrowToProduct(results[0].hits, product) }
        }
        return results
      })
  })
}
