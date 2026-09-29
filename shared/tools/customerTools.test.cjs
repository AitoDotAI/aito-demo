// node --test shared/tools/customerTools.test.cjs
//
// The chat's server-side tools, with axios replaced so each test sees the query
// a tool sends and answers it the way the live data did on 2026-09-29.
const test = require('node:test')
const assert = require('node:assert')
const axios = require('axios')
const { executeCustomerTool } = require('./customerTools.cjs')

function answer(reply) {
  const sent = []
  axios.post = async (url, body) => {
    sent.push({ url, body })
    if (typeof reply === 'function') return reply(body)
    return { data: reply }
  }
  return sent
}

test.beforeEach(() => { console.log = () => {}; console.warn = () => {}; console.error = () => {} })

test('search_products does not $match the tags array (every call was a 400)', async () => {
  const sent = answer((body) => {
    const clauses = JSON.stringify(body.where)
    if (/"tags"[^}]*\$match/.test(clauses)) {
      const err = new Error('Request failed with status code 400')
      err.response = { status: 400, data: { error: "field 'product.tags' of type Array[String] cannot match value" } }
      throw err
    }
    return { data: { hits: [{ id: '1', name: 'Pirkka banana', price: 0.17 }] } }
  })
  const result = await executeCustomerTool('search_products', { query: 'banana' }, 'larry', [])
  assert.strictEqual(result.success, true)
  assert.strictEqual(result.products[0].name, 'Pirkka banana')
  assert.deepStrictEqual(sent[0].body.where['product.name'], { $match: 'banana' })
})

test("smart-cart predictions give Larry more than the one item over 0.4", async () => {
  answer((body) => {
    if (body.from === 'visits') {
      return { data: { hits: [0.417, 0.393, 0.370, 0.360, 0.349, 0.346, 0.12].map((p, i) => ({ $p: p, $value: `p${i}` })) } }
    }
    // the product lookup for the picked ids
    const ids = body.where.id.$or
    return { data: { hits: ids.map(id => ({ id, name: `product ${id}`, price: 1 })) } }
  })
  const result = await executeCustomerTool('get_smart_cart_predictions', {}, 'larry', [])
  assert.ok(result.products.length >= 5, `got ${result.products.length} products`)
  assert.ok(!result.products.some(p => p.id === 'p6'), 'a 0.12 guess is not added')
})
