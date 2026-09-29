// node --test shared/
//
// The customer chat answered "I apologize, but I was unable to generate a
// response." to plain free-text questions (reproduced on demo.aito.ai on
// 2026-09-29: "What would you recommend for a healthy breakfast?" -> that
// apology, after 37 s; a different question in the same minute got a real
// answer). The server substituted the apology whenever the model's message had
// no content. Two ways that happens, both handled here:
//   - the model spent its whole completion budget (1000 tokens) before writing
//     any content: finish_reason "length", content "" -> retry once with room;
//   - the model returns no text anyway -> answer from what the tools found,
//     never an apology when products were found.
const test = require('node:test')
const assert = require('node:assert')
const { completeWithHeadroom, fallbackReply, RETRY_BUDGET } = require('./completion.cjs')

const reply = (content, finish = 'stop', tool_calls) => ({
  choices: [{ finish_reason: finish, message: { role: 'assistant', content, tool_calls } }],
})

function fakeOpenAI(...responses) {
  const calls = []
  return {
    calls,
    chat: { completions: { create: async (params) => { calls.push(params); return responses.shift() } } },
  }
}

test('a completion cut off before any content is retried once with more room', async () => {
  const openai = fakeOpenAI(reply('', 'length'), reply('Oatmeal and bananas are a good start.'))
  const res = await completeWithHeadroom(openai, { model: 'm', messages: [], max_completion_tokens: 1000 })
  assert.strictEqual(res.choices[0].message.content, 'Oatmeal and bananas are a good start.')
  assert.strictEqual(openai.calls.length, 2)
  assert.strictEqual(openai.calls[1].max_completion_tokens, RETRY_BUDGET)
})

test('a normal answer, or a tool call, is not retried', async () => {
  const answered = fakeOpenAI(reply('Hello!'))
  await completeWithHeadroom(answered, { messages: [], max_completion_tokens: 1000 })
  assert.strictEqual(answered.calls.length, 1)
  const toolCall = fakeOpenAI(reply(null, 'tool_calls', [{ id: 't1', function: { name: 'search', arguments: '{}' } }]))
  await completeWithHeadroom(toolCall, { messages: [], max_completion_tokens: 1000 })
  assert.strictEqual(toolCall.calls.length, 1)
})

test('with no text from the model, the reply lists what the tools found', () => {
  const text = fallbackReply([{ success: true, message: 'Found 2 products matching "breakfast"',
    products: [{ name: 'Elovena oatmeal 1 kg', price: 1.89 }, { name: 'Pirkka banana', price: 0.17 }] }])
  assert.match(text, /Elovena oatmeal 1 kg — €1\.89/)
  assert.match(text, /Pirkka banana/)
  assert.doesNotMatch(text, /unable to generate/)
})

test('with nothing found either, the reply asks for a rephrase instead of apologising for a failure', () => {
  const text = fallbackReply([])
  assert.doesNotMatch(text, /unable to generate/)
  assert.match(text, /rephras/)
})

test('failed tool results never reach the shopper, and no cart question after a cart change', () => {
  const failed = fallbackReply([{ success: false, message: 'Unknown tool: frobnicate' }])
  assert.doesNotMatch(failed, /Unknown tool/)
  const afterAdd = fallbackReply([
    { tool: 'add_to_cart', success: true, message: 'Added 1 item to your cart', products: [{ name: 'Pirkka banana', price: 0.17 }] },
  ])
  assert.match(afterAdd, /Added 1 item/)
  assert.doesNotMatch(afterAdd, /Would you like me to add/)
})
