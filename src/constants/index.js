/**
 * Application constants
 */

// User personas for demo
export const DEMO_USERS = {
  LARRY: 'larry',
  VERONICA: 'veronica', 
  ALICE: 'alice'
}

// UI Constants
export const UI = {
  SEARCH_DEBOUNCE_MS: 300,
  DEFAULT_RESULTS_LIMIT: 5,
  DEFAULT_RECOMMENDATIONS_COUNT: 3,
  MAX_CART_ITEMS: 50
}

// API Configuration
export const API = {
  CONFIDENCE_THRESHOLD: 0.5,
  MAX_RETRIES: 3,
  TIMEOUT_MS: 10000
}

// Error Messages
export const ERRORS = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  API_ERROR: 'Service temporarily unavailable. Please try again.',
  SEARCH_ERROR: 'Search failed. Please try again.',
  RECOMMENDATIONS_ERROR: 'Unable to load recommendations.',
  PREDICTION_ERROR: 'Prediction service unavailable.'
}