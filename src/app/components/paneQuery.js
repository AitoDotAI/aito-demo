import { getLastRequest } from '../../aito-client'

/**
 * What the query pane should show for a route.
 *
 * Prefers the body the page actually sent, falling back to the hand-written
 * example in constants/contextPanelContent.js. The two are labelled
 * differently by the caller, because the difference matters: the examples had
 * drifted from the code — the store pane omitted the `select` and the
 * basket-exclusion clause that 01-recommend.js really sends — and a reader
 * comparing a pane against a result had no way to account for the gap.
 *
 * `endpoints` is the route's list in declaration order; the first one that has
 * actually run wins, so a page using `_recommend` then `_query` shows the
 * recommendation rather than the lookup that followed it.
 *
 * @param {string[]} endpoints  e.g. ['_recommend', '_query']
 * @param {string|undefined} example  the fallback, already formatted
 * @returns {{body: string, live: boolean, endpoint?: string}|null}
 */
export function paneQuery(endpoints, example) {
  for (const endpoint of endpoints || []) {
    const body = getLastRequest(endpoint)
    if (body !== undefined) {
      return { body: JSON.stringify(body, null, 2), live: true, endpoint }
    }
  }
  if (example) return { body: example, live: false }
  return null
}
