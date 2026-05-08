/**
 * Per-call Aito timing — global axios interceptor + window event bus.
 *
 * Visitors see a corner badge showing `_predict 28ms · _relate 142ms`
 * as queries fly. Same pattern shipped on aito-erp-demo
 * (frontend/components/shell/LatencyPill.tsx); applied here without
 * touching the dozens of `axios.post(`${config.aito.url}/...`)` call
 * sites by hooking the global axios request/response interceptors.
 *
 * The pill subscribes to `window` events of type AITO_CALLS_EVENT.
 * Each event carries one Aito call's endpoint name (e.g. "_predict")
 * and wall-time duration in ms.
 */

import axios from 'axios'

export const AITO_CALLS_EVENT = 'aito:calls'

/** Pull the bare endpoint name out of a request URL.
 *  e.g. "https://x.aito.app/api/v1/_predict" → "_predict". Anything
 *  outside the Aito API surface returns null so we don't fire events
 *  for OpenAI / analytics / etc. calls. */
function endpointFromUrl(url) {
  if (!url || typeof url !== 'string') return null
  const m = url.match(/\/api\/v1\/(_[a-z]+)/i)
  return m ? m[1] : null
}

let installed = false

/** Idempotent — calling install twice doesn't double-instrument
 *  (multiple module imports during dev hot-reload are common). */
export function installAitoTiming() {
  if (installed) return
  installed = true

  axios.interceptors.request.use((config) => {
    config.metadata = config.metadata || {}
    config.metadata.aitoStart = performance.now()
    return config
  }, (error) => Promise.reject(error))

  const broadcast = (config, status) => {
    const endpoint = endpointFromUrl(config?.url)
    if (!endpoint) return
    const start = config?.metadata?.aitoStart
    if (typeof start !== 'number') return
    const ms = performance.now() - start
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent(AITO_CALLS_EVENT, {
      detail: { endpoint, ms, status },
    }))
  }

  axios.interceptors.response.use(
    (response) => {
      broadcast(response.config, response.status)
      return response
    },
    (error) => {
      // Surface failures too — a slow failing call is still informative.
      broadcast(error.config, error.response?.status ?? 0)
      return Promise.reject(error)
    },
  )
}
