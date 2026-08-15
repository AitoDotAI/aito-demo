#!/usr/bin/env node

/**
 * Aito.ai rep2 / CollectionDb Data Upload Script
 *
 * Sets up a self-contained **v2 sandbox** on an Aito instance: it creates a
 * named env (a branch of master), wipes the tables it inherited, and rebuilds
 * the demo as native **CollectionDb (rep2)** tables, then loads the data.
 *
 * Why an env? Branching keeps the production (rep1) master untouched while the
 * v2 surface — flexible schema, richer types, `_query` / explainable predict —
 * is exercised against the same data under `/env/{name}/api/v2/...`.
 *
 * Usage:
 *   node upload-data-v2.js [--dry-run] [--skip-schema] [--skip-data]
 *                          [--only-table=products] [--keep-env]
 *
 * Environment variables:
 *   AITO_URL            instance base, e.g. https://shared.aito.ai/db/aito-demo
 *                       (default: REACT_APP_AITO_URL from .env / config.js)
 *   AITO_API_KEY        a READ-WRITE key (env create + schema + data are writes)
 *                       (default: AITO_READ_WRITE_KEY || REACT_APP_AITO_API_KEY)
 *   AITO_ENV            sandbox env name (default: "v2")
 *   AITO_BASED_ON       env to branch from (default: "env.master")
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Optional config.js fallback (matches upload-data.js behaviour)
let config = { aito: {} };
try { config = require('./src/config.js'); } catch (e) { /* optional */ }

// ---- args ----
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const skipSchema = args.includes('--skip-schema');
const skipData = args.includes('--skip-data');
const keepEnv = args.includes('--keep-env'); // reserved; env is reused by default
const onlyTable = args.find(a => a.startsWith('--only-table='))?.split('=')[1];

// ---- config ----
const AITO_URL = process.env.AITO_URL
  || process.env.REACT_APP_AITO_URL
  || config.aito.url;
const AITO_API_KEY = process.env.AITO_API_KEY
  || process.env.AITO_READ_WRITE_KEY
  || process.env.REACT_APP_AITO_API_KEY
  || config.aito.apiKey;
const ENV_NAME = process.env.AITO_ENV || 'v2';
const BASED_ON = process.env.AITO_BASED_ON || 'env.master';
const DATA_DIR = path.join(__dirname, 'src/data');
const SCHEMA_FILE = path.join(DATA_DIR, 'schema-rep2.json');

// Chunk large arrays so each batch body stays well under the 8 MB cap.
const BATCH_ROWS = 4000;

// Create link targets before the tables that point at them.
const CREATE_ORDER = [
  'users', 'products', 'employees', 'glCodes', 'answers',
  'visits', 'contexts', 'impressions', 'prompts', 'invoices'
];

// table -> data file (defaults to <table>.json; only overrides listed here)
const DATA_FILE = {};

const api = axios.create({
  timeout: 300000,
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
  headers: { 'x-api-key': AITO_API_KEY, 'Content-Type': 'application/json' }
});

const ts = () => new Date().toISOString();
const log = (m, ...a) => console.log(`[${ts()}] ${m}`, ...a);
const err = (m, ...a) => console.error(`[${ts()}] ERROR: ${m}`, ...a);

function v2(p) { return `${AITO_URL}/env/${ENV_NAME}/api/v2${p}`; }
function root(p) { return `${AITO_URL}/api/v2${p}`; }

function detail(e) {
  if (e.response) return `HTTP ${e.response.status} ${JSON.stringify(e.response.data)}`;
  return e.message;
}

/** Create the sandbox env if it does not already exist. Idempotent. */
async function ensureEnv() {
  const list = (await api.get(root('/_envs'))).data;
  const exists = (list.envs || []).some(e => e.name === ENV_NAME);
  if (exists) {
    log(`Env '${ENV_NAME}' already exists — reusing it.`);
    return;
  }
  if (isDryRun) { log(`DRY RUN: would create env '${ENV_NAME}' basedOn '${BASED_ON}'`); return; }
  await api.post(root('/_envs'), { name: ENV_NAME, basedOn: BASED_ON });
  log(`Created env '${ENV_NAME}' (basedOn '${BASED_ON}').`);
}

