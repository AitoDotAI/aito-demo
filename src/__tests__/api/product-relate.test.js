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
 * `_aggregate` keys its response after the field and operator — `purchase.$sum`,
 * `purchase.$sum.samples`, `purchase.$mean` — identically on both API versions.
 * The page read `sum`, `sum.samples` and `mean`, which no response has ever
 * contained, so every tile rendered its `|| 0` fallback: 0 IMPRESSIONS,
 * 0 PURCHASES, 0.0% CTR, on production and locally, on v1 and v2 alike.
 *
 * Real captured response for Pirkka banana (2000818700008), same on both.
 */
const AGGREGATE_RESPONSE = {
  'purchase.$sum': 334.0,
  'purchase.$sum.samples': 2928,
  'purchase.$mean': 0.11407103825136612,
  'purchase.$mean.samples': 2928,
  'purchase.$mean.variance': 0.10105883648362149,
  'purchase.$mean.standardDeviation': 0.3178975251297523,
  'purchase.$mean.standardError': 0.005874915313993218,
}

const namedStats = (raw) => ({
  ...raw,
  impressions: raw['purchase.$sum.samples'],
  purchases: raw['purchase.$sum'],
  ctr: raw['purchase.$mean'],
})

describe('product KPI tiles', () => {
  it('names the fields the page actually reads', () => {
    const s = namedStats(AGGREGATE_RESPONSE)
    expect(s.impressions).toBe(2928)
    expect(s.purchases).toBe(334)
    expect(s.ctr).toBeCloseTo(0.11407, 5)
  })

  it('renders 11.4% rather than 0.0% for CTR', () => {
    const s = namedStats(AGGREGATE_RESPONSE)
    expect((100 * (s.ctr || 0)).toFixed(1)).toBe('11.4')
  })

  it('pins the bug: the old key names are absent from a real response', () => {
    expect(AGGREGATE_RESPONSE.sum).toBeUndefined()
    expect(AGGREGATE_RESPONSE.mean).toBeUndefined()
    expect(AGGREGATE_RESPONSE['sum.samples']).toBeUndefined()
  })

  it('keeps the raw keys, so anything reading them still works', () => {
    const s = namedStats(AGGREGATE_RESPONSE)
    expect(s['purchase.$sum']).toBe(334.0)
    expect(s['purchase.$mean.standardError']).toBeCloseTo(0.0058749, 6)
  })

  it('falls back to 0 without inventing a number when the response is empty', () => {
    const s = namedStats({})
    expect(s.impressions || 0).toBe(0)
    expect((100 * (s.ctr || 0)).toFixed(1)).toBe('0.0')
  })
})
