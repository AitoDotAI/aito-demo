#!/usr/bin/env python3
"""Measure the planted signal in the generated files, before anything is loaded.

Reads only what is written to data/, i.e. what a query can see, never the
generator's hidden truth. Each line is a conditional rate, the base rate it
is compared with, the lift (their ratio) and n, so a story the docs or the
agent demo tell about this dataset can be checked against the data: a lift
near 1.0 means there is nothing for a query to find.

    python3 lifts.py [--data data]
"""

import argparse
import json
from collections import defaultdict
from pathlib import Path

from generate import PREFERRED_HUB


def rate(rows, pred):
    rows = list(rows)
    return (sum(1 for r in rows if pred(r)) / len(rows), len(rows)) if rows else (float("nan"), 0)


def line(label, cond, base):
    (p, n), (b, _) = cond, base
    print(f"  {label:46} {p:6.2f}  vs {b:5.2f}  lift {p / b if b else float('nan'):5.2f}  n={n}")


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--data", default=str(Path(__file__).with_name("data")))
    d = Path(ap.parse_args().data)
    load = lambda name: json.loads((d / f"{name}.json").read_text())
    companies, contacts, deals = load("companies"), load("contacts"), load("deals")
    claims, evidence = load("claims"), load("evidence")

    company = {c["company_id"]: c for c in companies}
    contact = {c["contact_id"]: c for c in contacts}
    hub_id = {c["name"].split(" ")[0]: c["company_id"] for c in companies
              if c["name"].split(" ")[0] in PREFERRED_HUB.values() and len(c["name"].split(" ")) == 2}
    sources, filings = defaultdict(set), defaultdict(int)
    for e in evidence:
        sources[e["claim"]].add(e["source"])
        filings[e["claim"]] += 1
    distinct = lambda cl: len(sources[cl["claim_id"]])

    print("corroboration: P(confirmed) among reviewed claims")
    reviewed = [cl for cl in claims if cl["verdict"] != "unreviewed"]
    confirmed = lambda cl: cl["verdict"] == "confirmed"
    base = rate(reviewed, confirmed)
    line("1 distinct source ($distinctLength = 1)", rate([c for c in reviewed if distinct(c) == 1], confirmed), base)
    line(">= 2 distinct sources", rate([c for c in reviewed if distinct(c) >= 2], confirmed), base)
    line(">= 3 distinct sources", rate([c for c in reviewed if distinct(c) >= 3], confirmed), base)
    line(">= 3 filings, 1 source ($length misleads)",
         rate([c for c in reviewed if filings[c["claim_id"]] >= 3 and distinct(c) == 1], confirmed), base)

    print("link prediction: P(uses target = the industry's vendor), uses->vendor claims")
    to_hub = [cl for cl in claims if cl["relation"] == "uses" and cl["target"] in hub_id.values()]
    for industry, hub in sorted(PREFERRED_HUB.items()):
        is_hub = lambda cl, h=hub_id[hub]: cl["target"] == h
        line(f"{industry} -> {hub}",
             rate([c for c in to_hub if company[c["subject"]]["industry"] == industry], is_hub),
             rate(to_hub, is_hub))

    print("deal outcome: P(won)")
    won = lambda dl: dl["outcome"] == "won"
    base = rate(deals, won)
    for hub in ("Initech", "Globex"):
        users = {cl["subject"] for cl in claims if cl["relation"] == "uses" and cl["target"] == hub_id[hub]}
        corroborated = {cl["subject"] for cl in claims if cl["relation"] == "uses"
                        and cl["target"] == hub_id[hub] and distinct(cl) >= 2}
        line(f"company claimed to use {hub}", rate([x for x in deals if x["company_id"] in users], won), base)
        line(f"  ... claim corroborated (>= 2 sources)",
             rate([x for x in deals if x["company_id"] in corroborated], won), base)
        line(f"  ... claim single-source only",
             rate([x for x in deals if x["company_id"] in users - corroborated], won), base)
    line("exec champion", rate([x for x in deals if x["champion_id"]
                                and contact[x["champion_id"]]["seniority"] == "exec"], won), base)
    line("no champion", rate([x for x in deals if not x["champion_id"]], won), base)

    print("segment: P(segment = supplier)")
    suppliers = {cl["subject"] for cl in claims if cl["relation"] == "supplies"}
    is_supplier = lambda c: c["segment"] == "supplier"
    line("subject of a `supplies` claim", rate([c for c in companies if c["company_id"] in suppliers], is_supplier),
         rate(companies, is_supplier))


if __name__ == "__main__":
    main()
