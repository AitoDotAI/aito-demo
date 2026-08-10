#!/usr/bin/env node

/**
 * Aito.ai Rep2 / API v2 Data Upload Script
 *
 * Sister script to `upload-data.js`. Same data, but the schema is the
 * Rep2 / collection-typed variant (`schema-rep2.json`) and everything
 * goes through `/env/{envName}/api/v2/...` so the original (Rep1)
 * master env is left untouched.
 *
 * Lifecycle:
 *
 *   1. Ensure env exists (POST /api/v1/_envs with `basedOn: env.master`,
 *      so the env is wired into the same Aito instance and has its own
 *      independent storage). Idempotent — listing the envs first.
 *   2. PUT /env/{envName}/api/v2/schema with the rep2 schema.
 *   3. POST data:
 *        - JSON arrays → /env/{envName}/api/v2/data/{table}/batch
 *        - NDJSON      → /env/{envName}/api/v2/data/{table}/stream
 *
 * The NDJSON path is the v2 equivalent of v1's `/data/{table}/file`
 * upload — `streamInsert` splits the body by newline and parses each
 * line as a JSON Document. No multipart, no Content-Length games.
 *
 * Usage:
 *   node upload-data-rep2.js [--dry-run] [--skip-env] [--skip-schema] [--only-table=name]
 *
 * Env vars (mirrors upload-data.js):
 *   AITO_URL              base URL of the Aito instance
 *   AITO_API_KEY          read API key
 *   AITO_READ_WRITE_KEY   read-write API key (falls back to AITO_API_KEY)
 *   AITO_REP2_ENV         env name (default 'rep2')
 *   AITO_REP2_BASED_ON    env to base on (default 'env.master')
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const config = require('./src/config.js');

// CLI flags
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const skipEnv = args.includes('--skip-env');
const skipSchema = args.includes('--skip-schema');
const onlyTable = args.find(a => a.startsWith('--only-table='))?.split('=')[1];

// Configuration
const AITO_URL = process.env.AITO_URL || config.aito.url;
const AITO_API_KEY =
  process.env.AITO_READ_WRITE_KEY || process.env.AITO_API_KEY || config.aito.apiKey;
const ENV_NAME = process.env.AITO_REP2_ENV || 'rep2';
const ENV_BASED_ON = process.env.AITO_REP2_BASED_ON || 'env.master';

const DATA_DIR = path.join(__dirname, 'src/data');
// 8 MB ceiling for /batch posts; matches upload-data.js's threshold.
const MAX_BATCH_SIZE = 8 * 1024 * 1024;

const apiClient = axios.create({
  timeout: 240000, // 4 min — Rep2 first-batch + segment-write can be slow
  headers: {
    'x-api-key': AITO_API_KEY,
    'Content-Type': 'application/json',
  },
  // Don't reject on 4xx so we can surface meaningful messages from
  // the server's error JSON bodies instead of axios's generic throw.
  validateStatus: () => true,
});

// `master` env paths use unprefixed `/api/...`; named envs use the
// `/env/{name}/api/...` shape per `EnvRouting`.
function pathPrefix(envName) {
  if (!envName || envName === 'env.master' || envName === 'master') {
    return '';
  }
  return `/env/${envName}`;
}

const ENDPOINTS = {
  // /_envs is admin-level — never under /env/{name}.
  envs: '/api/v1/_envs',
  v2Schema: (envName) => `${pathPrefix(envName)}/api/v2/schema`,
  v2Batch: (envName, table) => `${pathPrefix(envName)}/api/v2/data/${table}/batch`,
  v2Stream: (envName, table) => `${pathPrefix(envName)}/api/v2/data/${table}/stream`,
};

// Same per-table source files as upload-data.js. The choice between
// /batch and /stream is a function of file shape (array vs NDJSON),
// not file size — /batch will reject anything > MAX_BATCH_SIZE later.
const TABLE_CONFIG = {
  users: { file: 'users.json', method: 'batch' },
  products: { file: 'products.json', method: 'batch' },
  visits: { file: 'visits.json', method: 'batch' },
  contexts: { file: 'contexts.json', method: 'batch' },
  // NDJSON (one document per line) — natural fit for /stream.
  impressions: { file: 'impressions.ndjson', method: 'stream' },
  prompts: { file: 'prompts.json', method: 'batch' },
  questions: { file: 'questions.json', method: 'batch' },
  answers: { file: 'answers.json', method: 'batch' },
  employees: { file: 'employees.json', method: 'batch' },
  glCodes: { file: 'glCodes.json', method: 'batch' },
  invoices: { file: 'invoices.json', method: 'batch' },
  price_history: { file: 'price_history.json', method: 'batch' },
};

const UPLOAD_ORDER = [
  // Tables without inbound links first, then their dependents. The
  // server doesn't strictly require this — schema PUT creates all
  // tables up-front — but it makes upload progress easier to read.
  'users', 'products', 'employees', 'glCodes', 'answers',
  'visits', 'contexts', 'impressions', 'prompts', 'questions',
  'invoices', 'price_history',
];

function log(msg, ...rest) {
  console.log(`[${new Date().toISOString()}] ${msg}`, ...rest);
}
function error(msg, ...rest) {
  console.error(`[${new Date().toISOString()}] ERROR: ${msg}`, ...rest);
}
function formatBytes(b) {
  if (b === 0) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${(b / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/** Idempotent env create. */
