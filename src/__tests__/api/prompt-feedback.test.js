/**
 * The feedback branch of prompt() must not ask v2 for a contradiction.
 *
 * Typing any feedback into Help returned a 400. The cause is a pairing, not a
 * typo: the branch lists its targets as
 *
 *   const fields = ["sentiment", "categories.$feature", "tags"]
 *
 * — already in the `.$feature` spelling — and then routes only the literal
 * "tags" through nonExclusivePredict(). Everything else falls to the else arm
 * and gets `{ predict: <field>, exclusiveness: true }`, so `categories` is
 * sent as `categories.$feature` WITH `exclusiveness: true`. `.$feature` IS the
 * non-exclusive per-member form, so that body asks for per-member scoring and
 * exclusive scoring at once and v2 rejects it.
 *
 * The same file already knows better: the `request` branch (06-prompt.js:112)
 * spreads nonExclusivePredict('categories'). Only the feedback branch disagrees.
 *
 * Why this is a behavioural test and not a line in v2-compat-lint: there, the
 * forbidden shapes are literal text. Here the `.$feature` string and the
 * `exclusiveness` key are joined through a variable and a ternary, so no source
 * regex sees them together. What is wrong is the body that goes out, so the
 * body that goes out is what this asserts.
 */

import { prompt } from '../../06-prompt'
import { aitoPostRaw } from '../../aito-client'

jest.mock('../../aito-client', () => {
  const actual = jest.requireActual('../../aito-client')
  return { ...actual, aitoPostRaw: jest.fn() }
})

jest.mock('../../config', () => ({
  aito: {
    url: 'https://test.aito.app',
    apiKey: 'test-api-key',
    apiVersion: 'v2',
    envName: 'test',
  },
}))

/** First call classifies the prompt; the rest are the per-field predicts. */
function respond() {
  let first = true
  aitoPostRaw.mockImplementation(() => {
    if (first) {
      first = false
      return Promise.resolve({ data: { hits: [{ feature: 'feedback', $p: 0.9 }] } })
    }
    return Promise.resolve({ data: { hits: [{ feature: 'produce', $p: 0.6 }] } })
  })
}

/** Every body sent, minus the classification call. */
function bodies() {
  return aitoPostRaw.mock.calls.slice(1).map(([, body]) => body)
}

describe('prompt() feedback branch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    respond()
  })

  it('never pairs a .$feature target with exclusiveness', async () => {
    await prompt('the bananas were mouldy and the queue was long')

    const contradictory = bodies().filter(
      (b) => String(b.predict).endsWith('.$feature') && 'exclusiveness' in b,
    )

    expect(contradictory).toEqual([])
  })

  it('asks for categories per member, with no exclusiveness flag', async () => {
    await prompt('the bananas were mouldy and the queue was long')

    const categories = bodies().find((b) => String(b.predict).startsWith('categories'))

    expect(categories).toBeDefined()
    expect(categories.predict).toBe('categories.$feature')
    expect(categories).not.toHaveProperty('exclusiveness')
  })

  it('still scores tags per member', async () => {
    await prompt('the bananas were mouldy and the queue was long')

    const tags = bodies().find((b) => String(b.predict).startsWith('tags'))

    expect(tags).toBeDefined()
    expect(tags.predict).toBe('tags.$feature')
    expect(tags).not.toHaveProperty('exclusiveness')
  })

  it('leaves genuinely exclusive targets alone', async () => {
    await prompt('the bananas were mouldy and the queue was long')

    const sentiment = bodies().find((b) => String(b.predict) === 'sentiment')

    // sentiment is single-valued, so the exclusive form is the correct one and
    // v2 accepts `exclusiveness: true`. This guards the fix from over-reaching.
    expect(sentiment).toBeDefined()
    expect(sentiment.exclusiveness).toBe(true)
  })

  it('reports the fields it managed to predict', async () => {
    const rv = await prompt('the bananas were mouldy and the queue was long')

    expect(rv.type).toBe('feedback')
    expect(rv.categories).toBe('produce')
  })
})
