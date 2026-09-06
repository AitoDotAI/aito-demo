import axios from 'axios'
import config from './config'
// `aito-compat` is CommonJS so that `scripts/v2-parity.js` can require it
// under plain Node. Webpack's ESM interop will not give it a default export,
// so it is pulled in with `require` rather than `import` — the app and the
// harness then run byte-identical normalisation code.
// eslint-disable-next-line
const { normalize } = require('./aito-compat')

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
 * `select` for a DEFAULT-model (KNN) `_estimate`.
 *
 * v1 returns a rich `why` whose `components[].value` are objects carrying
 * `instance`, `hitScore`, `original` and `adjustments` — which PricingPage's
 * extractNeighbors() renders as the neighbour table.
 *
 * v2 returns scalars there, so extractNeighbors' `component.value.instance`
 * guard already skipped every component and the table came out empty. As of
 * the 2026-08-31 build it is worse than useless: asking for `why` on a KNN
 * estimate over `price_history` on rep2 returns 502 Bad Gateway (an nginx
 * page, not the JSON error envelope) for every where-clause and every target
 * column, while `products` and `invoices` answer 200. Filed upstream.
 *
 * So `why` is requested only where it can be rendered. The regression-model
 * estimates keep asking for it on both versions — that path is not affected
 * and its `why` is what the explanation tooltip parses.
 */
export function knnWhySelect() {
  return isV2() ? [estimateSelect()] : [estimateSelect(), 'why']
}

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
