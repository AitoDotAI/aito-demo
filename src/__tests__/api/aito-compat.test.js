/**
 * Regression tests for the v1<->v2 response normalisation.
 *
 * Every fixture below is a real response shape captured from
 * shared.aito.ai by `scripts/v2-parity.js` (see docs/v2-parity.json), trimmed
 * to the fields under test. None of them is invented — the point of these
 * tests is that the app keeps reading v1 field names on either API version,
 * and a fabricated fixture could not demonstrate that.
 */

const {
  normalize,
  unwrapEnvelope,
  predictedFieldOf,
} = require('../../aito-compat')

describe('unwrapEnvelope', () => {
  it('unwraps the {kind, data} envelope v2 puts on scalar endpoints', () => {
    // Real shape from POST /env/v2/api/v2/_estimate
    const v2 = { kind: 'estimate', data: { value: 1.5646392649872496 } }
    expect(unwrapEnvelope(v2)).toEqual({ value: 1.5646392649872496 })
  })

  it('leaves a bare v1 payload alone', () => {
    const v1 = { estimate: 0.5653166966475579 }
    expect(unwrapEnvelope(v1)).toBe(v1)
  })

  it('does not mistake a hits payload for an envelope', () => {
    const q = { offset: 0, total: 42, hits: [{ name: 'Pirkka banana' }] }
    expect(unwrapEnvelope(q)).toBe(q)
  })

  it('leaves an object that merely has a `data` key alone', () => {
    const notAnEnvelope = { kind: 'x', data: 1, extra: true }
    expect(unwrapEnvelope(notAnEnvelope)).toBe(notAnEnvelope)
  })
})

describe('predictedFieldOf', () => {
  it('reads the predicted field from a _predict request', () => {
    expect(predictedFieldOf({ from: 'products', predict: 'category' })).toBe('category')
  })

  it('reads the matched field from a _match request, minus the .$feature suffix', () => {
    // v1 reports field: "user.tags" for exactly this request, so the logical
    // field name is what gets restored — not the v2 spelling.
    expect(predictedFieldOf({ from: 'visits', match: 'user.tags.$feature' }))
      .toBe('user.tags')
  })

  it('returns undefined when the request predicts nothing', () => {
    expect(predictedFieldOf({ from: 'products', limit: 1 })).toBeUndefined()
  })
})

describe('normalize: _predict hits', () => {
  // v1: {"$p":0.63,"field":"category","feature":"104"}
  // v2: {"$p":0.11,"$value":"100"}   — no `feature`, no `field`
  const request = { from: 'products', predict: 'category', limit: 2 }

  it('restores `feature` from $value and `field` from the request', () => {
    const v2 = { offset: 0, total: 11, hits: [{ $p: 0.113, $value: '100' }] }
    const out = normalize(v2, request)
    expect(out.hits[0].feature).toBe('100')
    expect(out.hits[0].field).toBe('category')
  })

  it('keeps the v2 names alongside the restored v1 ones', () => {
    const v2 = { offset: 0, total: 11, hits: [{ $p: 0.113, $value: '100' }] }
    const out = normalize(v2, request)
    expect(out.hits[0].$value).toBe('100')
    expect(out.hits[0].$p).toBe(0.113)
  })

  it('does not overwrite a v1 response that already has them', () => {
    const v1 = {
      offset: 0,
      total: 11,
      hits: [{ $p: 0.6304223622031753, field: 'category', feature: '104' }],
    }
    const out = normalize(v1, request)
    expect(out.hits[0].feature).toBe('104')
    expect(out.hits[0].field).toBe('category')
  })

  it('adds no `field` when the request did not predict one', () => {
    const v2 = { offset: 0, total: 1, hits: [{ $p: 0.5, $value: 'x' }] }
    const out = normalize(v2, { from: 'products', limit: 1 })
    expect('field' in out.hits[0]).toBe(false)
  })
})

describe('normalize: _estimate', () => {
  it('aliases v2 `value` to `estimate`, which PricingPage reads', () => {
    const v2 = { kind: 'estimate', data: { value: 1.5646392649872496 } }
    expect(normalize(v2).estimate).toBe(1.5646392649872496)
  })

  it('leaves a v1 estimate untouched', () => {
    const v1 = { estimate: 0.5653166966475579 }
    expect(normalize(v1).estimate).toBe(0.5653166966475579)
  })
})

