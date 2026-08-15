/**
 * Static guard against request shapes that /api/v2 rejects outright.
 *
 * Every pattern below was observed returning a 400 from the live v2 env during
 * the migration (see aito-core .ai/tasks/v2-api-contract-gaps-from-demo-
 * migration.md). None of them fails on v1, so without this check a
 * reintroduction only surfaces when someone flips REACT_APP_USE_REP2 — which
 * is exactly the sort of delayed break the migration was meant to end.
 *
 * This is a source scan, not a request test: scripts/v2-parity.js covers
 * behaviour by replaying real calls. The two are complementary — the harness
 * only tests the call sites transcribed into its case list, and an early
 * version of that list silently omitted `exclusiveness: false`.
 */

const fs = require('fs')
const path = require('path')

const SRC = path.join(__dirname, '..', '..')

/** Strip comments so prose describing a forbidden pattern does not trip it. */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
}

const FORBIDDEN = [
  {
    name: 'exclusiveness: false',
    pattern: /exclusiveness['"]?\s*:\s*false/,
    why: "v2: \"'exclusiveness: false' is deprecated and contradicts the "
      + "exclusive target\". Use nonExclusivePredict() from src/aito-client.",
  },
  {
    name: '$matches in select',
    pattern: /\$matches/,
    why: "v2: \"'$matches' is not a supported computed select expression\". "
      + 'No v2 equivalent exists; drop it.',
  },
  {
    name: 'relate: <string>',
    pattern: /["']relate["']\s*:\s*["']|[^.\w]relate\s*:\s*["']/,
    why: 'v2 requires the array form, relate: ["field"]. v1 accepts the array '
      + 'form too, so use it on both.',
  },
  {
    name: 'literal "estimate" in a select',
    pattern: /select\s*:\s*\[[^\]]*["']estimate["']/,
    why: "v2: \"unknown select field(s) estimate — available: value, why\". "
      + 'Use estimateSelect() from src/aito-client.',
  },
  {
    name: '_similarity endpoint',
    pattern: /_similarity['"`]/,
    why: 'v2 returns 404; $similarity is an in-query operator there.',
  },
  {
    name: 'hardcoded /api/v1/ path',
    pattern: /\/api\/v1\//,
    why: 'Bypasses config.aito.apiBase, silently opting the call out of the '
      + 'v1/v2 toggle.',
  },
]

const modules = fs.readdirSync(SRC).filter(f => /^\d\d-.*\.js$/.test(f))

describe('API modules avoid request shapes v2 rejects', () => {
  it('finds the API modules to scan', () => {
    expect(modules.length).toBe(13)
  })

  for (const file of modules) {
    describe(file, () => {
      const code = stripComments(fs.readFileSync(path.join(SRC, file), 'utf8'))
      for (const { name, pattern, why } of FORBIDDEN) {
        it(`does not use ${name}`, () => {
          const offending = code
            .split('\n')
            .map((line, i) => ({ line: line.trim(), n: i + 1 }))
            .filter(({ line }) => pattern.test(line))
          expect(
            offending.map(o => `${file}:${o.n}: ${o.line}`),
          ).toEqual([])
          if (offending.length) throw new Error(why)
        })
      }
    })
  }
})

describe('API modules route through the shared client', () => {
  for (const file of modules) {
    it(`${file} imports aito-client rather than calling axios directly`, () => {
      const code = stripComments(fs.readFileSync(path.join(SRC, file), 'utf8'))
      if (/axios\.(post|get)\(/.test(code)) {
        expect(`${file} calls axios directly`).toBe(
          'all Aito calls should go through src/aito-client',
        )
      }
    })
  }
})
