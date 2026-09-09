import axios from 'axios'
import config from './config'
import { normalize } from './aito-compat.mjs'

/**
 * Transport + v1/v2 compatibility layer for every Aito call in the app.
 *
 * The app was written against `/api/v1` (Rep1). `/api/v2` (Rep2) is
 * request-compatible for almost everything, but differs in ways that would
 * otherwise stay invisible until the UI renders blank — all of them return
 * HTTP 200. The response-side differences are handled in `./aito-compat`,
 * which the parity harness also uses so the two cannot drift.
 *
 * Request bodies are deliberately NOT rewritten here. Everything the app
 * sends is accepted by both versions: v1 accepts `select: ["$p", "$value"]`
 * and the array form `relate: ["field"]` exactly as v2 does, so the modules
 * send one body and it works on either. `_estimate`'s select field is the
 * sole exception — v1 calls it `estimate`, v2 calls it `value`, and each
 * rejects the other's name — so it is exposed as `estimateSelect()` below.
 *
 * Parity between the two paths is verified by `scripts/v2-parity.js`.
 */

/** True when the app is pointed at /api/v2. */
export const isV2 = () => config.aito.apiVersion === 'v2'

/**
 * `_estimate`'s result field is named `estimate` on v1 and `value` on v2.
 * Callers passing an explicit `select` must use this rather than hardcoding
 * either name.
 */
export const estimateSelect = () => (isV2() ? 'value' : 'estimate')

/**
 * Spread into a `_predict` body to score each member of a multi-valued field
 * independently, rather than treating the whole array as one exclusive class.
 *
 *   ...nonExclusivePredict('tags')
 *     v1 -> { predict: 'tags', exclusiveness: false }
 *     v2 -> { predict: 'tags.$feature' }
 *
 * v2 rejects `exclusiveness: false` outright:
 *
 *   "'exclusiveness: false' is deprecated and contradicts the exclusive
 *    target 'tags'. For non-exclusive per-member scoring, predict
 *    'tags.$feature' instead."
 *
 * and the two forms are not interchangeable in the other direction either —
 * on v1, `tags.$feature` returns materially different probabilities from
 * `exclusiveness: false`, so each version keeps the form that matches its own
 * semantics. Measured on `Pirkka banana`, v2's `tags.$feature` reproduces v1's
 * `exclusiveness: false` closely: same tags, same order, p 0.969/0.831/0.722
 * against 0.963/0.820/0.697.
 *
 * @param {string} field - the multi-valued field to predict, e.g. 'tags'
 */
export function nonExclusivePredict(field) {
  return isV2()
    ? { predict: `${field}.$feature` }
    : { predict: field, exclusiveness: false }
}

/**
 * The `_relate` arguments for "which of THIS product's property values are
 * over-represented in purchases, against the baseline of all impressions" —
 * the "CTR by Product Property" panel.
 *
 * v1 answers it with the nested proposition object, one row per property
 * value:  condition {purchase}, related {product.name: {$has: "banana"}}.
 *
 * v2 could not ask it at all until aito-core 2.8.1, which added the `$props`
 * carrier — `_ops` now lists it as "relate: one entity's property values,
 * related to the `where`" — and made v1's nested spelling an accepted alias
 * for it. So the same body works on both again.
 *
 * TWO DIFFERENCES REMAIN, both measured on 2.8.1:
 *
 *  1. Granularity. v1 tokenises Text and relates each token
 *     ({$has: "banana"}, lift 1.9106); v2 relates the whole value
 *     ("Pirkka banana", lift 2.0942). Fewer, coarser rows on v2.
 *
 *  2. Array-valued properties are rejected. `tags: ["fresh","fruit"]` — and
 *     equally `tags: "fruit"` or `{$has: "fruit"}` — fail with
 *     "relate $props: no rows carry { product.tags:fruit }", while the scalar
 *     properties in the same request answer fine. So array props are dropped
 *     on v2 and the panel loses its Tag rows there.
 *
 * @param {object} productProps - the product's own fields, minus `id`
 * @returns {{supported: boolean, relate?: object}}
 */
export function productPropertyRelate(productProps) {
  if (!isV2()) return { supported: true, relate: { product: productProps } }
  // Drop array-valued props; v2's $props carrier cannot match a set member.
  const scalars = Object.fromEntries(
    Object.entries(productProps).filter(([, v]) => !Array.isArray(v)),
  )
  return Object.keys(scalars).length
    ? { supported: true, relate: { product: scalars } }
    : { supported: false }
}

/**
 * Whether a per-candidate aggregate — `$f`, `{$sum: {$context: …}}`,
 * `{$mean: {$context: …}}` — can be trusted for a given `get` path.
 *
 * On v2 these compute correctly for a table's OWN fields and for a link
 * field itself, and collapse to ZERO when the candidate is reached THROUGH
 * a link. Measured on 2.8.1, v1 against v2:
 *
 *   impressions / purchase          own    2594  vs  2594   ok
 *   impressions / product           link   334   vs  334    ok
 *   contexts    / weekday           own    41    vs  41     ok
 *   impressions / context.week      thru   354   vs  0      wrong
 *   impressions / product.name      thru   1733  vs  0      wrong
 *   visits      / user.tags         thru   51    vs  0      wrong
 *
 * It is silent — 200 OK, every number zero — so a panel driven by one of
 * these charts a flat line that reads as a real measurement. The data is
 * present (334 purchase impressions for that product) and the candidates
 * enumerate correctly; only the aggregate is lost.
 *
 * v2 additionally refuses `$f`/`$sum` in `select` without an `orderBy`,
 * which `_ops` does not mention, and rejects `orderBy: {$sum: …}` outright
 * so candidates cannot be ranked BY an aggregate at all.
 *
 * @param {string} getPath - the `get` path, e.g. 'context.week'
 */
export const perCandidateAggregates = (getPath) =>
  !isV2() || String(getPath).split('.').length < 2

/**
 * POST an Aito query and return the normalised response payload directly
 * (not the axios response), because every caller wants the body.
 *
 * @param {string} endpoint - e.g. '_query', '_predict', '_estimate'
 * @param {object|Array} body - the query, passed through unchanged
 * @param {object} [axiosOptions] - merged into the axios config (e.g. timeout)
 * @returns {Promise<object>} normalised response payload
 */
export function aitoPost(endpoint, body, axiosOptions = {}) {
  return aitoPostRaw(endpoint, body, axiosOptions).then(res => res.data)
}

/**
 * Same as `aitoPost` but returns the axios response with its payload already
 * normalised, for the call sites that read `result.data`.
 */
export function aitoPostRaw(endpoint, body, axiosOptions = {}) {
  return axios.post(`${config.aito.apiBase}/${endpoint}`, body, {
    headers: { 'x-api-key': config.aito.apiKey },
    ...axiosOptions,
  }).then(res => {
    res.data = normalize(res.data, body)
    return res
  })
}

const aitoClient = { aitoPost, aitoPostRaw, isV2, estimateSelect }

export default aitoClient
