/**
 * The context panel may not assert numbers nothing measured.
 *
 * It showed "0.92 Confidence" and "20-50ms Response" on every page, beside
 * three genuinely live panels. Neither came from anywhere: no query returns
 * 0.92, and no timing is taken in the app. A visitor cannot tell the invented
 * pair from the measured ones sitting next to them, which is what makes a
 * decorative number worse than no number.
 *
 * "Zero Training" stays — it is a claim about how Aito works, not a
 * measurement, and it is true. "90K+ Records" stays as a documented dataset
 * size (README: "90K impressions dataset"), verified against the live
 * instance rather than taken on trust.
 *
 * A source scan rather than a render test, matching v2-compat-lint: the point
 * is that these two cannot come back, and they would come back as source.
 */

const fs = require('fs')
const path = require('path')

const PANEL = path.join(__dirname, '..', '..', 'app', 'components', 'ContextPanel.js')

/** Strip comments so prose naming a forbidden stat does not trip the scan. */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
}

const FORBIDDEN = [
  {
    name: 'a hardcoded confidence figure',
    pattern: /label:\s*['"]Confidence['"]/,
    why: 'No query in this app returns a 0.92, or any other fixed confidence. '
      + 'If a confidence is worth showing, show the one the response carried.',
  },
  {
    name: 'a hardcoded response time',
    pattern: /label:\s*['"]Response['"]/,
    why: 'Nothing times a request here. A latency claim has to come from a '
      + 'measurement, not from the designer.',
  },
]

describe('ContextPanel stats', () => {
  const src = stripComments(fs.readFileSync(PANEL, 'utf8'))

  FORBIDDEN.forEach(({ name, pattern, why }) => {
    it(`does not show ${name}`, () => {
      expect({ found: pattern.test(src), why }).toEqual({ found: false, why })
    })
  })

  it('still shows the claims that are true', () => {
    expect(src).toMatch(/label:\s*['"]Training['"]/)
    expect(src).toMatch(/label:\s*['"]Records['"]/)
  })
})
