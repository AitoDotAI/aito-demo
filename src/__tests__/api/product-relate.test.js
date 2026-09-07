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
