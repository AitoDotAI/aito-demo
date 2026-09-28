#!/usr/bin/env python3
"""The graph docs' examples, rewritten against the graph sandbox, with expectations.

Each entry maps one example on /v2/graphs (or a neighbour page) to a query
that runs on this dataset. Where the answer is exact (a count, a filter, a
join), the expectation is computed from the generated data, so a pass means
the engine returned *the right rows*, not merely a 200. Predictions are
checked for their top value, which the planted signal makes stable.

`limit=True` marks a known engine gap (the "Limits as of v2.10.x" box): it is
expected to fail today, and the runner reports it loudly when it starts
passing, which means that line of the box can be deleted.

    AITO_API_KEY=<read key> python3 examples.py [--env graph] [--list]
"""

import argparse
import collections
import json
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent


def load(data_dir):
    return {n: json.loads((Path(data_dir) / f"{n}.json").read_text())
            for n in ["companies", "contacts", "deals", "claims", "evidence"]}


def examples(d):
    co, ct, dl, cl, ev = d["companies"], d["contacts"], d["deals"], d["claims"], d["evidence"]
    by_id = {c["company_id"]: c for c in co}
    subjects = {c["subject"] for c in cl}
    uses_subjects = {c["subject"] for c in cl if c["relation"] == "uses"}
    two_hop = {c["subject"] for c in cl if by_id[c["target"]]["industry"] == "software"}
    hub = collections.Counter(c["target"] for c in cl if c["relation"] == "uses").most_common(1)[0][0]
    typed = {c["subject"] for c in cl if c["relation"] == "uses" and c["target"] == hub}
    per_claim = collections.defaultdict(list)
    for e in ev:
        per_claim[e["claim"]].append(e["source"])
    top_sources = max(len(set(s)) for s in per_claim.values())
    subj0 = sorted(uses_subjects)[0]
    uses_of_subj0 = sorted(c["target"] for c in cl if c["subject"] == subj0 and c["relation"] == "uses")
    no_champion = sum(1 for x in dl if x["champion_id"] is None)
    subsidiaries = sum(1 for c in co if c["parent_id"])
    # generate.py plants it: software companies mostly use Hooli
    software_vendor = next(c["company_id"] for c in co if c["name"].split(" ")[0] == "Hooli")

    def total(n):
        return lambda r: r.get("total") == n or f"total {r.get('total')} != {n}"

    def top(v):
        return lambda r: (r["hits"] and r["hits"][0].get("$value") == v) or \
            f"top {r['hits'][0].get('$value') if r['hits'] else None} != {v}"

    return [
        dict(page="graphs#joins", what="Links are joins: read a linked row's fields",
             ep="_query", body={"from": "deals", "select": ["deal_id", "company_id.name", "company_id.industry"], "limit": 1},
             check=total(len(dl))),
        dict(page="graphs#traversing-forward", what="Forward: a subject's `uses` targets and their industry",
             ep="_query", body={"from": "claims", "where": {"subject": subj0, "relation": "uses"},
                                "select": ["target", "target.industry"], "limit": 50},
             check=lambda r: sorted(h["target"] for h in r["hits"]) == uses_of_subj0 or "targets differ"),
        dict(page="graphs#inverse-links", what="Inverse: companies that are the subject of NO claim",
             ep="_query", body={"from": "companies", "where": {"$refs.claims.subject": {"$exists": False}}, "limit": 0},
             check=total(len(co) - len(subjects))),
        dict(page="graphs#inverse-links", what="Inverse, filtered: companies with a `uses` claim",
             ep="_query", body={"from": "companies", "where": {"$refs.claims.subject": {"$exists": {"relation": "uses"}}}, "limit": 0},
             check=total(len(uses_subjects))),
        dict(page="graphs#inverse-links", what="Project the neighbourhood as arrays",
             ep="_query", body={"from": "companies", "where": {"company_id": subj0},
                                "select": ["name", {"relations": "$refs.claims.subject.relation"},
                                           {"targets": "$refs.claims.subject.target"}]},
             check=lambda r: "uses" in r["hits"][0]["relations"] or "no `uses` in projection"),
        dict(page="graphs#two-hops", what="Two hops: a claim whose target is a software company",
             ep="_query", body={"from": "companies", "where": {"$refs.claims.subject": {"$exists": {"target.industry": "software"}}}, "limit": 0},
             check=total(len(two_hop))),
        dict(page="graphs#two-hops", what="Forward then inverse: deals whose company is the subject of a claim",
             ep="_query", body={"from": "deals", "where": {"company_id.$refs.claims.subject": {"$exists": True}}, "limit": 0},
             check=total(sum(1 for x in dl if x["company_id"] in subjects))),
        dict(page="graphs#typed-edges", what="Typed edge: one claim that is `uses` AND points at the top hub",
             ep="_query", body={"from": "companies", "where": {"$refs.claims.subject": {"$exists": {"relation": "uses", "target": hub}}}, "limit": 0},
             check=total(len(typed))),
        dict(page="graphs#predicting-over-the-graph", what="Node classification: segment from the neighbourhood",
             ep="_predict", body={"from": "companies", "where": {"$refs.claims.subject": {"$exists": {"relation": "uses"}}},
                                  "predict": "segment", "limit": 3},
             check=top("digital")),
        dict(page="graphs#predicting-over-the-graph", what="Edge prediction: which vendor a software subject uses",
             ep="_predict", body={"from": "claims", "where": {"subject.industry": "software", "relation": "uses"},
                                  "predict": "target", "limit": 3},
             check=top(software_vendor)),
        dict(page="graphs#predicting-over-the-graph", what="basedOn: rank candidate targets by their attributes",
             ep="_predict", body={"from": "claims", "where": {"subject.segment": "digital", "relation": "uses"},
                                  "predict": "target", "basedOn": ["industry", "size"], "limit": 3},
             check=lambda r: r["hits"][0]["$value"] in {c["company_id"] for c in co[:4]} or "top is not a vendor hub"),
        dict(page="graphs#provenance-and-explanations", what="Corroboration: rows vs distinct sources per claim",
             ep="_query", body={"from": "claims", "select": ["claim_id",
                                {"evidenceRows": {"$length": "$refs.evidence.claim.source"}},
                                {"sources": {"$distinctLength": "$refs.evidence.claim.source"}}],
                                "orderBy": {"$desc": "sources"}, "limit": 3},
             check=lambda r: r["hits"][0]["sources"] == top_sources or f"top sources != {top_sources}"),
        dict(page="graphs#whats-not-yet-ergonomic", what="Degree: hub in-degree via $length and an alias",
             ep="_query", body={"from": "companies", "select": ["company_id",
                                {"indegree": {"$length": "$refs.claims.target.relation"}}],
                                "orderBy": {"$desc": "indegree"}, "limit": 4},
             check=lambda r: {h["company_id"] for h in r["hits"]} == {c["company_id"] for c in co[:4]} or "top 4 are not the hubs"),
        dict(page="inference (nullable link)", what="Outcome given an exec champion (a nullable link)",
             ep="_predict", body={"from": "deals", "where": {"champion_id.seniority": "exec"}, "predict": "outcome", "limit": 2},
             check=top("won")),
        dict(page="graphs#predicting-over-the-graph", what="Linked evidence -> outcome: corroborated Initech use",
             ep="_predict", body={"from": "deals", "where": {"company_id.initech_use": "corroborated"},
                                  "predict": "outcome", "limit": 2},
             check=top("won")),
        dict(page="graphs#predicting-over-the-graph", what="Linked evidence -> outcome: corroborated Globex use",
             ep="_predict", body={"from": "deals", "where": {"company_id.globex_use": "corroborated"},
                                  "predict": "outcome", "limit": 2},
             check=top("lost")),
        dict(page="query-reference (null)", what="Deals with no champion (the null side of the link)",
             ep="_query", body={"from": "deals", "where": {"champion_id": None}, "limit": 0},
             check=total(no_champion)),
        # --- known gaps: expected to fail today (the Limits box) -----------------
        dict(page="graphs#limits", limit=True, what="Operator inside a same-member object",
             ep="_query", body={"from": "companies", "where": {"$refs.deals.company_id": {"$exists": {"amount": {"$gte": 250000}, "outcome": "won"}}}, "limit": 0},
             check=total(len({x["company_id"] for x in dl if x["amount"] >= 250000 and x["outcome"] == "won"}))),
        dict(page="graphs#limits", limit=True, what="orderBy on a raw $refs path",
             ep="_query", body={"from": "companies", "select": ["company_id"], "orderBy": {"$desc": {"$length": "$refs.claims.target.relation"}}, "limit": 4},
             check=lambda r: {h["company_id"] for h in r["hits"]} == {c["company_id"] for c in co[:4]} or "not sorted by in-degree"),
        dict(page="graphs#limits", limit=True, what="$length of a bare $refs path",
             ep="_query", body={"from": "companies", "select": [{"n": {"$length": "$refs.claims.subject"}}], "limit": 1},
             check=lambda r: "n" in r["hits"][0] or "no n"),
        dict(page="graphs#limits", limit=True, what="Self-link: subsidiaries via parent_id",
             ep="_query", body={"from": "companies", "where": {"parent_id.size": "XL"}, "limit": 0},
             check=total(subsidiaries)),
        dict(page="graphs#limits", limit=True, what="$examine on a link to a non-`id` key",
             ep="_predict", body={"from": "deals", "where": {"company_id": {"$examine": {"at": "co-011", "basedOn": ["industry", "size"]}}},
                                  "predict": "outcome", "limit": 2},
             check=lambda r: bool(r["hits"]) or "no hits"),
    ]


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--db", default="https://shared.aito.ai/db/aito-demo")
    ap.add_argument("--env", default="graph")
    ap.add_argument("--data", default=str(HERE / "data"))
    ap.add_argument("--list", action="store_true", help="print the queries, run nothing")
    args = ap.parse_args()
    exs = examples(load(args.data))
    if args.list:
        for e in exs:
            tag = " [known limit]" if e.get("limit") else ""
            print(f"## {e['what']}{tag}\n{e['page']} · POST /api/v2/{e['ep']}\n{json.dumps(e['body'])}\n")
        return 0

    from aito.v2 import Client, Error
    client = Client(args.db, os.environ["AITO_API_KEY"], env=args.env)
    failed = fixed = 0
    for e in exs:
        try:
            verdict = e["check"](client.request("POST", f"/{e['ep']}", e["body"]))
        except (Error, KeyError, IndexError) as err:
            verdict = f"{type(err).__name__}: {str(err)[:120]}"
        ok = verdict is True
        if e.get("limit"):
            fixed += ok
            print(f"{'FIXED' if ok else 'limit'} {e['what']}" + ("" if ok else f"  ({verdict})"))
        else:
            failed += not ok
            print(f"{'ok   ' if ok else 'FAIL '} {e['what']}" + ("" if ok else f"  ({verdict})"))
    print(f"\n{len(exs)} examples: {failed} failed; {fixed} known limit(s) now pass (remove from the Limits box)")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
