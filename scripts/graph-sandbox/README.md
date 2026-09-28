# Graph sandbox dataset

> **Synthetic data.** Every company, person, outlet, claim and outcome here
> is generated. The effects in it are planted on purpose (listed below with
> their measured lifts), so nothing in it describes the real world.

A small, deterministic, entirely synthetic knowledge graph for the public
sandbox, so the graph examples in the v2 docs and the playground can run
against real data (and the docs checker can guard them).

```
companies ──< contacts        company_id  (a company's people)
    │ └──< deals ──> contacts champion_id (nullable: no champion identified)
    │ └── parent_id ──> companies         (self-link: subsidiaries)
    └──< claims ──> companies   subject ─relation→ target (typed edges)
            └──< evidence       claim     (sources, some refiled)
```

| collection | rows | key | links |
|---|---|---|---|
| companies | 120 | `company_id` | `parent_id → companies.company_id` (nullable self-link) |
| contacts | 337 | `contact_id` | `company_id → companies.company_id` |
| deals | 800 | `deal_id` | `company_id → companies`, `champion_id → contacts` (nullable) |
| claims | 400 | `claim_id` | `subject → companies`, `target → companies`; `verdict` confirmed / refuted / unreviewed |
| evidence | 1084 | `evidence_id` | `claim → claims.claim_id` |

What it exercises on purpose:

- **keys that are not `id`**, as in real schemas;
- **hubs**: four vendor companies (`co-001`–`co-004`) receive most `uses`
  claims; three parent groups (`co-005`–`co-007`) own the subsidiaries;
- a **nullable link** (`deals.champion_id`) and a **self-link**
  (`companies.parent_id`), the latter a known v2.10.x gap;
- **corroboration**: 138 of 400 claims have evidence refiled by the same
  crawler, so `$length` and `$distinctLength` differ.

## Planted causes, and the lifts they produce

Where a story needs a cause, the cause is in `generate.py`, not just a
correlation. That's the difference from a dataset where child rows pick
their parent uniformly at random, whose links carry no signal about any
outcome. `python3 lifts.py` measures each effect from the written files
alone (never the hidden truth), and these are its numbers for the default
seed:

| story | what the generator does | measured |
|---|---|---|
| corroboration | a claim is true (75%, hidden) or false; true claims are reported by several independent sources, false ones mostly by one crawler that refiles them | P(confirmed): 0.42 with 1 distinct source, 0.89 with ≥ 2, 1.00 with ≥ 3 (base 0.72); ≥ 3 filings from 1 source: 0.22, so `$length` misleads where `$distinctLength` doesn't |
| link prediction | a company's industry picks the vendor it `uses` (35% noise) | lift 1.9–3.3 for the industry's vendor, e.g. software → Hooli 0.76 vs 0.26 |
| linked event → outcome | really using Initech (our integration partner) adds 0.15 to a deal's win probability, really using Globex (a bundled suite) takes 0.15 off; only TRUE claims count | P(won) base 0.49; Initech claim corroborated 0.61, single-source 0.43; Globex corroborated 0.35 |
| champion | an exec champion helps, no champion hurts | P(won) 0.63 with an exec, 0.28 with none |
| segment | a hidden company type drives both its claims and its `segment` (15% label noise) | P(supplier \| subject of a `supplies` claim) 0.51 vs 0.27 |

`companies.initech_use` / `globex_use` (`corroborated` / `single_source` /
`none`) are **precomputed from the claims' corroboration** by `generate.py`,
from the written evidence and never the hidden truth: `corroborated` means
some `uses` claim on that vendor has ≥ 2 distinct sources. No graph query
produces them today. v2.10.x can't filter deals → companies → `$refs` claims
→ `$refs` evidence → `$distinctLength` in one query; that waits for
path-model Stage 3 (nested `$exists` / `$refs` as filters). With the column,
`{"from": "deals", "where": {"company_id.initech_use": "corroborated"},
"predict": "outcome"}` reproduces the 0.61, and `lifts.py` measures the same
number from it. `examples.py` carries the one-query form as a known limit.
When it reports FIXED, replace the column with the query.

`verdict` is the analyst label on 60% of the claims (`confirmed` /
`refuted`); the other 40% are `unreviewed`, which is what a corroboration
view is for.

No real person or company appears: names come from the synthetic namespace
of aito-company-ai's seed generator ("Acme Oy", "Bob Stone"), and there are
no emails, phone numbers or addresses.

## Use

```bash
pip install aitoai                                  # 0.7.0+
python3 generate.py                                 # writes data/ (byte-identical every run)
python3 lifts.py                                    # measure the planted effects, before loading
AITO_API_KEY=<read key> python3 load.py             # dry run: prints the plan
AITO_API_KEY=<read-write key> python3 load.py --apply
AITO_API_KEY=<read key> python3 examples.py         # run the docs examples against it
python3 examples.py --list                          # the queries, without running
```

`load.py` writes only to its own environment (default `graph`, branched off
master), never to master, which serves the v1 docs and demo.aito.ai. The
database's public read key reads every environment, so once loaded the data
is public at `https://shared.aito.ai/db/aito-demo/env/graph/api/v2/`.

`examples.py` holds the graph docs' examples rewritten for this dataset (15)
plus the five known engine gaps from the Graphs page's "Limits as of v2.10.x"
box. Exact expectations are computed from the generated data, so a pass means
the right rows came back, not just a 200. A known gap that starts passing is
reported as FIXED: that line of the Limits box can go.
