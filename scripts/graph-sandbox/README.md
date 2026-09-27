# Graph sandbox dataset

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
| claims | 400 | `claim_id` | `subject → companies`, `target → companies` |
| evidence | 966 | `evidence_id` | `claim → claims.claim_id` |

What it exercises on purpose:

- **keys that are not `id`**, as in real schemas;
- **hubs**: four vendor companies (`co-001`–`co-004`) receive most `uses`
  claims; three parent groups (`co-005`–`co-007`) own the subsidiaries;
- a **nullable link** (`deals.champion_id`) and a **self-link**
  (`companies.parent_id`), the latter a known v2.10.x gap;
- **corroboration**: 97 of 400 claims have evidence refiled by the same
  crawler, so `$length` and `$distinctLength` differ.

Planted, honest signal: a hidden company type drives both the claims a
company is the subject of and its `segment` (15% label noise), and a deal's
`outcome` follows the company's industry and size and the champion's
seniority (win rate 0.35 with no champion, about 0.68 with an exec).

No real person or company appears: names come from the synthetic namespace
of aito-company-ai's seed generator ("Acme Oy", "Bob Stone"), and there are
no emails, phone numbers or addresses.

## Use

```bash
pip install aitoai                                  # 0.7.0+
python3 generate.py                                 # writes data/ (byte-identical every run)
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
