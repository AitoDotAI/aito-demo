# Rep2 / API v2 Migration

This branch (`feature/rep2`) sets up an alternative path for running
the demo against Aito's **Rep2** storage layer (`CollectionDb`) and
**API v2** endpoints, side by side with the current Rep1 / v1 path.

The two paths share the same Aito instance (URL + API key) but live
in different *envs* — see
[Aito envs documentation](https://aito.ai/docs/api/envs/) for the
underlying mechanism. The default `master` env stays on Rep1 / v1; a
new `rep2` env is created and populated with collection-typed schema
+ identical data, reachable at `/env/rep2/api/v2/...`.

## Why an alternative

Rep2 is a different storage / examination engine. Schema declares
`"type": "collection"` instead of `"type": "table"`, and the v2
endpoints (`/api/v2/_predict`, `_recommend`, `_search`, etc.) go
through a different query dispatch (`JsonQuery2` / `GenericQuery2`).

Running the demo on Rep2 is the cleanest way to validate that the
demo's actual query payloads work end-to-end on the new stack. It's
also the migration path for the production demo once Rep2 reaches
parity.

## Setup

### 1. Create the env and upload data

```bash
node upload-data-rep2.js
```

By default this:

1. Lists existing envs against `AITO_URL` (defaulting to `config.aito.url`).
2. If `rep2` doesn't exist, `POST /api/v1/_envs` with
   `{name: "rep2", basedOn: "env.master"}` to create it.
3. `PUT /env/rep2/api/v2/schema` with `src/data/schema-rep2.json`
   (same schema as `schema.json`, but every table is
   `"type": "collection"`).
4. Uploads each table:
   * JSON-array files via `POST /env/rep2/api/v2/data/{table}/batch`
   * NDJSON files (currently `impressions.ndjson`) via
     `POST /env/rep2/api/v2/data/{table}/stream` (one document per
     line, no array wrapper).

Useful flags:

```bash
# Inspect what would happen without making any HTTP calls
node upload-data-rep2.js --dry-run

# Re-upload data without re-creating the env
node upload-data-rep2.js --skip-env

# Re-upload only one table
node upload-data-rep2.js --only-table=products

# Skip the schema PUT (e.g. just refresh data)
node upload-data-rep2.js --skip-schema
```

Env vars:

| Variable | Default | Purpose |
|:--|:--|:--|
| `AITO_URL` | from `src/config.js` | base URL of the Aito instance |
| `AITO_API_KEY` | from `src/config.js` | read API key |
| `AITO_READ_WRITE_KEY` | falls back to `AITO_API_KEY` | rw key |
| `AITO_REP2_ENV` | `rep2` | name of the env to create / use |
| `AITO_REP2_BASED_ON` | `env.master` | env to clone from at create time |

### 2. Run the demo against the rep2 env

The frontend reads `REACT_APP_USE_REP2` to decide which path to
target:

```bash
# Default: Rep1 / v1 / master env
npm start

# Rep2 / v2 / rep2 env
REACT_APP_USE_REP2=true npm start
```

`src/config.js` builds `config.aito.apiBase` from the toggle:

```
REACT_APP_USE_REP2=false → https://shared.aito.ai/db/aito-demo/api/v1
REACT_APP_USE_REP2=true  → https://shared.aito.ai/db/aito-demo/env/rep2/api/v2
```

Override the env name explicitly with `REACT_APP_AITO_ENV=<name>` if
needed (e.g. for a feature-branch sandbox env).

## Migration status (frontend)

Each demo query module currently hardcodes
`${config.aito.url}/api/v1/...`. Migration is incremental: replace
those with `${config.aito.apiBase}/...` so the env-var toggle takes
effect.

| Module | Endpoint | Migrated to `apiBase`? |
|:--|:--|:--|
| `src/01-recommend.js` | `_recommend` | ✅ |
| `src/02-autocomplete.js` | `_query` | — |
| `src/03-search.js` | `_search` | — |
| `src/04-get-tag-suggestions.js` | `_match` / `_predict` | — |
| `src/05-autofill.js` | `_predict` | — |
| `src/06-prompt.js` | `_predict` / `_match` | — |
| `src/07-relate.js` | `_relate` | — |
| `src/08-predict-invoice.js` | `_predict` | — |
| `src/09-product.js` | various | — |
| `src/10-get-distinct-values.js` | `_query` | — |
| `src/11-evaluate.js` | `_evaluate` | — |
| `src/12-price-estimation.js` | `_predict` / `_estimate` | — |

Modules that need attention beyond the URL flip:

- **`exclusiveness: false`** (used by some `_predict` payloads): not
  recognised by v2's strict Query2 parser. Drop the field for the v2
  path; default behaviour is the same.
- **`_evaluate` / `_estimate` / `_aggregate`**: not yet operational
  against CollectionDb-typed tables on the server side (rep1
  dispatch hardcodes `aito.master.get[TableDb](...)`). Tracked
  separately. For now, modules calling these endpoints will get a
  400 against the `rep2` env.
- **`_similarity` (endpoint)**: deliberately not exposed on v2.
  Similarity scoring on v2 is an in-query operator (`$similarity`
  inside `_query`'s `orderBy` / `select` / `where`). Operator
  wiring on Query2 is the v2 deliverable that replaces the
  endpoint; tracked in `aito-core`'s gap-analysis doc. Demo
  modules that called `/_similarity` will need to migrate to
  `_query` once the operator lands.
- **`_match`**: superseded by `_predict` (target-property priors do
  the same job). Not wired on v2.

## Known gaps when running on Rep2

These are server-side limitations being tracked in the
`feature/rep2-api2-gap-analysis` branch on `aito-core`:

- `_evaluate` / `_estimate` / `_aggregate` against CollectionDb
  tables return `400 failed to open '<table>'` — the v1 query
  dispatch is rep1-only. `_similarity` doesn't exist on v2 at all
  (operator path replaces it).
- `_recommend` with a `goal` proposition can run very slow on the
  full impressions dataset (16+ minutes observed). Demo flows
  hitting this may want a backoff / fallback.
- Many `$`-propositions are not yet implemented on v2 and will
  return `400 Unsupported proposition`. The strict-fail behaviour is
  intentional — silently ignoring an unsupported op would produce
  semantically wrong results.

## Tearing it down

The rep2 env lives independently of master:

```bash
# Remove the env entirely (frees its storage)
curl -X DELETE \
  -H "x-api-key: $AITO_API_KEY" \
  $AITO_URL/api/v1/_envs/rep2
```

Master env is unaffected.
