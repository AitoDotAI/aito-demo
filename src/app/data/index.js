import { getRecommendedProducts as _getRecommendedProducts } from '../../01-recommend'
import { getAutoComplete as _getAutoComplete } from '../../02-autocomplete'
import { getProductSearchResults as _getProductSearchResults } from '../../03-search'
import { getTagSuggestions } from '../../04-get-tag-suggestions'
import { getAutoFill, getProductsByIds } from '../../05-autofill'
import { prompt as _prompt } from '../../06-prompt'
import { relate } from '../../07-relate'
import { predictInvoice as _predictInvoice } from '../../08-predict-invoice'
import { getProductDetails, getAllProducts, getProductStats, getProductAnalytics } from '../../09-product'
import { getDistinctValues } from '../../10-get-distinct-values'
import { evaluateModel } from '../../11-evaluate'
import {
  getPriceProducts,
  estimatePrice as _estimatePrice,
  estimateDemand,
  estimatePriceRegression,
  estimateDemandRegression,
  getPriceFieldValues,
  getProductPriceContext,
  getPriceHistory,
  getPriceStats
} from '../../12-price-estimation'
import { predictCategory, predictPrice, predictProductAttributes } from '../../13-product-predictions'
import { trackEvent } from '../../analytics'

// Wrapped functions with analytics tracking

async function getRecommendedProducts(userId, basket, count) {
  const startTime = performance.now()
  try {
    const result = await _getRecommendedProducts(userId, basket, count)
    trackEvent('demo_recommendations_fetched', {
      user_persona: userId,
      basket_size: basket?.length || 0,
      result_count: result?.length || 0,
      timing_ms: Math.round(performance.now() - startTime),
    })
    return result
  } catch (error) {
    trackEvent('demo_recommendations_fetched', {
      user_persona: userId,
      success: false,
      error: error.message,
    })
    throw error
  }
}

async function getProductSearchResults(userId, searchValue) {
  const startTime = performance.now()
  try {
    const result = await _getProductSearchResults(userId, searchValue)
    trackEvent('demo_search_executed', {
      user_persona: userId,
      query: searchValue,
      result_count: result?.length || 0,
      timing_ms: Math.round(performance.now() - startTime),
    })
    return result
  } catch (error) {
    trackEvent('demo_search_executed', {
      user_persona: userId,
      query: searchValue,
      success: false,
      error: error.message,
    })
    throw error
  }
}

async function getAutoComplete(userId, query) {
  const startTime = performance.now()
  try {
    const result = await _getAutoComplete(userId, query)
    trackEvent('demo_autocomplete_fetched', {
      user_persona: userId,
      query,
      result_count: result?.length || 0,
      timing_ms: Math.round(performance.now() - startTime),
    })
    return result
  } catch (error) {
    trackEvent('demo_autocomplete_fetched', {
      user_persona: userId,
      query,
      success: false,
      error: error.message,
    })
    throw error
  }
}

async function predictInvoice(input, output) {
  const startTime = performance.now()
  try {
    const result = await _predictInvoice(input, output)
    trackEvent('demo_invoice_predicted', {
      output_field: output,
      timing_ms: Math.round(performance.now() - startTime),
    })
    return result
  } catch (error) {
    trackEvent('demo_invoice_predicted', {
      output_field: output,
      success: false,
      error: error.message,
    })
    throw error
  }
}

async function prompt(question) {
  const startTime = performance.now()
  try {
    const result = await _prompt(question)
    trackEvent('demo_prompt_executed', {
      question_length: question?.length || 0,
      timing_ms: Math.round(performance.now() - startTime),
    })
    return result
  } catch (error) {
    trackEvent('demo_prompt_executed', {
      success: false,
      error: error.message,
    })
    throw error
  }
}

async function estimatePrice(where) {
  const startTime = performance.now()
  try {
    const result = await _estimatePrice(where)
    trackEvent('demo_price_estimated', {
      timing_ms: Math.round(performance.now() - startTime),
    })
    return result
  } catch (error) {
    trackEvent('demo_price_estimated', {
      success: false,
      error: error.message,
    })
    throw error
  }
}

export {
  getProductSearchResults,
  getRecommendedProducts,
  getTagSuggestions,
  getAutoComplete,
  getAutoFill,
  getProductsByIds,
  prompt,
  relate,
  predictInvoice,
  evaluateModel,
  getProductDetails,
  getAllProducts,
  getProductStats,
  getProductAnalytics,
  getDistinctValues,
  getPriceProducts,
  estimatePrice,
  estimateDemand,
  estimatePriceRegression,
  estimateDemandRegression,
  getPriceFieldValues,
  getProductPriceContext,
  getPriceHistory,
  getPriceStats,
  predictCategory,
  predictPrice,
  predictProductAttributes
}
