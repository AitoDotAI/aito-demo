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

describe('productPropertyRelate on v2 (since aito-core 2.8.1)', () => {
  // 2.8.1 added the `$props` carrier and made v1's nested spelling an alias
  // for it, so the question is answerable on v2 again — see aito-core#1064.
  it('sends the nested proposition form, the same shape as v1', () => {
    expect(relateOn('v2').supported).toBe(true)
    expect(relateOn('v2').relate.product).toBeDefined()
  })

  it('drops array-valued properties, which $props cannot match', () => {
    // `tags: [...]`, `tags: "fruit"` and `{$has: "fruit"}` all fail with
    // "relate $props: no rows carry { product.tags:fruit }", while the scalar
    // properties in the same request answer fine.
    const sent = relateOn('v2').relate.product
    expect(sent.tags).toBeUndefined()
    expect(sent.name).toBe(PRODUCT_PROPS.name)
    expect(sent.category).toBe(PRODUCT_PROPS.category)
  })

  it('v1 keeps the array properties', () => {
    expect(relateOn('v1').relate.product.tags).toEqual(PRODUCT_PROPS.tags)
  })
})
