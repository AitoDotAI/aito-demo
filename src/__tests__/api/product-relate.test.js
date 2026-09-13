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

/**
 * The Tag rows of the same panel.
 *
 * v2 cannot name a linked SET member on the `relate` side, so `tags` is dropped
 * from the $props request and the panel lost its three Tag rows. Lift is
 * symmetric, so each member is asked from the other end instead: the tag goes
 * in the `where` (which works through a link) and `purchase` — a direct column
 * — becomes the relate target.
 *
 * The equivalence is not assumed. Measured on aito-core 2.8.4 with `category`,
 * the one proposition BOTH forms support:
 *   native   where {purchase:true},           relate {$props:{product.category:"100"}} -> 1.6473
 *   swapped  where {product.category:"100"},  relate {$props:{purchase:true}}          -> 1.6473
 */
const memberQueriesOn = (version) => {
  jest.resetModules()
  const saved = process.env
  process.env = { ...saved, REACT_APP_USE_REP2: version === 'v2' ? 'true' : 'false' }
  // eslint-disable-next-line global-require
  const { setMemberLiftQueries, mergeSetMemberLifts } = require('../../aito-client')
  const queries = setMemberLiftQueries(PRODUCT_PROPS)
  process.env = saved
  return { queries, mergeSetMemberLifts }
}

describe('setMemberLiftQueries on v1', () => {
  it('asks for nothing — v1 relates set members directly', () => {
    expect(memberQueriesOn('v1').queries).toEqual([])
  })

  it('leaves the relate result untouched, so the v1 batch is byte-identical', () => {
    const { queries, mergeSetMemberLifts } = memberQueriesOn('v1')
    const relateResult = { hits: [{ lift: 1.9106, related: { 'product.name': { $has: 'banana' } } }] }
    expect(mergeSetMemberLifts(relateResult, queries, [])).toBe(relateResult)
  })
})

describe('setMemberLiftQueries on v2', () => {
  it('asks one query per set member, and none for scalars', () => {
    const { queries } = memberQueriesOn('v2')
    expect(queries.map(q => q.member)).toEqual(['lactose', 'drink', 'pirkka'])
    expect(queries.every(q => q.field === 'product.tags')).toBe(true)
  })

  it('puts the member in the where and relates the DIRECT purchase column', () => {
    const { queries } = memberQueriesOn('v2')
    expect(queries[0].body).toEqual({
      from: 'impressions',
      where: { 'product.tags': { $has: 'lactose' } },
      relate: { $props: { purchase: true } },
      select: ['lift', 'related'],
      limit: 1,
    })
  })

  it('never sends the form v2 rejects — no set member on the relate side', () => {
    const { queries } = memberQueriesOn('v2')
    const relateSides = JSON.stringify(queries.map(q => q.body.relate))
    expect(relateSides).not.toContain('product.tags')
  })
})

describe('mergeSetMemberLifts', () => {
  const { queries, mergeSetMemberLifts } = memberQueriesOn('v2')
  const relateResult = {
    hits: [
      { lift: 1.6473, related: { 'product.category': '104' } },
      { lift: 2.0942, related: { 'product.name': 'Pirkka Finnish semi-skimmed milk 1l' } },
    ],
  }
  const responses = [
    { hits: [{ lift: 1.11, related: { purchase: true } }] },
    { hits: [{ lift: 2.5, related: { purchase: true } }] },
    { hits: [{ lift: 0.9, related: { purchase: true } }] },
  ]

  it('reshapes each member row the way v1 reports it, so the page needs no branch', () => {
    const out = mergeSetMemberLifts(relateResult, queries, responses)
    expect(out.hits).toContainEqual({ lift: 2.5, related: { 'product.tags': { $has: 'drink' } } })
  })

  it('returns every row strongest-first, as v1 does', () => {
    const out = mergeSetMemberLifts(relateResult, queries, responses)
    expect(out.hits.map(h => h.lift)).toEqual([2.5, 2.0942, 1.6473, 1.11, 0.9])
  })

  it('drops a member whose query failed rather than reporting it as zero', () => {
    const out = mergeSetMemberLifts(relateResult, queries, [
      responses[0],
      { error: 'boom' },
      { hits: [] },
    ])
    const tags = out.hits.filter(h => h.related['product.tags']).map(h => h.related['product.tags'].$has)
    expect(tags).toEqual(['lactose'])
  })
})
