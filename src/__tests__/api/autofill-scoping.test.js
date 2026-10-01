/**
 * Autofill must predict from THIS user's visits, not from everybody's.
 *
 * `getAutoFill` sent the user as a top-level `where`:
 *
 *   { from: "visits", where: { user: "larry" }, predict: "purchases.$feature" }
 *
 * That makes the user a piece of EVIDENCE, not a boundary. The population the
 * prediction is read from stays every visit by every shopper, so Larry's
 * "what will you buy next" is shaped by strangers' baskets. It is the same
 * mistake as the accounting tenant finding and the SQL one: a filter in a
 * `where` narrows what you ask about, not what the answer is read from.
 *
 * The fix is a nested `from`, which this codebase already uses elsewhere —
 * 06-prompt.js:103 scopes to `type: "request"` exactly this way:
 *
 *   { from: { from: "visits", where: { user: "larry" } }, predict: ... }
 *
 * These assertions are on the request body rather than the returned ids,
 * because the ids depend on the data and the shape is what was wrong. The
 * behavioural half — scoping changes which products clear the 0.4 threshold —
 * is measured live against the demo instance, not here.
 */

import { getAutoFill } from '../../05-autofill'
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
    apiBase: 'https://test.aito.app/api/v2',
    envName: 'test',
  },
}))

const hits = { data: { hits: [{ $p: 0.9, $value: 'p-1' }, { $p: 0.1, $value: 'p-2' }] } }

/** The single body getAutoFill sends. */
function body() {
  expect(aitoPostRaw).toHaveBeenCalledTimes(1)
  return aitoPostRaw.mock.calls[0][1]
}

describe('getAutoFill scoping', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    aitoPostRaw.mockResolvedValue(hits)
  })

  it('scopes the population to the user with a nested from', async () => {
    await getAutoFill('larry')

    const b = body()
    expect(typeof b.from).toBe('object')
    expect(b.from.from).toBe('visits')
    expect(b.from.where).toEqual({ user: 'larry' })
  })

  it('does not leave the user as top-level evidence', async () => {
    await getAutoFill('larry')

    // The whole point: if `user` is still up here, the population is every
    // shopper's visits and the nested from was decoration.
    expect(body().where ?? {}).not.toHaveProperty('user')
  })

  it('queries the whole table when there is no user', async () => {
    await getAutoFill(undefined)

    // No user means no boundary to draw; scoping to nothing would be a lie of
    // a different kind, and `from: { from: "visits", where: {} }` is a worse
    // way to say "all visits" than "visits".
    expect(body().from).toBe('visits')
  })

  it('still scores purchases per member', async () => {
    await getAutoFill('larry')

    expect(body().predict).toBe('purchases.$feature')
    expect(body()).not.toHaveProperty('exclusiveness')
  })

  it('keeps the 0.4 threshold', async () => {
    const ids = await getAutoFill('larry')

    expect(ids).toEqual(['p-1'])
  })
})

describe('getAutoFill with no history', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns nothing rather than throwing when the shopper has no visits', async () => {
    // The engine answers 400 for a nested `from` that matched no rows, not an
    // empty result — so scoping turned an unhelpful answer into a broken page
    // for any shopper without history. Measured against shared 2026-10-01.
    aitoPostRaw.mockRejectedValue({
      response: {
        status: 400,
        data: {
          kind: 'error',
          data: {
            code: 'request.invalid',
            message: "nested from: the restriction matched no rows of 'visits'",
          },
        },
      },
    })

    await expect(getAutoFill('a-shopper-with-no-visits')).resolves.toEqual([])
  })

  it('still throws on a real failure', async () => {
    aitoPostRaw.mockRejectedValue(new Error('network down'))

    await expect(getAutoFill('larry')).rejects.toThrow('network down')
  })
})
