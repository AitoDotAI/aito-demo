/**
 * Regression test for the "CTR by Product Property" panel.
 *
 * A previous migration replaced v1's nested proposition form with the v2
 * array-of-fields form on BOTH versions. The array form ranks propositions
 * across the whole population and defaults to 10 hits, so the product being
 * viewed never appeared and the client-side narrowing filtered every row
 * away: the panel rendered SIX rows before and ZERO after, on the live path.
 * The parity harness could not catch it — it compares v1 against v2, not
 * before against after.
 *
 * Each case pins the version explicitly instead of relying on the ambient
 * default, which has itself changed once (v1 -> v2, 2026-09-09).
 */

// Real product from the demo dataset (id stripped, as the caller does).
const PRODUCT_PROPS = {
  category: '104',
  cost: 0.567,
  googleClicks: 12,
  googleImpressions: 100,
  name: 'Pirkka Finnish semi-skimmed milk 1l',
  price: 0.81,
  tags: ['lactose', 'drink', 'pirkka'],
}

const relateOn = (version) => {
  jest.resetModules()
  const saved = process.env
  process.env = { ...saved, REACT_APP_USE_REP2: version === 'v2' ? 'true' : 'false' }
  // eslint-disable-next-line global-require
  const { productPropertyRelate } = require('../../aito-client')
  const result = productPropertyRelate(PRODUCT_PROPS)
  process.env = saved
  return result
}

describe('productPropertyRelate on v1', () => {
  it('sends the nested proposition form, matching what v1 has always shown', () => {
    expect(relateOn('v1').relate).toEqual({ product: PRODUCT_PROPS })
  })

  it('reports the question as answerable', () => {
    expect(relateOn('v1').supported).toBe(true)
  })

  it('never sends a bare field array — that global ranking is what emptied the panel', () => {
    expect(Array.isArray(relateOn('v1').relate)).toBe(false)
  })
})

describe('productPropertyRelate: v1 keeps its own spelling', () => {
  it('v1 keeps the array properties in the nested form', () => {
    expect(relateOn('v1').relate.product.tags).toEqual(PRODUCT_PROPS.tags)
  })
})

/**
 * Tag rows of the same panel, on v2.
 *
 * Until aito-core 2.9.0 the app could not name a linked SET member on the
 * relate side at all, and recovered each tag with a separate swapped query
 * (tag in the `where`, the direct `purchase` column as the relate target).
 * 2.9.0 made `$props` relate each MEMBER of a list through a link, so that
 * workaround is gone and the tags ride in the one request again.
 *
 * Captured on 2.9.2 for Pirkka banana:
 *   {"$props": {"product.tags": ["fresh","fruit","pirkka"], …}}
 *     -> {"product.tags": {"$has": "fresh"}}  1.6473
 *        {"product.tags": {"$has": "fruit"}}  1.9720
 *        {"product.tags": {"$has": "pirkka"}} 1.0648
 */
describe('productPropertyRelate on v2', () => {
  it('sends every property, arrays included, through the dotted $props form', () => {
    const { relate } = relateOn('v2')
    expect(relate.$props['product.tags']).toEqual(['lactose', 'drink', 'pirkka'])
    expect(relate.$props['product.category']).toBe('104')
    expect(relate.$props['product.name']).toBe('Pirkka Finnish semi-skimmed milk 1l')
  })

  it('does NOT use the nested alias on v2 — it refuses an array-valued prop', () => {
    const { relate } = relateOn('v2')
    expect(relate.product).toBeUndefined()
    expect(Object.keys(relate)).toEqual(['$props'])
  })

  it('prefixes every field with the link path', () => {
    const { relate } = relateOn('v2')
    expect(Object.keys(relate.$props).every(k => k.startsWith('product.'))).toBe(true)
  })
})

/**
 * The three headline tiles on the product page.
 *
 * `_aggregate` accepts two forms, and they key the response differently:
 *
 *   ARRAY    ["purchase.$sum", "purchase.$mean"]
 *              -> purchase.$sum, purchase.$sum.samples, purchase.$mean, …
 *   ALIASED  {"sum": "purchase.$sum", "mean": "purchase.$mean"}
 *              -> sum, sum.samples, mean, mean.variance, …
 *
 * The page reads `sum`, `sum.samples` and `mean`, so it was written against the
 * aliased form — but the query sent the array form from the first commit that
 * added the page. The keys never matched, every tile fell through to `|| 0`,
 * and Product Analytics showed 0 / 0 / 0.0% on every API version until the
 * query was aliased.
 *
 * Both objects below are REAL captured responses for Pirkka banana
 * (2000818700008), byte-identical on v1 and v2 apart from float noise.
 */
const AGGREGATE_ALIASED = {
  sum: 334.0,
  'sum.samples': 2928,
  mean: 0.11407103825136612,
  'mean.samples': 2928,
  'mean.variance': 0.10105883648362149,
  'mean.standardDeviation': 0.3178975251297523,
  'mean.standardError': 0.005874915313993218,
}

const AGGREGATE_ARRAY_FORM = {
  'purchase.$sum': 334.0,
  'purchase.$sum.samples': 2928,
  'purchase.$mean': 0.11407103825136612,
}

// Exactly what ProductPage renders into the three MetricCards.
const tiles = stats => ({
  impressions: stats['sum.samples'] || 0,
  purchases: stats.sum || 0,
  ctr: `${(100 * (stats.mean || 0)).toFixed(1)}%`,
})

describe('product KPI tiles', () => {
  it('fills all three tiles from the aliased response', () => {
    expect(tiles(AGGREGATE_ALIASED)).toEqual({
      impressions: 2928,
      purchases: 334.0,
      ctr: '11.4%',
    })
  })

  it('pins the bug: the array form keys NONE of what the page reads', () => {
    expect(tiles(AGGREGATE_ARRAY_FORM)).toEqual({
      impressions: 0,
      purchases: 0,
      ctr: '0.0%',
    })
  })

  it('carries the alias suffixes too, not just the bare names', () => {
    expect(AGGREGATE_ALIASED['sum.samples']).toBe(2928)
    expect(AGGREGATE_ALIASED['mean.standardError']).toBeCloseTo(0.0058749, 6)
  })

  it('shows 0 rather than NaN when the response is empty', () => {
    expect(tiles({})).toEqual({ impressions: 0, purchases: 0, ctr: '0.0%' })
  })
})

describe('getProductStats request', () => {
  it('asks for the aliased object form, which is what keys the response', async () => {
    jest.resetModules()
    const sent = []
    jest.doMock('../../aito-client', () => ({
      aitoPostRaw: (endpoint, body) => {
        sent.push({ endpoint, body })
        return Promise.resolve({ data: AGGREGATE_ALIASED })
      },
      productPropertyRelate: () => ({ supported: false }),
      rankedCandidateSelect: () => [],
    }))
    // eslint-disable-next-line global-require
    const { getProductStats } = require('../../09-product')
    await getProductStats('2000818700008')
    jest.dontMock('../../aito-client')

    expect(sent[0].endpoint).toBe('_aggregate')
    expect(sent[0].body.aggregate).toEqual({
      sum: 'purchase.$sum',
      mean: 'purchase.$mean',
    })
    expect(Array.isArray(sent[0].body.aggregate)).toBe(false)
  })
})
