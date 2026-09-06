/**
 * v1 <-> v2 response normalisation, shared by the app and the parity harness.
 *
 * CommonJS on purpose: `src/aito-client.js` imports it as an ES module (CRA
 * handles the interop, same as `src/config.js`), and `scripts/v2-parity.js`
 * requires it directly under plain Node. Both therefore exercise the exact
 * same code, so the harness verifies the normalisation the app actually
 * performs rather than a second implementation that could drift from it.
 *
 * The direction is always v2 -> v1: the app was written against v1, so v2
 * responses are given back their v1 field names. Aliases are additive, never
 * destructive — the v2 names survive alongside them.
 */

const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v)

/**
 * v2 wraps the scalar-returning endpoints (`_aggregate`, `_estimate`,
 * `_evaluate`) in `{kind, data}`; v1 returns them bare. Both answer 200, so
 * this difference is invisible to a status-code check and shows up only as
 * `undefined` at the point of use.
 *
 * Detected structurally rather than by endpoint name, so an endpoint that
 * gains or loses the wrapper later needs no change here.
 */
function unwrapEnvelope(payload) {
  if (isObj(payload)
    && typeof payload.kind === 'string'
    && Object.prototype.hasOwnProperty.call(payload, 'data')
    && Object.keys(payload).length === 2) {
    return payload.data
  }
  return payload
}

/**
 * v1 always wraps a relation's value as `{$has: value}`. v2 wraps it for some
 * field types and returns it bare for others, so wrapping the bare ones keeps
 * the single accessor `related[field].$has` working on both — which is what
 * the pages already read.
 */
function normalizeRelated(related) {
  const out = {}
  let changed = false
  for (const [field, value] of Object.entries(related)) {
    if (isObj(value) && '$has' in value) {
      out[field] = value
    } else {
      out[field] = { $has: value }
      changed = true
    }
  }
  return changed ? out : related
}

/**
 * v1 puts the predicted field's name on every `_predict` / `_match` hit as
 * `field`; v2 omits it. Its value is definitionally the request's own
 * `predict` (or `match`) parameter, so it is restored from the request rather
 * than inferred from the response — nothing here is guessed.
 *
 * Returns undefined for requests that have no such parameter, in which case
 * no `field` is added.
 */
function predictedFieldOf(request) {
  if (!isObj(request)) return undefined
  const target = typeof request.predict === 'string'
    ? request.predict
    : (typeof request.match === 'string' ? request.match : undefined)
  if (target === undefined) return undefined
  // `tags.$feature` is v2's spelling for what v1 expressed as
  // `predict: 'tags', exclusiveness: false`. v1 reports `field: 'tags'`, so
  // the `.$feature` suffix is stripped to keep the logical field name.
  return target.replace(/\.\$feature$/, '')
}

/**
 * True when the request asks for per-member scoring of a multi-valued field.
 * v2 then returns each hit's `$value` as a single-element array, where v1's
 * `feature` is the bare member — so consumers doing string work on `feature`
 * would silently receive an array.
 */
function isFeatureTarget(request) {
  if (!isObj(request)) return false
  const target = typeof request.predict === 'string'
    ? request.predict
    : (typeof request.match === 'string' ? request.match : undefined)
  return typeof target === 'string' && target.endsWith('.$feature')
}

/**
 * Give a v2 payload back its v1 field names.
 *
 *   hits[].feature   <- hits[].$value   (v2 has no `feature`: selecting it
 *                                        fails with "no such field 'feature'")
 *   hits[].field     <- request.predict / request.match  (see above)
 *   estimate         <- value           (`_estimate`'s result field)
 *   related[f].$has  <- related[f]      (see normalizeRelated)
 *
 * @param {*} data - the (already unwrapped) response payload
 * @param {object|Array} [request] - the request body, used only to restore
 *   `field`. Omit it and `field` is simply not added.
 */
function addV1Aliases(data, request) {
  // `_batch` returns an array of results, one per request in the batch.
  if (Array.isArray(data)) {
    return data.map((entry, i) => addV1Aliases(
      entry,
      Array.isArray(request) ? request[i] : undefined,
    ))
  }
  if (!isObj(data)) return data

  let out = data
  const field = predictedFieldOf(request)
  const featureTarget = isFeatureTarget(request)

  if (Array.isArray(out.hits)) {
    out = {
      ...out,
      hits: out.hits.map(hit => {
        if (!isObj(hit)) return hit
        let h = hit
        if (!('feature' in h) && '$value' in h) {
          // For a `.$feature` target v2 wraps each member in a one-element
          // array; v1's `feature` is the bare member. Unwrap so consumers
          // doing string work on `feature` keep working.
          const value = (featureTarget && Array.isArray(h.$value) && h.$value.length === 1)
            ? h.$value[0]
            : h.$value
          h = { ...h, feature: value }
        }
        // `field` may be absent (v2 _predict) or present but spelled with the
        // v2 `.$feature` suffix (v2 _match, since aito-core#1063). v1 reports
        // the logical field name in both cases, so fill it when missing and
        // normalise it when the server supplies the v2 spelling.
        if (typeof h.field === 'string' && h.field.endsWith('.$feature')) {
          h = { ...h, field: h.field.replace(/\.\$feature$/, '') }
        } else if (field !== undefined && !('field' in h)) {
          h = { ...h, field }
        }
        if (isObj(h.related)) {
          const related = normalizeRelated(h.related)
          if (related !== h.related) h = { ...h, related }
        }
        return h
      }),
    }
  }

  if (!('estimate' in out) && 'value' in out) {
    out = { ...out, estimate: out.value }
  }

  return out
}

/**
 * Unwrap the v2 envelope and restore v1 field names, in that order.
 *
 * @param {*} payload - the raw response body
 * @param {object|Array} [request] - the request body that produced it
 */
function normalize(payload, request) {
  return addV1Aliases(unwrapEnvelope(payload), request)
}

// Exported via a named binding rather than an inline object literal: webpack
// reads `module.exports = <literal>` as a set of named exports with no
// default, which breaks `import compat from './aito-compat'`. `src/config.js`
// uses this same shape, and is the precedent being followed here.
const aitoCompat = {
  normalize, unwrapEnvelope, addV1Aliases, predictedFieldOf, isFeatureTarget, isObj,
}

module.exports = aitoCompat
