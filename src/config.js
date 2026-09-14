
/**
 * Application configuration
 * Uses environment variables for sensitive data
 */

// Default to public demo instance if no environment variables are set
const DEFAULT_AITO_URL = "https://shared.aito.ai/db/aito-demo"
const DEFAULT_AITO_API_KEY = "yg4rTlXkqDzm4y8gPeY75HCKaNwfbTQ2si64ONTi"

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

// Rep2 / API v2 toggle.
//
// v2 IS NOW THE DEFAULT. The app routes through:
//   <aitoUrl>/env/<envName>/api/v2/...
// and falls back to the Rep1 / v1 path:
//   <aitoUrl>/api/v1/...
// only when `REACT_APP_USE_REP2=false` is set explicitly.
//
// Both paths still work and both are covered by `npm run v2:parity`, so
// setting that one variable is a complete revert with no rebuild of the
// data. The v1 env (`master`) is left populated on purpose for exactly
// that reason — do not delete it.
//
// The env is named `v2` on shared.aito.ai, created and populated by
// `upload-data-v2.js` with the collection-typed `schema-rep2.json`.
// `REACT_APP_AITO_ENV` overrides the name; the default below must match
// the deployed env or the app points at an env that does not exist.
const useRep2 = process.env.REACT_APP_USE_REP2 !== 'false'
const aitoEnvName = process.env.REACT_APP_AITO_ENV || (useRep2 ? 'v2' : 'master')
const aitoApiVersion = useRep2 ? 'v2' : 'v1'

// `master` env paths use unprefixed `/api/...`; named envs use the
// `/env/<name>/api/...` shape per the server's EnvRouting.
const envPath = (aitoEnvName && aitoEnvName !== 'master')
  ? `/env/${aitoEnvName}`
  : ''

// Full base path for application API calls. All 13 API modules route
// through this, so a single env var flips every call between
// v1/Rep1/master and v2/Rep2/`v2`. Do not reintroduce a hardcoded
// `/api/v1/` path in a module — it silently opts that call out.
const apiBase = `${aitoUrl}${envPath}/api/${aitoApiVersion}`

// Environment configuration
const environment = process.env.REACT_APP_ENVIRONMENT || 'development'
const isDevelopment = environment === 'development'
const isProduction = environment === 'production'

// Optional services
const analyticsId = process.env.REACT_APP_ANALYTICS_ID
const sentryDsn = process.env.REACT_APP_SENTRY_DSN

// OpenAI/Azure configuration
const openaiConfig = {
  apiKey: process.env.REACT_APP_OPENAI_MODEL_API_KEY,
  baseURL: process.env.REACT_APP_OPENAI_MODEL_URL,
  apiVersion: process.env.REACT_APP_OPENAI_MODEL_API_VERSION,
  modelName: process.env.REACT_APP_OPENAI_MODEL_NAME,
  deployment: process.env.REACT_APP_OPENAI_MODEL_DEPLOYMENT
}

const config = {
  aito: {
    url: aitoUrl,
    apiKey: aitoApiKey,
    // New (rep2-aware) routing surface.
    apiBase,             // e.g. "https://.../api/v1" or "https://.../env/v2/api/v2"
    apiVersion: aitoApiVersion,  // 'v1' | 'v2'
    envName: aitoEnvName,        // 'master' | 'v2' | …
    useRep2,
  },
  openai: openaiConfig,
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
