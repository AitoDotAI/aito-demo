/**
 * The grocery demo's 2026-09-27 review (board td-20260928211432040153).
 *
 * Each case replays what demo.aito.ai returned when the bug was reproduced on
 * 2026-09-29 (shared.aito.ai/db/aito-demo, env v2), through a mocked
 * aitoPostRaw, so the test pins the behaviour a visitor saw:
 *
 *   autofill  — Larry's purchase predictions: one hit >= 0.4 (0.417), then
 *               0.393, 0.370, 0.360, 0.349 … so the cart got ONE item
 *   category  — "Fazer rye bread 500g" predicts category "101" (p 0.982), and
 *               the admin form showed the raw id
 *   help form — "my order arrived damaged, I want a refund" is a request with
 *               urgency "low" at p 0.507, and the form showed "low" with the
 *               probability computed and dropped
 */

jest.mock('../../aito-client', () => {
  const actual = jest.requireActual('../../aito-client')
  return { ...actual, aitoPostRaw: jest.fn() }
})

const { aitoPostRaw } = require('../../aito-client')
const { getAutoFill } = require('../../05-autofill')
const { predictCategory } = require('../../13-product-predictions')
const { prompt } = require('../../06-prompt')

const hit = (value, p, extra = {}) => ({ $value: value, feature: value, $p: p, ...extra })
const respond = (...hits) => Promise.resolve({ data: { hits } })

beforeEach(() => aitoPostRaw.mockReset())

describe('autofill', () => {
  it("fills more than the single item that clears 0.4 (Larry, as measured)", async () => {
    aitoPostRaw.mockReturnValueOnce(respond(
      hit('6410405093677', 0.417), hit('2000818700008', 0.393), hit('6411401028373', 0.370),
      hit('6407870071224', 0.360), hit('6437002001454', 0.349), hit('2000503600002', 0.346),
      hit('9999999999999', 0.120),
    ))
    const ids = await getAutoFill('larry')
    expect(ids.length).toBeGreaterThanOrEqual(5)
    expect(ids[0]).toBe('6410405093677')
    expect(ids).not.toContain('9999999999999')   // a weak guess is still not added
  })

  it('does not pad with weak guesses when nothing is likely', async () => {
    aitoPostRaw.mockReturnValueOnce(respond(hit('a', 0.2), hit('b', 0.1)))
    expect(await getAutoFill('newcomer')).toEqual([])
  })
})

describe('category prediction', () => {
  it('names the category instead of showing the raw id', async () => {
    aitoPostRaw.mockReturnValueOnce(respond(hit('101', 0.982)))
    const prediction = await predictCategory('Fazer rye bread 500g')
    expect(prediction.value).toBe('101')
    expect(prediction.label).toMatch(/bread/i)
    expect(prediction.label).not.toBe('101')
  })

  it('falls back to the id, marked, for a category it has no name for', async () => {
    aitoPostRaw.mockReturnValueOnce(respond(hit('999', 0.6)))
    expect((await predictCategory('mystery')).label).toBe('Category 999')
  })
})

describe('help form', () => {
  it('returns the confidence of each routed field, with its tier', async () => {
    aitoPostRaw
      .mockReturnValueOnce(respond(hit('request', 0.977)))                        // type
      .mockReturnValueOnce(respond({ $p: 0.61, Name: 'Frank Wilson', Role: 'Support' }))  // assignee
      .mockReturnValueOnce(respond(hit('operations issue', 0.688)))              // categories
      .mockReturnValueOnce(respond(hit('low', 0.507)))                           // urgency
    const result = await prompt('my order arrived damaged, I want a refund')
    expect(result.urgency).toBe('low')
    expect(result.confidence.urgency).toEqual({ p: 0.507, tier: 'medium' })
    expect(result.confidence.categories.tier).toBe('medium')
    expect(result.confidence.assignee.p).toBe(0.61)
  })
})