/** Drop every table currently in the env, giving a clean rep2 slate. */
async function wipeEnv() {
  if (isDryRun) { log('DRY RUN: would wipe all inherited tables in the env'); return; }
  const schema = (await api.get(v2('/schema'))).data;
  const tables = Object.keys(schema.schema || {});
  if (!tables.length) { log('Env already empty.'); return; }
  log(`Wiping ${tables.length} inherited tables: ${tables.join(', ')}`);
  if (isDryRun) { log('DRY RUN: would delete the tables above'); return; }
  for (const t of tables) {
    try { await api.delete(v2(`/schema/${t}`)); }
    catch (e) { err(`delete ${t} failed: ${detail(e)}`); }
  }
}

/** Create one CollectionDb table from the schema-rep2.json definition. */
async function createTable(name, def) {
  const body = { type: 'collection', columns: def.columns };
  if (isDryRun) { log(`DRY RUN: would create collection '${name}' (${Object.keys(def.columns).length} cols)`); return; }
  await api.put(v2(`/schema/${name}`), body);
  log(`Created collection '${name}'.`);
}

/** Batch-insert a JSON array, chunked to stay under the body-size cap. */
async function insertData(name) {
  const file = path.join(DATA_DIR, DATA_FILE[name] || `${name}.json`);
  if (!fs.existsSync(file)) { log(`No data file for '${name}' (${path.basename(file)}) — skipping.`); return; }
  const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(rows)) { err(`${file} is not a JSON array`); return; }
  if (isDryRun) { log(`DRY RUN: would insert ${rows.length} rows into '${name}'`); return; }

  let done = 0, skipped = 0;
  for (let i = 0; i < rows.length; i += BATCH_ROWS) {
    const chunk = rows.slice(i, i + BATCH_ROWS);
    try {
      await api.post(v2(`/data/${name}/batch`), chunk);
      done += chunk.length;
    } catch (e) {
      // A single malformed row 500s its whole chunk; skip it and keep going
      // rather than abandoning the rest of the table.
      skipped += chunk.length;
      err(`  ${name}: chunk @${i} (${chunk.length} rows) failed, skipping: ${detail(e)}`);
    }
    if (rows.length > BATCH_ROWS) log(`  ${name}: ${done}/${rows.length}`);
  }
  log(`Inserted ${done} rows into '${name}'${skipped ? ` (${skipped} skipped)` : ''}.`);
}

async function main() {
  log('Aito rep2 / CollectionDb sandbox upload');
  log(`  URL:     ${AITO_URL}`);
  log(`  Env:     ${ENV_NAME} (basedOn ${BASED_ON})`);
  log(`  Key:     ${AITO_API_KEY ? '***configured***' : 'NOT SET'}`);
  if (isDryRun) log('  MODE:    DRY RUN (no writes)');

  if (!AITO_URL) { err('AITO_URL not set'); process.exit(1); }
  if (!AITO_API_KEY) { err('A read-write API key is required'); process.exit(1); }

  const schema = JSON.parse(fs.readFileSync(SCHEMA_FILE, 'utf8')).schema;
  const allTables = CREATE_ORDER.filter(t => schema[t]);
  // include any schema tables not in CREATE_ORDER, appended at the end
  for (const t of Object.keys(schema)) if (!allTables.includes(t)) allTables.push(t);
  const tables = onlyTable ? allTables.filter(t => t === onlyTable) : allTables;
  if (onlyTable && !tables.length) { err(`--only-table='${onlyTable}' not found in schema-rep2.json`); process.exit(1); }

  try {
    await ensureEnv();

    if (!skipSchema && !onlyTable) await wipeEnv();

    if (!skipSchema) {
      for (const t of tables) {
        // when targeting a single table, drop it first so the PUT does not 409
        if (onlyTable && !isDryRun) { try { await api.delete(v2(`/schema/${t}`)); } catch (e) { /* may not exist */ } }
        await createTable(t, schema[t]);
      }
    }

    if (!skipData) {
      const failed = [];
      for (const t of tables) {
        try { await insertData(t); }
        catch (e) { err(`insert '${t}' failed (continuing): ${detail(e)}`); failed.push(t); }
      }
      if (failed.length) log(`Data load finished with failures: ${failed.join(', ')}`);
    }

    log('Done.');
    if (!isDryRun) {
      log(`Query it:  curl -X POST '${v2('/_query')}' -H 'x-api-key: <key>' -d '{"from":"products","limit":3}'`);
    }
  } catch (e) {
    err(`Aborted: ${detail(e)}`);
    process.exit(1);
  }
}

main();
