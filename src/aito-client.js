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
 *  2. A SET property cannot be named here at all. `tags: ["fresh","fruit"]` —
 *     and equally `tags: "fruit"` or `{$has: "fruit"}` — fail with
 *     "relate $props: no rows carry { product.tags:fruit }" even though 602
 *     rows plainly carry it, while the scalar properties in the same request
 *     answer fine. It is specifically SET THROUGH A LINK: `$props` on a direct
 *     Set column works. Filed as td-20260909113225686871.
 *
 *     So array props are dropped from THIS request. They are asked separately
 *     and equivalently — see setMemberLiftQueries below — rather than lost.
 *
 * @param {object} productProps - the product's own fields, minus `id`
 * @returns {{supported: boolean, relate?: object}}
 */
export function productPropertyRelate(productProps) {
  if (!isV2()) return { supported: true, relate: { product: productProps } }
  // Drop array-valued props; v2's $props carrier cannot match a set member
  // through a link. setMemberLiftQueries() recovers them.
  const scalars = Object.fromEntries(
    Object.entries(productProps).filter(([, v]) => !Array.isArray(v)),
  )
  return Object.keys(scalars).length
    ? { supported: true, relate: { product: scalars } }
    : { supported: false }
}

/**
 * Recover the Tag rows of the "CTR by Product Property" panel on v2.
 *
 * v2 cannot put a linked SET member on the `relate` side (see above), but it
 * can put one in the `where`. Lift is symmetric, so the same association can be
 * asked from the other end:
 *
 *   v1 / v2 native   where {purchase: true}
 *                    relate {$props: {product.tags: "fruit"}}      <- v2: 400
 *
 *   v2 swapped       where {product.tags: {$has: "fruit"}}
 *                    relate {$props: {purchase: true}}             <- direct, works
 *
 * THIS IS NOT A RE-DERIVATION AND NOT AN APPROXIMATION. It is the same question
 * put the other way round, and the engine confirms it returns the same number.
 * Measured on 2.8.4 with `category` — the one proposition BOTH forms support,
 * so the two can be compared directly:
 *
 *   v2 native   where {purchase:true}, relate {$props:{product.category:"100"}}
 *                 -> lift 1.6473
 *   v2 swapped  where {product.category:"100"}, relate {$props:{purchase:true}}
 *                 -> lift 1.6473        (exactly, not approximately)
 *
 * And the recovered tag rows land where v1 puts them: v1 reports `fresh` and
 * `category:100` at the same lift (1.6317 each); v2 reports swapped `fresh`
 * at 1.6473 and native `category:100` at 1.6473. The engines differ from each
 * other by the usual drift; the two FORMULATIONS do not differ at all.
 *
 * Returns [] on v1, which needs none of this — it relates set members directly.
 *
 * @param {object} productProps - the product's own fields, minus `id`
 * @param {string} [entity='product'] - the link path prefix from the `from` table
 * @returns {Array<{field: string, member: *, body: object}>}
 */
export function setMemberLiftQueries(productProps, entity = 'product') {
  if (!isV2()) return []
  return Object.entries(productProps).flatMap(([field, value]) => (
    Array.isArray(value)
      ? value.map(member => ({
        field: `${entity}.${field}`,
        member,
        body: {
          from: 'impressions',
          where: { [`${entity}.${field}`]: { $has: member } },
          relate: { $props: { purchase: true } },
          select: ['lift', 'related'],
          limit: 1,
        },
      }))
      : []
  ))
}

/**
 * Fold the per-member results from `setMemberLiftQueries` back into the
 * property-relate result, shaped exactly as v1 would have returned them, so the
 * page reads one list and needs no version branch.
 *
 * Rows whose query failed or returned nothing are dropped rather than shown as
 * zero — an absent row is honest, a 0.0x row is a claim.
 *
 * @param {object} relateResult - the `$props` relate result (hits[])
 * @param {Array} queries - what setMemberLiftQueries returned
 * @param {Array} responses - the batch entries for those queries, in order
 */
export function mergeSetMemberLifts(relateResult, queries, responses) {
  if (!queries.length) return relateResult
  const recovered = queries.map((q, i) => {
    const hit = responses[i] && responses[i].hits && responses[i].hits[0]
    if (!hit || typeof hit.lift !== 'number') return null
    return { lift: hit.lift, related: { [q.field]: { $has: q.member } } }
  }).filter(Boolean)

  const hits = (relateResult && relateResult.hits ? relateResult.hits : []).concat(recovered)
  // v1 returns these strongest-first; v2's own rows come back unordered, so
  // sorting here makes the panel read the same on both.
  hits.sort((a, b) => (b.lift || 0) - (a.lift || 0))
  return { ...relateResult, hits }
}

/**
 * `select` for a `get` candidate query ranked by a per-candidate aggregate.
 *
 * v1 exposes the ranking value as `$score` ("select: the orderBy value").
 * v2 rejects `$score` in select on this query shape, so the aggregate is
 * selected by name instead and aliased back to `$score` by the caller, which
 * keeps the page reading one field.
 *
 * Everything else about this query converged in aito-core 2.8.2: linked-`get`
 * aggregates return real values again (they were zero through 2.8.1), the
 * undocumented "`$f`/`$sum` in select need an orderBy" constraint is gone, and
 * `orderBy: {$sum: {$context: …}}` is accepted. Measured on 2.8.2, both
 * versions now return banana=77, fruit=37, pirkka=35, vegetable=32.
 *
 * @param {object} aggregate - e.g. { $sum: { $context: 'purchase' } }
 */
export function rankedCandidateSelect(aggregate) {
  return isV2() ? ['$value', aggregate] : ['$score', '$value']
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