async function ensureEnv(envName) {
  if (skipEnv) {
    log(`Skipping env setup (--skip-env); assuming '${envName}' already exists.`);
    return true;
  }
  if (envName === 'env.master' || envName === 'master') {
    error(`Refusing to use master env directly. Set AITO_REP2_ENV to a non-master name.`);
    return false;
  }

  // List first; create only if missing.
  const listUrl = `${AITO_URL}${ENDPOINTS.envs}`;
  const listRes = await apiClient.get(listUrl);
  if (listRes.status !== 200) {
    error(`Failed to list envs (${listRes.status}):`, listRes.data);
    return false;
  }
  const existing = (listRes.data?.envs || []).map(e => e.name);
  if (existing.includes(envName)) {
    log(`✓ Env '${envName}' already exists.`);
    return true;
  }
  if (isDryRun) {
    log(`DRY RUN: would create env '${envName}' basedOn '${ENV_BASED_ON}'.`);
    return true;
  }

  log(`Creating env '${envName}' basedOn '${ENV_BASED_ON}'...`);
  const createRes = await apiClient.post(listUrl, {
    name: envName,
    basedOn: ENV_BASED_ON,
  });
  if (createRes.status >= 200 && createRes.status < 300) {
    log(`✓ Env '${envName}' created.`);
    return true;
  }
  error(`✗ Env create failed (${createRes.status}):`, createRes.data);
  return false;
}

async function uploadSchema(envName) {
  if (skipSchema) {
    log('Skipping schema upload (--skip-schema)');
    return true;
  }
  const schemaPath = path.join(DATA_DIR, 'schema-rep2.json');
  if (!fs.existsSync(schemaPath)) {
    error(`schema-rep2.json not found at ${schemaPath}`);
    return false;
  }
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

  if (isDryRun) {
    log('DRY RUN: would PUT schema to', ENDPOINTS.v2Schema(envName),
      'with tables:', Object.keys(schema.schema || {}));
    return true;
  }

  log(`Uploading schema-rep2.json to ${ENDPOINTS.v2Schema(envName)}...`);
  const res = await apiClient.put(`${AITO_URL}${ENDPOINTS.v2Schema(envName)}`, schema);
  if (res.status >= 200 && res.status < 300) {
    log('✓ Schema uploaded.', res.data);
    return true;
  }
  error(`✗ Schema upload failed (${res.status}):`, res.data);
  return false;
}

async function uploadBatch(envName, tableName, data) {
  const url = `${AITO_URL}${ENDPOINTS.v2Batch(envName, tableName)}`;
  if (isDryRun) {
    log(`DRY RUN: would POST ${data.length} records to ${url}`);
    return true;
  }
  log(`POST ${data.length} records → ${url}`);
  const res = await apiClient.post(url, data);
  if (res.status >= 200 && res.status < 300) {
    log(`✓ ${data.length} records inserted into ${tableName}.`);
    return true;
  }
  error(`✗ Batch upload failed for ${tableName} (${res.status}):`, res.data);
  return false;
}

