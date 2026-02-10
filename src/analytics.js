/**
 * Analytics utility for tracking demo interactions via Segment
 * Uses the same Segment write key as other Aito properties for unified tracking
 */

const SEGMENT_WRITE_KEY = 'xSGtwFjgKl3m5ZMGaVB3SENT0oUHPwJq'

/**
 * Initialize Segment analytics
 * Called once when the app loads
 */
export function initAnalytics() {
  if (typeof window === 'undefined' || window.analytics) return

  // Segment analytics.js snippet
  const analytics = (window.analytics = window.analytics || [])
  if (!analytics.initialize) {
    if (analytics.invoked) {
      console.error('Segment snippet included twice.')
    } else {
      analytics.invoked = true
      analytics.methods = [
        'trackSubmit',
        'trackClick',
        'trackLink',
        'trackForm',
        'pageview',
        'identify',
        'reset',
        'group',
        'track',
        'ready',
        'alias',
        'debug',
        'page',
        'once',
        'off',
        'on',
        'addSourceMiddleware',
        'addIntegrationMiddleware',
        'setAnonymousId',
        'addDestinationMiddleware',
      ]
      analytics.factory = function (method) {
        return function () {
          const args = Array.prototype.slice.call(arguments)
          args.unshift(method)
          analytics.push(args)
          return analytics
        }
      }
      for (let i = 0; i < analytics.methods.length; i++) {
        const key = analytics.methods[i]
        analytics[key] = analytics.factory(key)
      }
      analytics.load = function (key, options) {
        const script = document.createElement('script')
        script.type = 'text/javascript'
        script.async = true
        script.src =
          'https://cdn.segment.com/analytics.js/v1/' + key + '/analytics.min.js'
        const first = document.getElementsByTagName('script')[0]
        first.parentNode.insertBefore(script, first)
        analytics._loadOptions = options
      }
      analytics._writeKey = SEGMENT_WRITE_KEY
      analytics.SNIPPET_VERSION = '4.15.3'
      analytics.load(SEGMENT_WRITE_KEY, {
        cookie: {
          domain: '.aito.ai',
          secure: true,
          sameSite: 'Lax',
        },
      })
    }
  }
}

/**
 * Track a page view
 * @param {string} pageName - Name of the page
 * @param {Object} properties - Additional properties
 */
export function trackPage(pageName, properties = {}) {
  if (typeof window !== 'undefined' && window.analytics) {
    window.analytics.page(pageName, {
      ...properties,
      surface: 'demo',
    })
  }
}

/**
 * Track a custom event
 * @param {string} event - Event name
 * @param {Object} properties - Event properties
 */
export function trackEvent(event, properties = {}) {
  if (typeof window !== 'undefined' && window.analytics) {
    window.analytics.track(event, {
      ...properties,
      surface: 'demo',
    })
  }
}

/**
 * Identify a user (demo persona)
 * @param {string} userId - User/persona ID
 * @param {Object} traits - User traits
 */
export function identifyUser(userId, traits = {}) {
  if (typeof window !== 'undefined' && window.analytics) {
    window.analytics.identify(userId, {
      ...traits,
      surface: 'demo',
    })
  }
}
