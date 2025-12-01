import axios from 'axios'
import config from './config'

/**
 * Price Estimation API Functions
 *
 * This module provides functions to interact with Aito's _estimate endpoint
 * for price optimization and demand forecasting in grocery retail.
 *
 * Business Context:
 * - Helps store managers optimize pricing to maximize profit (margin × demand)
 * - Uses K-NN estimation to predict price-demand relationships
 * - Provides explainability through neighbor analysis
 *
 * Technical Details:
 * - Uses _estimate endpoint with why for explainability
 * - Works with price_history table containing historical sales data
 */

/**
 * Get list of products that have price history data
 *
 * @returns {Promise<Array>} Array of products with id, name, category
 */
export function getPriceProducts() {
  return axios.post(`${config.aito.url}/api/v1/_query`,
    {
      from: 'price_history',
      get: 'product_id',
      select: ['$value', '$f', 'name'],
      orderBy: 'name',
      limit: 100
    }, {
      headers: { 'x-api-key': config.aito.apiKey },
    })
    .then(response => {
      // Group by product_id to get unique products with their names
      const productsMap = new Map()
      response.data.hits.forEach(hit => {
        if (!productsMap.has(hit.$value)) {
          productsMap.set(hit.$value, {
            $value: hit.$value,
            $displayName: hit.name,
            $f: hit.$f || 1
          })
        }
      })
      return Array.from(productsMap.values())
    })
}

/**
 * Get distinct values for a specific field in price_history
 * Used to populate dropdown options for field selection
 *
 * @param {string} fieldName - The field to get distinct values for
 * @returns {Promise<Array>} Array of distinct values
 */
export function getPriceFieldValues(fieldName) {
  return axios.post(`${config.aito.url}/api/v1/_query`,
    {
      from: 'price_history',
      get: fieldName,
      select: ['$value', '$f'],
      limit: 100
    }, {
      headers: { 'x-api-key': config.aito.apiKey },
    })
    .then(response => {
      return response.data.hits
    })
}

/**
 * Get sample product context to populate fields
 * Returns a recent price_history record for the given product
 *
 * @param {string} productId - Product ID to get context for
 * @returns {Promise<Object>} Product context with all fields
 */
export function getProductPriceContext(productId) {
  return axios.post(`${config.aito.url}/api/v1/_query`,
    {
      from: 'price_history',
      where: { product_id: productId },
      orderBy: 'date',
      limit: 1
    }, {
      headers: { 'x-api-key': config.aito.apiKey },
    })
    .then(response => {
      return response.data.hits[0] || null
    })
}

/**
 * Estimate sale price given market conditions
 *
 * Uses K-NN estimation to predict optimal price based on:
 * - Product characteristics
 * - Temporal factors (day of week, holiday, etc.)
 * - Competitive context (competitor pricing)
 * - Environmental factors (weather, placement, etc.)
 *
 * Returns estimate with full explainability via why operator
 *
 * @param {Object} whereConditions - Conditions to estimate price for
 * @returns {Promise<Object>} Estimation result with neighbors
 */
export function estimatePrice(whereConditions) {
  return axios.post(`${config.aito.url}/api/v1/_estimate`,
    {
      from: 'price_history',
      where: whereConditions,
      estimate: 'sale_price',
      select: ['estimate', 'why']
    }, {
      headers: { 'x-api-key': config.aito.apiKey },
    })
    .then(response => {
      return response.data
    })
}

/**
 * Estimate demand (units_sold) given market conditions including price
 *
 * Uses K-NN estimation to predict sales volume based on:
 * - Sale price (key demand driver)
 * - Product characteristics
 * - Temporal and competitive factors
 *
 * Returns estimate with full explainability via why operator
 *
 * @param {Object} whereConditions - Conditions to estimate demand for (must include sale_price)
 * @returns {Promise<Object>} Estimation result with neighbors
 */
export function estimateDemand(whereConditions) {
  return axios.post(`${config.aito.url}/api/v1/_estimate`,
    {
      from: 'price_history',
      where: whereConditions,
      estimate: 'units_sold',
      select: ['estimate', 'why']
    }, {
      headers: { 'x-api-key': config.aito.apiKey },
    })
    .then(response => {
      return response.data
    })
}

/**
 * Estimate sale price using regression model for better explainability
 *
 * Uses simple regression model to predict price with clear field contributions.
 * Returns explanation in the form of: base + field_effect_1 + field_effect_2 + ...
 * Results are in log scale and need to be converted via: e^(base + effects)
 *
 * @param {Object} whereConditions - Conditions to estimate price for
 * @returns {Promise<Object>} Estimation result with regression explanation
 */
export function estimatePriceRegression(whereConditions) {
  return axios.post(`${config.aito.url}/api/v1/_estimate`,
    {
      from: 'price_history',
      where: whereConditions,
      estimate: 'sale_price',
      model: 'regression',
      select: ['estimate', 'why']
    }, {
      headers: { 'x-api-key': config.aito.apiKey },
    })
    .then(response => {
      return response.data
    })
}

/**
 * Estimate demand using regression model for better explainability
 *
 * Uses simple regression model to predict demand with clear field contributions.
 * Returns explanation in the form of: base + field_effect_1 + field_effect_2 + ...
 * Results are in log scale and need to be converted via: e^(base + effects)
 *
 * @param {Object} whereConditions - Conditions to estimate demand for (must include sale_price)
 * @returns {Promise<Object>} Estimation result with regression explanation
 */
export function estimateDemandRegression(whereConditions) {
  return axios.post(`${config.aito.url}/api/v1/_estimate`,
    {
      from: 'price_history',
      where: whereConditions,
      estimate: 'units_sold',
      model: 'regression',
      select: ['estimate', 'why']
    }, {
      headers: { 'x-api-key': config.aito.apiKey },
    })
    .then(response => {
      return response.data
    })
}

/**
 * Get historical price-demand data points for a product
 * Used for scatter plot visualization
 *
 * @param {string} productId - Product ID to get history for
 * @param {number} limit - Number of records to return (default 365)
 * @returns {Promise<Array>} Historical data points
 */
export function getPriceHistory(productId, limit = 365) {
  return axios.post(`${config.aito.url}/api/v1/_query`,
    {
      from: 'price_history',
      where: { product_id: productId },
      select: [
        'sale_price',
        'units_sold',
        'margin_percentage',
        'date',
        'purchase_cost',
        'day_of_week',
        'is_weekend',
        'promotional_placement'
      ],
      orderBy: 'date',
      limit: limit
    }, {
      headers: { 'x-api-key': config.aito.apiKey },
    })
    .then(response => {
      return response.data.hits
    })
}

/**
 * Get basic statistics for a product's pricing
 * Useful for showing baseline metrics
 *
 * @param {string} productId - Product ID to get stats for
 * @returns {Promise<Object>} Statistics including avg price, demand, etc.
 */
export function getPriceStats(productId) {
  return axios.post(`${config.aito.url}/api/v1/_aggregate`,
    {
      from: 'price_history',
      where: { product_id: productId },
      aggregate: [
        'sale_price.$mean',
        'sale_price.$min',
        'sale_price.$max',
        'units_sold.$mean',
        'units_sold.$min',
        'units_sold.$max',
        'margin_percentage.$mean'
      ]
    }, {
      headers: { 'x-api-key': config.aito.apiKey },
    })
    .then(response => {
      return response.data
    })
}
