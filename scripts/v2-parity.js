#!/usr/bin/env node
/**
 * v1 <-> v2 parity harness for aito-demo.
 *
 * Replays every query shape the app sends (scripts/v2-cases.js) against both
 * the v1/Rep1 path and the v2/Rep2 path, then classifies each pair.
 *
 * Why this exists: during the migration sweep, `_aggregate`, `_estimate` and
 * `_evaluate` all returned 200 on v2 while being *silently* incompatible —
 * v2 wraps their result in a {kind, data} envelope, so a consumer reading
 * `response.data.accuracy` gets undefined with no error. A status-code probe
 * reports those as green. This harness compares payloads, not status codes.
 *
 * Anti-fabrication: every value written to docs/v2-parity.json is captured
 * from a real call in this run. Nothing is filled in from memory. Where a
 * value could not be captured, the literal string "TODO:antti-wire" is
 * written in its place so the gap stays visible.
 *
 * READ-ONLY. Every endpoint used is a query endpoint; this script never
 * creates, deletes or mutates anything, so it is safe against production.
 *
 * Usage:
 *   node scripts/v2-parity.js                # human-readable table
 *   node scripts/v2-parity.js --json         # also write docs/v2-parity.json
 *   node scripts/v2-parity.js --only=07      # filter cases by id substring
 *   node scripts/v2-parity.js --ci           # exit 1 if any case is a BREAK
 *
 * Env:
 *   AITO_URL       default https://shared.aito.ai/db/aito-demo
 *   AITO_API_KEY   a READ key is sufficient
 *   AITO_V1_ENV    default master   (unprefixed /api/v1)
 *   AITO_V2_ENV    default v2       (/env/v2/api/v2)
 */

const fs = require('fs')
const path = require('path')
const axios = require('axios')
const { CASES } = require('./v2-cases')
// The exact normaliser the app runs on every response. Comparing normalised
// payloads is the question that matters: not "do the two APIs agree", but
// "does the app see the same thing on either". Sharing the module means the
// harness cannot certify a normalisation the app does not actually perform.
const { normalize } = require('../src/aito-compat')

const MARKER = 'TODO:antti-wire'

const AITO_URL = process.env.AITO_URL
  || process.env.REACT_APP_AITO_URL
  || 'https://shared.aito.ai/db/aito-demo'
const AITO_API_KEY = process.env.AITO_API_KEY
  || process.env.REACT_APP_AITO_API_KEY
  || 'yg4rTlXkqDzm4y8gPeY75HCKaNwfbTQ2si64ONTi' // public read key, same as src/config.js
const V1_ENV = process.env.AITO_V1_ENV || 'master'
const V2_ENV = process.env.AITO_V2_ENV || 'v2'

const argv = process.argv.slice(2)
const writeJson = argv.includes('--json')
const ciMode = argv.includes('--ci')
const only = (argv.find(a => a.startsWith('--only=')) || '').split('=')[1]

const envPath = name => (name && name !== 'master' ? `/env/${name}` : '')
const base = (env, version) => `${AITO_URL}${envPath(env)}/api/${version}`
const V1 = base(V1_ENV, 'v1')
const V2 = base(V2_ENV, 'v2')

// ---------------------------------------------------------------- guardrails

// Read-only endpoints. Anything not on this list is refused outright rather
// than trusted, so this script can never become a write path by accident.
const READ_ENDPOINTS = new Set([
  '_query', '_predict', '_recommend', '_relate', '_match',
  '_aggregate', '_estimate', '_evaluate', '_search', '_batch',
])

// ---------------------------------------------------------------- comparison

/** v2 wraps scalar-returning endpoints in {kind, data}; v1 returns them bare. */
function unwrap(payload) {
  const wrapped = payload
    && typeof payload === 'object'
    && !Array.isArray(payload)
    && typeof payload.kind === 'string'
    && Object.prototype.hasOwnProperty.call(payload, 'data')
    && Object.keys(payload).length === 2
  return { wrapped, value: wrapped ? payload.data : payload }
}