describe('normalize: _relate related values', () => {
  it('wraps a bare v2 related value so `.$has` still resolves', () => {
    // v2 returns the value bare for some field types...
    const v2 = { offset: 0, total: 1, hits: [{ lift: 2.24, related: { 'product.category': '111' } }] }
    const out = normalize(v2)
    expect(out.hits[0].related['product.category']).toEqual({ $has: '111' })
  })

  it('leaves an already-wrapped value alone', () => {
    // ...and wrapped for others, exactly as v1 does.
    const v1 = {
      offset: 0,
      total: 1,
      hits: [{ lift: 2.605, related: { purchases: { $has: '6408430000128' } } }],
    }
    const out = normalize(v1)
    expect(out.hits[0].related.purchases).toEqual({ $has: '6408430000128' })
  })

  it('wraps an array value without flattening it', () => {
    const v2 = { offset: 0, total: 1, hits: [{ lift: 0.345, related: { 'product.tags': ['meat', 'food'] } }] }
    const out = normalize(v2)
    expect(out.hits[0].related['product.tags']).toEqual({ $has: ['meat', 'food'] })
  })
})

describe('normalize: _batch', () => {
  it('normalises each result against its own request in the batch', () => {
    const request = [
      { from: 'products', predict: 'category' },
      { from: 'visits', relate: ['user.tags'] },
    ]
    const response = [
      { offset: 0, total: 1, hits: [{ $p: 0.5, $value: '100' }] },
      { offset: 0, total: 1, hits: [{ lift: 1.2, related: { 'user.tags': ['male'] } }] },
    ]
    const out = normalize(response, request)
    expect(out[0].hits[0].field).toBe('category')
    expect(out[0].hits[0].feature).toBe('100')
    expect(out[1].hits[0].related['user.tags']).toEqual({ $has: ['male'] })
    // The relate result must not pick up a `field` from the sibling request.
    expect('field' in out[1].hits[0]).toBe(false)
  })
})

describe('normalize: safety', () => {
  it('does not mutate its input', () => {
    const v2 = { offset: 0, total: 1, hits: [{ $p: 0.5, $value: '100' }] }
    const before = JSON.stringify(v2)
    normalize(v2, { from: 'products', predict: 'category' })
    expect(JSON.stringify(v2)).toBe(before)
  })

  it('passes through null and primitives untouched', () => {
    expect(normalize(null)).toBeNull()
    expect(normalize(7)).toBe(7)
  })
})

describe('normalize: .$feature targets', () => {
  // v2's spelling for v1's `predict: 'tags', exclusiveness: false`.
  const request = { from: 'prompts', predict: 'tags.$feature', limit: 3 }

  it('unwraps the single-element array v2 returns per member', () => {
    // Real v2 shape; v1 gives feature: 'customer support' (a bare string).
    const v2 = {
      offset: 0,
      total: 14,
      hits: [{ $p: 0.9871446778010176, $value: ['customer support'] }],
    }
    expect(normalize(v2, request).hits[0].feature).toBe('customer support')
  })

  it('reports the logical field name, not the .$feature spelling', () => {
    const v2 = { offset: 0, total: 14, hits: [{ $p: 0.98, $value: ['app'] }] }
    expect(normalize(v2, request).hits[0].field).toBe('tags')
  })

  it('leaves $value itself as v2 returned it', () => {
    const v2 = { offset: 0, total: 14, hits: [{ $p: 0.98, $value: ['app'] }] }
    expect(normalize(v2, request).hits[0].$value).toEqual(['app'])
  })

  it('does not unwrap a genuinely multi-valued result', () => {
    // Not a .$feature target, so the array is the answer, not a wrapper.
    const v2 = { offset: 0, total: 1, hits: [{ $p: 0.08, $value: ['gluten', 'bread'] }] }
    const out = normalize(v2, { from: 'products', predict: 'tags' })
    expect(out.hits[0].feature).toEqual(['gluten', 'bread'])
  })
})

describe('normalize: server-supplied `field` (aito-core#1063)', () => {
  // Since #1063, v2 _match returns `field` itself — but spelled with the v2
  // suffix, where v1 reports the logical name. Real shapes:
  //   v1 _match -> field: 'user.tags'
  //   v2 _match -> field: 'user.tags.$feature'
  it('normalises a server-supplied .$feature spelling to the v1 name', () => {
    const v2 = {
      offset: 0,
      total: 4,
      hits: [{ $p: 0.32, $value: 'male', feature: 'male', field: 'user.tags.$feature' }],
    }
    const out = normalize(v2, { from: 'visits', match: 'user.tags.$feature' })
    expect(out.hits[0].field).toBe('user.tags')
  })

  it('leaves a v1 field alone', () => {
    const v1 = { offset: 0, total: 4, hits: [{ $p: 0.32, feature: 'male', field: 'user.tags' }] }
    expect(normalize(v1, { from: 'visits', match: 'user.tags.$feature' }).hits[0].field)
      .toBe('user.tags')
  })
})
