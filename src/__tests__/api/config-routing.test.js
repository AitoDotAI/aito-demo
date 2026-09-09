/**
 * Pins which API the app talks to by default.
 *
 * This is a deliberate product decision, not an implementation detail: the
 * default decides what every visitor to demo.aito.ai actually queries. It
 * moved from v1 to v2 on 2026-09-09, and `REACT_APP_USE_REP2=false` is the
 * one-variable revert. A test rather than a comment, so flipping it back
 * accidentally fails the build instead of silently changing the demo.
 */

const load = (env) => {
  jest.resetModules()
  const saved = process.env
  process.env = { ...saved, ...env }
  // eslint-disable-next-line global-require
  const config = require('../../config')
  process.env = saved
  return config
}

describe('default API routing', () => {
  it('targets v2 / Rep2 / the `v2` env when nothing is set', () => {
    const c = load({
      REACT_APP_USE_REP2: undefined,
      REACT_APP_AITO_ENV: undefined,
      REACT_APP_AITO_URL: undefined,
    })
    expect(c.aito.apiVersion).toBe('v2')
    expect(c.aito.envName).toBe('v2')
    expect(c.aito.apiBase).toBe('https://shared.aito.ai/db/aito-demo/env/v2/api/v2')
  })

  it('reverts to v1 / Rep1 / master on REACT_APP_USE_REP2=false', () => {
    const c = load({
      REACT_APP_USE_REP2: 'false',
      REACT_APP_AITO_ENV: undefined,
      REACT_APP_AITO_URL: undefined,
    })
    expect(c.aito.apiVersion).toBe('v1')
    expect(c.aito.envName).toBe('master')
    expect(c.aito.apiBase).toBe('https://shared.aito.ai/db/aito-demo/api/v1')
  })

  it('only the exact string "false" reverts — a typo must not silently downgrade', () => {
    for (const v of ['False', 'FALSE', '0', 'no', '']) {
      expect(load({ REACT_APP_USE_REP2: v }).aito.apiVersion).toBe('v2')
    }
  })

  it('lets REACT_APP_AITO_ENV name a different env', () => {
    const c = load({ REACT_APP_USE_REP2: undefined, REACT_APP_AITO_ENV: 'sandbox' })
    expect(c.aito.apiBase).toBe('https://shared.aito.ai/db/aito-demo/env/sandbox/api/v2')
  })
})