const isObj = v => v && typeof v === 'object' && !Array.isArray(v)

/** Structural key signature, ignoring values and array length. */
function shape(v, depth = 0) {
  if (depth > 4) return '…'
  if (Array.isArray(v)) return v.length ? `[${shape(v[0], depth + 1)}]` : '[]'
  if (isObj(v)) return `{${Object.keys(v).sort().map(k => `${k}:${shape(v[k], depth + 1)}`).join(',')}}`
  return v === null ? 'null' : typeof v
}

const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b)

/**
 * Walk the v1 payload and report every path that v2 fails to provide.
 *
 * Asymmetric on purpose. The app was written against v1, so what matters is
 * whether v2 supplies everything v1 did — extra v2 fields (`$value` beside
 * `feature`, or `_relate`'s `n`/`condition`/`fs`) are additive and cannot
 * break a consumer that never reads them. A symmetric diff would flag those
 * as failures and bury the ones that actually matter.
 *
 * Returns { missing: [...paths], differing: [...{path, v1, v2}] }.
 */
function coverage(a, b, prefix = '', acc = { missing: [], differing: [] }) {
  if (acc.missing.length + acc.differing.length > 60) return acc
  const at = prefix || '<root>'

  if (Array.isArray(a)) {
    // A missing array is structural; a *shorter* one is not. Result lists and
    // multi-valued predictions legitimately differ in length between engines,
    // and consumers iterate them rather than indexing fixed positions, so a
    // length difference is reported as a value delta, not a missing field.
    if (!Array.isArray(b)) { acc.missing.push(`${at} (v2 is not an array)`); return acc }
    if (a.length !== b.length) {
      acc.differing.push({ path: `${at}.length`, v1: a.length, v2: b.length })
    }
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      coverage(a[i], b[i], `${prefix}[${i}]`, acc)
    }
    return acc
  }

  if (isObj(a)) {
    if (!isObj(b)) { acc.missing.push(`${at} (v2 is not an object)`); return acc }
    for (const k of Object.keys(a)) {
      if (!(k in b)) acc.missing.push(prefix ? `${prefix}.${k}` : k)
      else coverage(a[k], b[k], prefix ? `${prefix}.${k}` : k, acc)
    }
    return acc
  }

  if (a !== b) acc.differing.push({ path: at, v1: a, v2: b })
  return acc
}

/**
 * Verdicts, worst to best:
 *   BREAK       v2 returned an error
 *   MISSING     v2 omits a field v1 supplied — the app would read undefined
 *   ACCEPTED    a MISSING that the case declares as a known, checked-off gap
 *   NORMALISED  raw responses differ, but src/aito-compat makes them identical
 *   VALUES      same structure, different numbers (ML drift, or a real regression)
 *   BODY-DIFF   parity reached only because the harness sent a different v2 body
 *   IDENTICAL   byte-for-byte equal
 */
