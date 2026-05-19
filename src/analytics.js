/**
 * Amplitude + GA4 analytics for the Aito grocery-store demo.
 *
 * SURFACE identifies which Aito surface emitted the event so the
 * shared Amplitude workspace can slice cross-surface funnels
 * (landing → demo → console).
 *
 * API key and GA4 measurement ID are provisioned at build time via
 * aito-demo-server's `env_secrets` (sourced from Azure Key Vault);
 * they reach this bundle as `REACT_APP_*` env vars baked in by
 * `react-scripts build`. Never read or commit literals here.
 */

import * as amplitude from '@amplitude/analytics-browser'

const SURFACE = 'demo'

let initialized = false

function isProductionHost() {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host !== 'localhost' && host !== '127.0.0.1' && !host.endsWith('.local')
}

function isBotUserAgent() {
  if (typeof navigator === 'undefined') return false
  return /bot|crawler|spider|crawling|preview|headless/i.test(navigator.userAgent)
}

function gtagSafe(...args) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args)
  }
}

function loadGtag(measurementId) {
  if (typeof window === 'undefined') return
  if (typeof window.gtag === 'function') return

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  window.gtag = function () {
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', measurementId, {
    anonymize_ip: true,
    cookie_expires: 0,
  })
}

/** Initialize Amplitude (and GA4). Idempotent — safe to call from
 *  multiple components or React strict-mode double effects. */
export function initAnalytics() {
  if (initialized) return
  if (typeof window === 'undefined') return
  if (!isProductionHost()) return
  if (isBotUserAgent()) return

  const amplitudeKey = process.env.REACT_APP_AMPLITUDE_KEY
  const ga4Id = process.env.REACT_APP_GA4_MEASUREMENT_ID

  if (amplitudeKey) {
    amplitude.init(amplitudeKey, {
      serverZone: 'EU',
      cookieOptions: { domain: '.aito.ai' },
      defaultTracking: {
        // Disabled — `trackPage()` is the source of truth for page views
        // (history listener in App.js fires it on URL change, and
        // defaultTracking would produce a second event under a different
        // name `[Amplitude] Page Viewed`).
        pageViews: false,
        sessions: true,
        formInteractions: false,
        fileDownloads: false,
      },
    })
  } else {
    console.warn('[analytics] REACT_APP_AMPLITUDE_KEY not set; Amplitude disabled.')
  }

  if (ga4Id) {
    loadGtag(ga4Id)
  } else {
    console.warn('[analytics] REACT_APP_GA4_MEASUREMENT_ID not set; GA4 disabled.')
  }

  initialized = true
}

export function trackPage(pageName, properties = {}) {
  if (typeof window === 'undefined') return
  const withSurface = { ...properties, surface: SURFACE }
  amplitude.track(`Page View: ${pageName}`, withSurface)
  gtagSafe('event', 'page_view', { page_title: pageName, ...withSurface })
}

export function trackEvent(event, properties = {}) {
  if (typeof window === 'undefined') return
  const withSurface = { ...properties, surface: SURFACE }
  amplitude.track(event, withSurface)
  gtagSafe('event', event, withSurface)
}

export function identifyUser(userId, traits = {}) {
  if (!userId) return
  if (typeof window === 'undefined') return
  amplitude.setUserId(userId)
  const id = new amplitude.Identify()
  Object.entries(traits).forEach(([k, v]) => id.set(k, v))
  amplitude.identify(id)
  gtagSafe('set', { user_id: userId, ...traits })
}
