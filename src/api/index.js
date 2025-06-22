/**
 * Centralized API exports for Aito.ai integrations
 * Provides a single entry point for all ML-powered features
 */

// Search and Discovery
export { getProductSearchResults } from './search'

// Recommendations  
export { getRecommendedProducts } from './recommendations'

// Predictions and Classifications
export { getTagSuggestions, predictInvoice } from './predictions'

// Import remaining API functions from existing modules
export { getAutoComplete } from '../04-autocomplete'
export { getProductsByIds, getAutoFill } from '../05-autofill'
export { prompt } from '../06-prompt'
export { relate } from '../07-relate'
export { getProductDetails, getAllProducts, getProductStats, getProductAnalytics } from '../09-product'

/**
 * API Status and Health Checks
 */
import config from '../config'
import axios from 'axios'

/**
 * Check if Aito API is accessible
 * @returns {Promise<boolean>} API health status
 */
export const checkApiHealth = async () => {
  try {
    const response = await axios.get(`${config.aito.url}/api/v1/health`, {
      headers: { 'x-api-key': config.aito.apiKey },
      timeout: 5000
    })
    return response.status === 200
  } catch (error) {
    console.error('API health check failed:', error)
    return false
  }
}

/**
 * Get API usage statistics
 * @returns {Promise<Object>} Usage stats if available
 */
export const getApiUsageStats = async () => {
  try {
    const response = await axios.get(`${config.aito.url}/api/v1/usage`, {
      headers: { 'x-api-key': config.aito.apiKey }
    })
    return response.data
  } catch (error) {
    console.warn('Could not fetch usage stats:', error)
    return null
  }
}

/**
 * Common API error types for better error handling
 */
export const API_ERRORS = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR', 
  RATE_LIMIT: 'RATE_LIMIT',
  INVALID_REQUEST: 'INVALID_REQUEST',
  SERVER_ERROR: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT'
}

/**
 * Enhanced error handler for Aito API responses
 * @param {Error} error - Axios error object
 * @returns {Object} Structured error information
 */
export const handleApiError = (error) => {
  if (!error.response) {
    // Network error
    return {
      type: API_ERRORS.NETWORK_ERROR,
      message: 'Network connection failed. Please check your internet connection.',
      retryable: true,
      statusCode: null
    }
  }

  const { status, data } = error.response

  switch (status) {
    case 401:
    case 403:
      return {
        type: API_ERRORS.AUTH_ERROR,
        message: 'Authentication failed. Please check your API key.',
        retryable: false,
        statusCode: status
      }
    
    case 429:
      return {
        type: API_ERRORS.RATE_LIMIT,
        message: 'Rate limit exceeded. Please try again later.',
        retryable: true,
        retryAfter: error.response.headers['retry-after'],
        statusCode: status
      }
    
    case 400:
      return {
        type: API_ERRORS.INVALID_REQUEST,
        message: data?.message || 'Invalid request parameters.',
        retryable: false,
        statusCode: status,
        details: data
      }
    
    case 408:
    case 504:
      return {
        type: API_ERRORS.TIMEOUT,
        message: 'Request timed out. Please try again.',
        retryable: true,
        statusCode: status
      }
    
    case 500:
    case 502:
    case 503:
      return {
        type: API_ERRORS.SERVER_ERROR,
        message: 'Server error. Please try again later.',
        retryable: true,
        statusCode: status
      }
    
    default:
      return {
        type: API_ERRORS.SERVER_ERROR,
        message: `Unexpected error (${status}). Please try again.`,
        retryable: status >= 500,
        statusCode: status,
        details: data
      }
  }
}

/**
 * Retry wrapper for API calls with exponential backoff
 * @param {Function} apiCall - The API function to call
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in ms for exponential backoff
 * @returns {Promise} API response or throws error
 */
export const withRetry = async (apiCall, maxRetries = 3, baseDelay = 1000) => {
  let lastError
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall()
    } catch (error) {
      lastError = error
      const errorInfo = handleApiError(error)
      
      // Don't retry non-retryable errors
      if (!errorInfo.retryable || attempt === maxRetries) {
        throw errorInfo
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      console.warn(`API call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`)
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw handleApiError(lastError)
}

/**
 * Rate limiter to prevent overwhelming the API
 */
class RateLimiter {
  constructor(maxCalls = 100, windowMs = 60000) {
    this.maxCalls = maxCalls
    this.windowMs = windowMs
    this.calls = []
  }
  
  async wait() {
    const now = Date.now()
    
    // Remove old calls outside the window
    this.calls = this.calls.filter(call => now - call < this.windowMs)
    
    if (this.calls.length >= this.maxCalls) {
      const oldestCall = Math.min(...this.calls)
      const waitTime = this.windowMs - (now - oldestCall)
      
      if (waitTime > 0) {
        console.warn(`Rate limit reached, waiting ${waitTime}ms...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        return this.wait() // Recursive call after waiting
      }
    }
    
    this.calls.push(now)
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter()

/**
 * Rate-limited API call wrapper
 * @param {Function} apiCall - The API function to call
 * @returns {Promise} API response
 */
export const withRateLimit = async (apiCall) => {
  await rateLimiter.wait()
  return apiCall()
}

/**
 * Complete API wrapper with error handling, retries, and rate limiting
 * @param {Function} apiCall - The API function to call
 * @param {Object} options - Configuration options
 * @returns {Promise} API response or structured error
 */
export const apiWrapper = async (apiCall, options = {}) => {
  const {
    retries = 3,
    rateLimit = true,
    throwOnError = true
  } = options
  
  try {
    const wrappedCall = rateLimit 
      ? () => withRateLimit(apiCall)
      : apiCall
    
    return await withRetry(wrappedCall, retries)
  } catch (error) {
    if (throwOnError) {
      throw error
    }
    return { error }
  }
}