function classify(c, r1, r2) {
  if (!r2.ok) return { verdict: 'BREAK', detail: r2.error }
  if (!r1.ok) return { verdict: 'V1-BREAK', detail: r1.error }

  // Raw payloads, to detect a difference the app's normaliser papers over.
  const rawEnvelopeDiff = unwrap(r2.data).wrapped && !unwrap(r1.data).wrapped
  const rawEqual = deepEqual(r1.data, r2.data)

  // What the app actually receives, after src/aito-compat.
  const n1 = normalize(r1.data, c.bodyV1 || c.body)
  const n2 = normalize(r2.data, c.bodyV2 || c.body)
  const sameAfterNormalise = deepEqual(n1, n2)
  const differentBody = Boolean(c.bodyV1 || c.bodyV2)

  if (sameAfterNormalise) {
    if (!rawEqual) {
      return {
        verdict: 'NORMALISED',
        detail: rawEnvelopeDiff
          ? 'raw responses differ ({kind,data} envelope); identical after src/aito-compat'
          : 'raw responses differ (field names); identical after src/aito-compat',
      }
    }
    return differentBody
      ? { verdict: 'BODY-DIFF', detail: c.note || 'identical result, but the versions needed different request bodies' }
      : { verdict: 'IDENTICAL', detail: '' }
  }

  const { missing, differing } = coverage(n1, n2)

  if (missing.length) {
    // A case may declare `accept: '<reason>'` for a gap that has been checked
    // and consciously taken on. Those stay visible in the table but do not
    // fail CI, so a NEW gap is not lost among the known ones.
    if (c.accept) {
      return {
        verdict: 'ACCEPTED',
        detail: c.accept,
        missing: missing.slice(0, 4),
      }
    }
    return {
      verdict: 'MISSING',
      detail: `v2 does not supply ${missing.length} field(s) v1 does`,
      missing: missing.slice(0, 6),
      shapeV1: shape(n1),
      shapeV2: shape(n2),
    }
  }

  const deltas = differing.filter(d => typeof d.v1 === 'number' && typeof d.v2 === 'number')
  const nonNumeric = differing.filter(d => !(typeof d.v1 === 'number' && typeof d.v2 === 'number'))

  if (nonNumeric.length) {
    return {
      verdict: 'VALUES',
      detail: `all v1 fields present; ${differing.length} value(s) differ (${nonNumeric.length} non-numeric)`,
      deltas: nonNumeric.concat(deltas).slice(0, 8),
    }
  }

  return {
    verdict: 'VALUES',
    detail: `all v1 fields present; ${deltas.length} numeric value(s) differ`,
    deltas: deltas.slice(0, 8),
  }
}

// ---------------------------------------------------------------- execution

async function call(baseUrl, endpoint, body) {
  if (!READ_ENDPOINTS.has(endpoint)) {
    return { ok: false, error: `refused: '${endpoint}' is not a known read-only endpoint` }
  }
  try {
    const res = await axios.post(`${baseUrl}/${endpoint}`, body, {
      headers: { 'x-api-key': AITO_API_KEY, 'content-type': 'application/json' },
      timeout: 60000,
    })
    return { ok: true, status: res.status, data: res.data }
  } catch (e) {
    const d = e.response && e.response.data
    const msg = (d && d.data && d.data.message) || (d && d.message) || e.message
    return { ok: false, status: e.response && e.response.status, error: msg, data: d }
  }
}

/** Trim a captured payload so the artifact stays readable but stays REAL. */
function sample(payload) {
  if (payload === undefined) return MARKER
  const { value } = unwrap(payload)
  if (isObj(value) && Array.isArray(value.hits)) {
    return { ...value, hits: value.hits.slice(0, 2), _hitsTruncatedFrom: value.hits.length }
  }
  return value
}

const PAD = 26
const COLOR = process.stdout.isTTY
const tint = (s, c) => (COLOR ? `[${c}m${s}[0m` : s)
const paint = v => ({
  IDENTICAL: tint(v, 32), NORMALISED: tint(v, 32), 'BODY-DIFF': tint(v, 36),
  VALUES: tint(v, 33), ACCEPTED: tint(v, 36), MISSING: tint(v, 31), BREAK: tint(v, 31), 'V1-BREAK': tint(v, 31),
}[v] || v)

/**
 * Compare the number of Aito call sites in src/ against the number of cases.
 *
 * The cases are transcribed from the modules by hand, and a transcription that
 * silently drifts is worse than no harness: an early version of this file
 * omitted `exclusiveness: false` from three cases and reported them green,
 * while the real bodies 400 on v2. This does not verify the bodies — only that
 * no call site is entirely unrepresented — but that is the failure mode that
 * actually occurred.
 */
