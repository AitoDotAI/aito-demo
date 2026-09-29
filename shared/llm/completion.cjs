/**
 * Chat completions that do not end in "I was unable to generate a response".
 *
 * The customer chat substituted that apology whenever the model's message had
 * no content, and on demo.aito.ai it did so for ordinary questions
 * (td-20260928211432040153). Two causes are handled here:
 *
 * 1. The completion budget ran out before any content was written. Reasoning
 *    models spend completion tokens on thinking before the answer, so a 1000
 *    token budget can end with finish_reason "length" and content "". That is
 *    retried once with RETRY_BUDGET.
 * 2. No text anyway. The tools usually DID find something, so the reply is
 *    built from their results rather than apologising for a failure the
 *    customer cannot act on.
 */

const RETRY_BUDGET = 4000

function isEmptyCutOff(response) {
  const choice = response && response.choices && response.choices[0]
  const message = (choice && choice.message) || {}
  const hasText = typeof message.content === 'string' && message.content.trim() !== ''
  const hasToolCalls = Array.isArray(message.tool_calls) && message.tool_calls.length > 0
  return !hasText && !hasToolCalls && choice && choice.finish_reason === 'length'
}

async function completeWithHeadroom(openai, params) {
  const response = await openai.chat.completions.create(params)
  if (isEmptyCutOff(response) && (params.max_completion_tokens || 0) < RETRY_BUDGET) {
    console.warn(`completion cut off with no content at max_completion_tokens=${params.max_completion_tokens}; ` +
                 `retrying once at ${RETRY_BUDGET}`)
    return openai.chat.completions.create({ ...params, max_completion_tokens: RETRY_BUDGET })
  }
  return response
}

const CART_TOOLS = new Set(['add_to_cart', 'remove_from_cart'])

// `toolResults`: what each tool returned, with the tool's name as `tool`.
// Failed results are left out: their messages ("Unknown tool: X", "Please
// provide either productIds or productNames") are for the model, not a shopper.
function fallbackReply(toolResults) {
  const results = (toolResults || []).filter(r => r && r.success !== false)
  const found = results.find(r => Array.isArray(r.products) && r.products.length)
  const changedCart = results.some(r => CART_TOOLS.has(r.tool))
  if (found) {
    const lines = found.products.slice(0, 8).map(p =>
      `- ${p.name}${typeof p.price === 'number' ? ` — €${p.price.toFixed(2)}` : ''}`)
    const header = (typeof found.message === 'string' && found.message.trim()) || 'Here is what I found:'
    const ask = changedCart ? '' : '\n\nWould you like me to add any of these to your cart?'
    return `${header}\n\n${lines.join('\n')}${ask}`
  }
  const firstMessage = results.map(r => r.message).find(m => typeof m === 'string' && m.trim())
  if (firstMessage) return firstMessage
  return "I couldn't put an answer together for that one. Could you rephrase it, " +
         'or ask about a specific product or your usual shopping?'
}

module.exports = { completeWithHeadroom, fallbackReply, RETRY_BUDGET }
