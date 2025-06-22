
/**
 * Application configuration
 * Uses environment variables for sensitive data
 */

// Default to demo instance if no environment variables are set
const DEFAULT_AITO_URL = "https://aito-grocery-store.aito.app"
const DEFAULT_AITO_API_KEY = "yg4rTlXkqDzm4y8gPeY75HCKaNwfbTQ2si64ONTi" // Demo key

// Get configuration from environment variables or use defaults
const aitoUrl = process.env.REACT_APP_AITO_URL || DEFAULT_AITO_URL
const aitoApiKey = process.env.REACT_APP_AITO_API_KEY || DEFAULT_AITO_API_KEY

// Validate configuration
if (!aitoUrl) {
  throw new Error('REACT_APP_AITO_URL is required')
}

if (!aitoApiKey) {
  throw new Error('REACT_APP_AITO_API_KEY is required')
}

// Environment configuration
const environment = process.env.REACT_APP_ENVIRONMENT || 'development'
const isDevelopment = environment === 'development'
const isProduction = environment === 'production'

// Optional services
const analyticsId = process.env.REACT_APP_ANALYTICS_ID
const sentryDsn = process.env.REACT_APP_SENTRY_DSN

const config = {
  aito: {
    url: aitoUrl,
    apiKey: aitoApiKey,
  },
  environment,
  isDevelopment,
  isProduction,
  analytics: {
    id: analyticsId,
  },
  sentry: {
    dsn: sentryDsn,
  },
}

module.exports = config
  