function checkCoverage() {
  const srcDir = path.join(__dirname, '..', 'src')
  const modules = fs.readdirSync(srcDir).filter(f => /^\d\d-.*\.js$/.test(f))
  let callSites = 0
  for (const f of modules) {
    const src = fs.readFileSync(path.join(srcDir, f), 'utf8')
    callSites += (src.match(/aitoPostRaw\(|aitoPost\(/g) || []).length
  }
  if (CASES.length < callSites) {
    console.log(`  NOTE: ${callSites} call sites in src/, ${CASES.length} cases — `
      + `${callSites - CASES.length} call site(s) may be untested\n`)
  } else {
    console.log(`  ${callSites} call sites in src/, ${CASES.length} cases\n`)
  }
}

async function main() {
  const cases = only ? CASES.filter(c => c.id.includes(only)) : CASES
  console.log(`aito-demo v1<->v2 parity   (${cases.length} cases)`)
  console.log(`  v1: ${V1}`)
  console.log(`  v2: ${V2}`)
  console.log(`  READ-ONLY — no endpoint in this run mutates data`)
  if (!only) checkCoverage(); else console.log('')

  const results = []
  for (const c of cases) {
    const b1 = c.bodyV1 || c.body
    const b2 = c.bodyV2 || c.body
    const [r1, r2] = await Promise.all([
      call(V1, c.endpoint, b1),
      call(V2, c.endpoint, b2),
    ])
    const verdict = classify(c, r1, r2)
    results.push({ c, r1, r2, verdict })

    const line = `${c.id.padEnd(PAD)} ${paint(verdict.verdict.padEnd(10))} ${verdict.detail || ''}`
    console.log(line)
    if (verdict.deltas && verdict.deltas.length) {
      for (const d of verdict.deltas.slice(0, 4)) {
        console.log(`${''.padEnd(PAD + 12)}${d.path}: v1=${d.v1}  v2=${d.v2}`)
      }
    }
    if (verdict.missing) {
      for (const m of verdict.missing) console.log(`${''.padEnd(PAD + 12)}missing on v2: ${m}`)
    }
  }

  const tally = results.reduce((a, r) => { a[r.verdict.verdict] = (a[r.verdict.verdict] || 0) + 1; return a }, {})
  console.log('\nsummary: ' + Object.entries(tally).map(([k, v]) => `${k}=${v}`).join('  '))

  if (writeJson) {
    const outFile = path.join(__dirname, '..', 'docs', 'v2-parity.json')
    fs.mkdirSync(path.dirname(outFile), { recursive: true })
    const artifact = {
      // Stamped by the runner, not by hand.
      capturedAt: new Date().toISOString(),
      // No endpoint reports the core build (see aito-core task
      // v2-build-introspection-and-deploy-visibility.md, Issue 1), so this
      // cannot be captured and must not be guessed.
      coreBuild: MARKER,
      v1Base: V1,
      v2Base: V2,
      tally,
      cases: results.map(({ c, r1, r2, verdict }) => ({
        id: c.id,
        source: c.source,
        endpoint: c.endpoint,
        verdict: verdict.verdict,
        detail: verdict.detail || null,
        note: c.note || null,
        requestV1: c.bodyV1 || c.body,
        requestV2: c.bodyV2 || c.body,
        bodiesDiffer: Boolean(c.bodyV1 || c.bodyV2),
        v1: r1.ok ? { status: r1.status, sample: sample(r1.data) } : { status: r1.status || null, error: r1.error },
        v2: r2.ok ? { status: r2.status, sample: sample(r2.data) } : { status: r2.status || null, error: r2.error },
        valueDeltas: verdict.deltas || null,
        missingOnV2: verdict.missing || null,
        accepted: c.accept || null,
      })),
    }
    fs.writeFileSync(outFile, JSON.stringify(artifact, null, 2) + '\n')
    console.log(`\nwrote ${path.relative(process.cwd(), outFile)}`)
  }

  const fatal = results.filter(r => ['BREAK', 'MISSING', 'V1-BREAK'].includes(r.verdict.verdict)).length
  if (ciMode && fatal) {
    console.error(`\nFAIL: ${fatal} case(s) error on v2 or drop a field the app reads`)
    process.exit(1)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
