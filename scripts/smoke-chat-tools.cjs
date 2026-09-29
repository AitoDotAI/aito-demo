#!/usr/bin/env node
/**
 * Live smoke of the customer chat's server-side tools, against the public demo
 * database with its public read-only key (the tool's defaults).
 *
 * Why it exists: search_products failed on EVERY call from 2025-12-18 (a schema
 * change made `tags` an array, and the tool's copy of the query was not updated)
 * until 2026-09-29, and nothing noticed. The chat answered "unable to generate a
 * response" for nine months. A check that can fail has to exist: this runs every
 * tool the model can call and exits non-zero if any fails or returns nothing.
 * Nothing here writes: the cart tools only describe an operation for the frontend.
 *
 *     node scripts/smoke-chat-tools.cjs
 */
const { executeCustomerTool } = require('../shared/tools/customerTools.cjs')

const USER = 'larry'
const checks = [
  ['search_products', { query: 'banana' }, r => r.products.length > 0 || 'no products for "banana"'],
  ['get_recommendations', {}, r => r.products.length > 0 || 'no recommendations'],
  ['get_search_suggestions', { prefix: 'b' }, r =>
    (r.suggestions.length > 0 && r.suggestions.every(s => s.trim() !== '')) || `bad suggestions: ${JSON.stringify(r.suggestions)}`],
  ['get_smart_cart_predictions', {}, r => r.products.length > 0 || 'no smart-cart predictions'],
  ['analyze_customer_message', { message: 'my order arrived damaged' }, () => true],
  ['get_general_help', { topic: 'delivery' }, r => Boolean(r.message) || 'no help text'],
  ['add_to_cart', { productNames: ['banana'] }, () => true],
  ['remove_from_cart', { productNames: ['banana'] }, () => true],
]

;(async () => {
  const log = console.log
  console.log = () => {}; console.warn = () => {}; console.error = () => {}   // the tools are chatty
  let failed = 0
  for (const [name, args, check] of checks) {
    let verdict
    try {
      const result = await executeCustomerTool(name, args, USER, [])
      verdict = result && result.success !== false ? check(result) : `success:false: ${result && result.message}`
    } catch (err) {
      verdict = `threw: ${err.message}`
    }
    if (verdict === true) {
      log(`ok    ${name}`)
    } else {
      failed += 1
      log(`FAIL  ${name}: ${verdict}`)
    }
  }
  log(failed ? `\n${failed} of ${checks.length} chat tools failed` : `\nall ${checks.length} chat tools answered`)
  process.exit(failed ? 1 : 0)
})()
