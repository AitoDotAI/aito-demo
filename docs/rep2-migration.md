# Rep2 / API v2 Migration

The demo runs against either of two paths: an alternative path for running
the demo against Aito's **Rep2** storage layer (`CollectionDb`) and
**API v2** endpoints, side by side with the current Rep1 / v1 path.

The two paths share the same Aito instance (URL + API key) but live
in different *envs* — see
[Aito envs documentation](https://aito.ai/docs/api/envs/) for the
underlying mechanism. The default `master` env stays on Rep1 / v1; a
new `v2` env is created and populated with collection-typed schema
+ identical data, reachable at `/env/v2/api/v2/...`.

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
node upload-data-v2.js
```

By default this:

1. Lists existing envs against `AITO_URL` (defaulting to `config.aito.url`).
2. If `v2` doesn't exist, `POST /api/v1/_envs` with
   `{name: "v2", basedOn: "env.master"}` to create it.
3. `PUT /env/v2/api/v2/schema/{table}` with `src/data/schema-rep2.json`
   (same schema as `schema.json`, but every table is
   `"type": "collection"`).
4. Uploads each table:
   * JSON-array files via `POST /env/v2/api/v2/data/{table}/batch`
   * NDJSON files (currently `impressions.ndjson`) via
     `POST /env/v2/api/v2/data/{table}/stream` (one document per
     line, no array wrapper).

Useful flags:

```bash
# Inspect what would happen without making any HTTP calls
node upload-data-v2.js --dry-run

# Re-upload data without re-creating the env
node upload-data-v2.js --skip-env

# Re-upload only one table
node upload-data-v2.js --only-table=products

# Skip the schema PUT (e.g. just refresh data)
node upload-data-v2.js --skip-schema
```

Env vars:

| Variable | Default | Purpose |
|:--|:--|:--|
| `AITO_URL` | from `src/config.js` | base URL of the Aito instance |
| `AITO_API_KEY` | from `src/config.js` | read API key |
| `AITO_READ_WRITE_KEY` | falls back to `AITO_API_KEY` | rw key |
| `AITO_ENV` | `v2` | name of the env to create / use |
| `AITO_BASED_ON` | `env.master` | env to clone from at create time |

### 2. Run the demo against the v2 env

The frontend reads `REACT_APP_USE_REP2` to decide which path to
target:

```bash
# Default: Rep1 / v1 / master env
npm start

# Rep2 / v2 / v2 env
REACT_APP_USE_REP2=true npm start
```

`src/config.js` builds `config.aito.apiBase` from the toggle:

```
REACT_APP_USE_REP2=false → https://shared.aito.ai/db/aito-demo/api/v1
REACT_APP_USE_REP2=true  → https://shared.aito.ai/db/aito-demo/env/v2/api/v2
```

Override the env name explicitly with `REACT_APP_AITO_ENV=<name>` if
needed (e.g. for a feature-branch sandbox env).

## Migration status (frontend)

**Complete.** All 13 API modules route through `config.aito.apiBase`, so
`REACT_APP_USE_REP2` switches every call. Response differences between the
two API versions are normalised at the transport boundary by
`src/aito-client.js` / `src/aito-compat.js`, so the pages read v1 field names
on either version.

Verified by `npm run v2:parity`, which replays every query shape against both
versions and diffs the payloads: **0 breaks, 0 unexplained gaps**. The captured
run is `docs/v2-parity.json`.

### The default is still v1

`REACT_APP_USE_REP2` defaults to false, so the production demo continues to
serve `/api/v1` against `master`. Flipping the default is a separate decision:
the app works on v2, but v2 returns different ML values (see below), and that
changes what the demo shows.

## Differences that required a code change

| What | v1 | v2 | Handled by |
|:--|:--|:--|:--|
| `_aggregate` / `_estimate` / `_evaluate` envelope | bare | `{kind, data}` | `aito-compat` unwraps |
| prediction hit value | `feature` | `$value` | `aito-compat` aliases |
| prediction hit `field` | present | absent | `aito-compat` restores from the request |
| `_estimate` result field | `estimate` | `value` | `estimateSelect()` |
| non-exclusive predict | `exclusiveness: false` | `field.$feature` | `nonExclusivePredict()` |
| `_relate` argument | `"field"` or `{obj}` | `["field"]` | array form, accepted by both |
| `$matches` in select | supported | 400 | dropped; nothing read it |
| `related` value | `{$has: v}` | sometimes bare `v` | `aito-compat` wraps |

`src/__tests__/api/v2-compat-lint.test.js` fails the build if any of the
v2-rejected forms is reintroduced — none of them errors on v1, so without it a
regression would only surface when someone flips the toggle.

## Known gaps when running on v2

Measured against the live env, not inherited from earlier notes:

- **`_estimate`'s default (KNN) model disagrees with v1.** Same data, same
  query: v1 `0.5653166966475579`, v2 `1.5646392649872496`. With
  `model: "regression"` the two are byte-identical (`0.5653166966475586`), so
  this is isolated to the default estimator. Filed as a core issue; **not**
  worked around here.
- **`_estimate`'s regression explanation lost field attribution.** v1 returns
  `{type: "exponent", power: {terms: [...]}}` with a per-field contribution;
  v2 returns `{type: "regression", neighbours: [...]}` with none. The Pricing
  page's breakdown tooltip is therefore unavailable on v2 — the estimate still
  renders, the tooltip is simply not offered.
- **`_evaluate` metrics are not comparable across versions.** `baseAccuracy`
  differs (products 0.0909 vs 0.1290), and it depends only on the test split
  and class distribution — so `$index` orders rows differently under Rep1 and
  Rep2. `meanRank` is also 0-based on v1 and 1-based on v2.
- **`_relate` drops `ps` and `relation`, and `info` is a number rather than an
  object.** The demo reads only `lift` and `related`, so this is accepted.
- **`_similarity` (endpoint)** — 404 on v2 by design. Similarity is an
  in-query operator there (`$similarity` in `orderBy` / `select` / `where`),
  which is what the demo already uses.
- **Predictions differ in value**, as expected between engines. This is the
  bulk of what `npm run v2:parity` reports and is not a defect.

### Previously listed here and no longer true

These were carried over from an early gap analysis and were **re-measured as
working**:

- `_evaluate`, `_estimate`, `_aggregate`, `_match` — all return 200 against
  collection-typed tables. The old note claimed `400 failed to open '<table>'`.
- `_recommend` performance — the old note reported 16+ minutes on the full
  impressions dataset. Measured now: **v2 296 ms vs v1 1411 ms**, i.e. v2 is
  the faster path.

## Tearing it down

The v2 env lives independently of master:

```bash
# Remove the env entirely (frees its storage)
curl -X DELETE \
  -H "x-api-key: $AITO_API_KEY" \
  $AITO_URL/api/v1/_envs/v2
```

Master env is unaffected.
