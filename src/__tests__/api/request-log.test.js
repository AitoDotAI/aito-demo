/**
 * The query panes must show the body that was actually sent.
 *
 * Each route's pane renders a hand-written `exampleQuery` from
 * constants/contextPanelContent.js, labelled "Example Query" but sitting in a
 * panel that otherwise describes what the page just did. They have drifted:
 * the store page's pane shows
 *
 *   { from: "impressions", where: { "context.user": "larry" },
 *     recommend: "product", goal: { purchase: true }, limit: 5 }
 *
 * while 01-recommend.js also sends a `select` and, once the basket is not
 * empty, a clause excluding everything already in it. A reader comparing the
 * pane with the result cannot account for the difference, and the pane is the
 * only part of the demo that claims to show the mechanism.
 *
 * So the transport records what it sends, and the pane prefers that over the
 * example. The example stays as the fallback for a page not yet exercised —
 * better than an empty box — but it is labelled differently so nobody mistakes
 * one for the other.
 */

import { recordRequest, getLastRequest, onRequest, clearRequestLog } from '../../aito-client'
import { paneQuery } from '../../app/components/paneQuery'

jest.mock('../../config', () => ({
  aito: {
    url: 'https://test.aito.app',
    apiKey: 'test-api-key',
    apiVersion: 'v2',
    apiBase: 'https://test.aito.app/api/v2',
    envName: 'test',
  },
}))

describe('request log', () => {
  beforeEach(() => clearRequestLog())

  it('remembers the last body per endpoint', () => {
    recordRequest('_recommend', { from: 'impressions', limit: 5 })
    recordRequest('_query', { from: 'products' })

    expect(getLastRequest('_recommend')).toEqual({ from: 'impressions', limit: 5 })
    expect(getLastRequest('_query')).toEqual({ from: 'products' })
  })

  it('keeps the most recent, not the first', () => {
    recordRequest('_predict', { from: 'visits', predict: 'a' })
    recordRequest('_predict', { from: 'visits', predict: 'b' })

    expect(getLastRequest('_predict').predict).toBe('b')
  })

  it('notifies subscribers so a pane can re-render', () => {
    const seen = []
    const stop = onRequest((endpoint) => seen.push(endpoint))

    recordRequest('_relate', { from: 'impressions' })
    stop()
    recordRequest('_match', { from: 'impressions' })

    expect(seen).toEqual(['_relate'])
  })

  it('survives a listener that throws', () => {
    onRequest(() => { throw new Error('a pane blew up') })

    // A broken subscriber must not take the request down with it: this runs
    // inside the transport, in front of every call the app makes.
    expect(() => recordRequest('_query', { from: 'products' })).not.toThrow()
    expect(getLastRequest('_query')).toEqual({ from: 'products' })
  })
})

describe('paneQuery', () => {
  beforeEach(() => clearRequestLog())

  const example = '{\n  "from": "impressions"\n}'

  it('prefers the body that was actually sent', () => {
    recordRequest('_recommend', { from: 'impressions', select: ['name'] })

    const pane = paneQuery(['_recommend', '_query'], example)

    expect(pane.live).toBe(true)
    expect(JSON.parse(pane.body)).toEqual({ from: 'impressions', select: ['name'] })
  })

  it('takes the first endpoint that has actually run', () => {
    recordRequest('_query', { from: 'products' })

    const pane = paneQuery(['_recommend', '_query'], example)

    expect(pane.live).toBe(true)
    expect(JSON.parse(pane.body).from).toBe('products')
  })

  it('falls back to the example before anything has run', () => {
    const pane = paneQuery(['_recommend'], example)

    expect(pane.live).toBe(false)
    expect(pane.body).toBe(example)
  })

  it('reports nothing to show when there is no example either', () => {
    expect(paneQuery(['_recommend'], undefined)).toBeNull()
  })
})
