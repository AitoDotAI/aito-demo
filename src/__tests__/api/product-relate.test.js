/**
 * Regression test for the "CTR by Product Property" panel.
 *
 * A previous migration replaced v1's nested proposition form with the v2
 * array-of-fields form on BOTH versions. The array form ranks propositions
 * across the whole population and defaults to 10 hits, so the product being
 * viewed never appeared and the client-side narrowing filtered every row
 * away: the panel rendered SIX rows before and ZERO after, on the live v1
 * path. The parity harness could not catch it — it compares v1 against v2,
 * not before against after.
 */

import { productPropertyRelate } from '../../aito-client'

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

describe('productPropertyRelate on v1 (the deployed default)', () => {
  it('sends the nested proposition form, unchanged from what is deployed', () => {
    const { relate } = productPropertyRelate(PRODUCT_PROPS)
    expect(relate).toEqual({ product: PRODUCT_PROPS })
  })

  it('sets no limit, matching the deployed query', () => {
    expect(productPropertyRelate(PRODUCT_PROPS).limit).toBeUndefined()
  })

  it('reports the question as answerable on v1', () => {
    expect(productPropertyRelate(PRODUCT_PROPS).supported).toBe(true)
  })

  it('never sends a bare field array — that global ranking is what emptied the panel', () => {
    expect(Array.isArray(productPropertyRelate(PRODUCT_PROPS).relate)).toBe(false)
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