async function uploadStream(envName, tableName, ndjsonBody) {
  const url = `${AITO_URL}${ENDPOINTS.v2Stream(envName, tableName)}`;
  const lineCount = ndjsonBody.split('\n').filter(l => l.trim().length > 0).length;
  if (isDryRun) {
    log(`DRY RUN: would POST ${lineCount} NDJSON rows (${formatBytes(Buffer.byteLength(ndjsonBody))}) to ${url}`);
    return true;
  }
  log(`POST ${lineCount} NDJSON rows (${formatBytes(Buffer.byteLength(ndjsonBody))}) → ${url}`);
  // Stream endpoint expects raw text body, not application/json.
  const res = await apiClient.post(url, ndjsonBody, {
    headers: { 'Content-Type': 'application/x-ndjson' },
  });
  if (res.status >= 200 && res.status < 300) {
    log(`✓ ${lineCount} NDJSON rows inserted into ${tableName}.`);
    return true;
  }
  error(`✗ Stream upload failed for ${tableName} (${res.status}):`, res.data);
  return false;
}

/** Convert a JSON-array file to NDJSON in-memory. */
function jsonArrayToNdjson(filePath) {
  const arr = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!Array.isArray(arr)) {
    throw new Error(`${filePath}: expected JSON array, got ${typeof arr}`);
  }
  return arr.map(o => JSON.stringify(o)).join('\n');
}

async function uploadTable(envName, tableName) {
  const cfg = TABLE_CONFIG[tableName];
  if (!cfg) {
    error(`Unknown table: ${tableName}`);
    return false;
  }
  const filePath = path.join(DATA_DIR, cfg.file);
  if (!fs.existsSync(filePath)) {
    error(`Data file missing: ${filePath}`);
    return false;
  }

  const stats = fs.statSync(filePath);
  log(`-- ${tableName} (${formatBytes(stats.size)}, method=${cfg.method}) --`);

  if (cfg.method === 'stream') {
    // NDJSON files go straight through.
    const body = fs.readFileSync(filePath, 'utf8');
    return await uploadStream(envName, tableName, body);
  }

  // /batch path: read JSON array, optionally fall through to /stream
  // if it's too big for the 8MB limit.
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!Array.isArray(data)) {
    error(`${filePath}: expected JSON array, got ${typeof data}`);
    return false;
  }
  const dataSize = Buffer.byteLength(JSON.stringify(data), 'utf8');
  if (dataSize > MAX_BATCH_SIZE) {
    log(`Payload ${formatBytes(dataSize)} exceeds /batch limit; falling back to /stream.`);
    const ndjson = jsonArrayToNdjson(filePath);
    return await uploadStream(envName, tableName, ndjson);
  }
  return await uploadBatch(envName, tableName, data);
}

async function main() {
  log('Starting Aito Rep2 upload...');
  log('  Aito URL:    ', AITO_URL);
  log('  API Key:     ', AITO_API_KEY ? '***configured***' : 'NOT SET');
  log('  Env name:    ', ENV_NAME);
  log('  Based on:    ', ENV_BASED_ON);
  log('  Data dir:    ', DATA_DIR);
  log('  Schema file: ', 'src/data/schema-rep2.json');

  if (!AITO_API_KEY) {
    error('No API key set; aborting.');
    process.exit(1);
  }

  if (!(await ensureEnv(ENV_NAME))) {
    process.exit(1);
  }
  if (!(await uploadSchema(ENV_NAME))) {
    error('Schema upload failed, aborting data upload.');
    process.exit(1);
  }

  const tables = onlyTable
    ? [onlyTable]
    : UPLOAD_ORDER.filter(t => TABLE_CONFIG[t]);

  log(`Uploading ${tables.length} tables: ${tables.join(', ')}`);

  let okCount = 0;
  let failCount = 0;
  for (const table of tables) {
    if (await uploadTable(ENV_NAME, table)) okCount++;
    else failCount++;
  }

  log(`Done. ${okCount} table(s) succeeded, ${failCount} failed.`);
  process.exit(failCount === 0 ? 0 : 1);
}

main().catch(err => {
  error('Unhandled error:', err);
  process.exit(1);
});
