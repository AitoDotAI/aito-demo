#!/usr/bin/env python3
"""Generate the graph sandbox dataset: companies <- contacts / deals / claims <- evidence.

Deterministic: the same seed always writes byte-identical files, so the docs
can print numbers the dataset really produces. Every name is from the
synthetic namespace below (placeholder companies such as "Acme Oy", people
such as "Bob Stone"), the same convention as aito-company-ai's seed
generator, so no real person or company appears. There are no emails,
phone numbers or addresses.

The shape exercises what the graph docs teach, including the known edges:

- keys are not called `id` (company_id, contact_id, ...), which is what
  real schemas look like and what `$examine` does not yet support;
- a nullable link (deals.champion_id: no champion identified);
- hubs: four vendor companies that most `uses` claims point at, and three
  parent groups that own several subsidiaries;
- a self-link (companies.parent_id -> companies.company_id), which v2.10.x
  does not yet traverse;
- claims backed by evidence from several sources, some filed more than once
  by the same crawler, so `$length` and `$distinctLength` differ.

It also carries planted, honest signal so predictions have something to
find, and where a story needs a cause the cause is in the generator, not
only the correlation:

- a company's segment follows the claims it is the subject of;
- which vendor a company `uses` follows its industry (link prediction);
- a claim is true or false (hidden), and that decides its evidence: a true
  claim is reported by several independent sources, a false one mostly by
  a single crawler that refiles it. So `$distinctLength` over the sources
  tracks truth and `$length` does not. Analysts have reviewed 60% of the
  claims (`verdict`), the rest are `unreviewed`;
- a deal's outcome follows the company's industry and size, whether a
  senior champion exists, and what the company really uses: our integration
  partner Initech helps, the bundled Globex suite hurts. Only TRUE `uses`
  claims move the outcome, so an uncorroborated edge is weaker evidence.

The data is SYNTHETIC and says so; `lifts.py` measures every planted
effect from the written files before anything is loaded.

    python3 generate.py [--out data] [--seed 20260927]
"""

import argparse
import json
import random
from datetime import date, timedelta
from pathlib import Path

# The synthetic namespace (from aito-company-ai scripts/generate_seed.py).
FIRST_NAMES = [
    "Bob", "Alice", "Carol", "Dave", "Eve", "Frank", "Grace", "Heidi",
    "Ivan", "Judy", "Mallory", "Niaj", "Olivia", "Peggy", "Rupert", "Sybil",
    "Trent", "Victor", "Walter", "Yvonne", "Zara", "Quinn", "Mona", "Hank",
]
SURNAMES = [
    "Stone", "Rivers", "Banks", "Fields", "Hill", "Lake", "Brooks", "Frost",
    "Vale", "Marsh", "Reed", "Cross", "Day", "Knight", "Wells", "Pike",
    "Lane", "Ford", "Snow", "Gray",
]
MOCK_COMPANIES = [
    "Acme", "Globex", "Initech", "Umbrella", "Hooli", "Stark", "Wayne",
    "Wonka", "Cyberdyne", "Soylent", "Vandelay", "Tyrell", "Aperture",
    "Oscorp", "Nakatomi", "Weyland", "Yoyodyne", "Encom", "Abstergo",
    "Gringotts", "Duff", "Bluth", "Sterling", "Dunder", "Pendant",
    "Prestige", "Monarch", "Vehement", "Pied", "Raviga", "Initrode",
    "Mooby", "Sirius", "Spectre", "Virtucon", "Rekall", "Omni", "Tessier",
    "Delos", "Genco", "Sabre", "Lumon", "Zorin", "Krusty", "Strickland",
    "Lacuna", "Pearson", "Hardman", "Gekko", "Vance", "Pierce", "Hanso",
    "Widmore", "Slate", "Atlas", "Vertex", "Nimbus", "Onyx", "Cobalt", "Pymt",
]
SUFFIX_BY_COUNTRY = {
    "Finland": "Oy", "Sweden": "AB", "Estonia": "OÜ", "Germany": "GmbH", "Netherlands": "BV",
}
COUNTRIES = ["Finland"] * 5 + ["Sweden", "Sweden", "Estonia", "Germany", "Netherlands"]
DIVISIONS = ["", " Group", " Labs", " Systems"]

INDUSTRIES = ["manufacturing", "retail", "logistics", "software", "finance", "healthcare"]
SIZES = ["S", "M", "L", "XL"]
ROLES = [("CEO", "exec"), ("CFO", "exec"), ("CTO", "exec"), ("Head of Data", "manager"),
         ("Controller", "manager"), ("Procurement Lead", "manager"),
         ("Analyst", "ic"), ("Engineer", "ic"), ("Buyer", "ic")]
PRODUCTS = ["ledger", "forecasting", "matching", "analytics"]
RELATIONS = ["uses", "partner_of", "competes_with", "supplies", "acquired"]
# Fictional outlets and crawlers; `crawler:*` sources refile claims.
SOURCES = ["Northwind Times", "Ledger Daily", "Baltic Tech Wire", "Harbor Business Review",
           "crawler:alpha", "crawler:beta", "crm:notes", "company-website"]

SEGMENTS = ["digital", "supplier", "traditional"]
#: relation weights (uses, partner_of, competes_with, supplies, acquired) by hidden kind
RELATION_WEIGHTS = {
    "digital": [6, 2, 1, 0.5, 0.5],
    "supplier": [1, 1, 1, 6, 0.5],
    "traditional": [0.5, 2, 3, 1, 1],
}

VENDOR_HUBS = ["Hooli", "Initech", "Cyberdyne", "Globex"]
#: the vendor each industry mostly `uses` (link prediction has a cause to find)
PREFERRED_HUB = {"manufacturing": "Cyberdyne", "logistics": "Globex", "retail": "Globex",
                 "finance": "Initech", "healthcare": "Initech", "software": "Hooli"}
#: what really using a vendor does to a deal's win probability
HUB_EFFECT_ON_WIN = {"Initech": 0.15, "Globex": -0.15}
PARENT_GROUPS = ["Umbrella", "Weyland", "Tyrell"]

AS_OF = date(2026, 9, 1)  # fixed, so dates never depend on the run date


def company_rows(rng, n):
    names, rows = [], []
    for division in DIVISIONS:
        for base in MOCK_COMPANIES:
            names.append((base, division))
    rng.shuffle(names)
    # the hubs and parent groups must exist with their plain names
    wanted = [(b, "") for b in VENDOR_HUBS + PARENT_GROUPS]
    names = wanted + [x for x in names if x not in wanted]
    for i, (base, division) in enumerate(names[:n], start=1):
        country = rng.choice(COUNTRIES)
        industry = "software" if base in VENDOR_HUBS else rng.choice(INDUSTRIES)
        size = "XL" if base in VENDOR_HUBS + PARENT_GROUPS else rng.choice(SIZES)
        # Planted signal: a hidden kind drives both the claims a company is
        # the subject of and its segment (with 15% label noise).
        kind = "digital" if base in VENDOR_HUBS else rng.choices(SEGMENTS, weights=[4, 3, 3])[0]
        segment = kind if rng.random() < 0.85 else rng.choice([s for s in SEGMENTS if s != kind])
        rows.append({
            "company_id": f"co-{i:03d}",
            "name": f"{base}{division} {SUFFIX_BY_COUNTRY[country]}",
            "industry": industry,
            "country": country,
            "size": size,
            "parent_id": None,
            "segment": segment,
            "_kind": kind,  # hidden: dropped before writing
        })
    by_base = {r["name"].split(" ")[0]: r for r in rows if len(r["name"].split(" ")) == 2}
    parents = [by_base[p]["company_id"] for p in PARENT_GROUPS]
    hubs = {by_base[h]["company_id"] for h in VENDOR_HUBS}
    # subsidiaries: ~20% of the other companies belong to one of the groups
    for r in rows:
        if r["company_id"] not in parents and r["company_id"] not in hubs and rng.random() < 0.2:
            r["parent_id"] = rng.choice(parents)
    return rows, sorted(hubs), parents


def contact_rows(rng, companies, per_company=(1, 5)):
    rows, n = [], 0
    for c in companies:
        for _ in range(rng.randint(*per_company)):
            n += 1
            role, seniority = rng.choice(ROLES)
            rows.append({
                "contact_id": f"ct-{n:04d}",
                "name": f"{rng.choice(FIRST_NAMES)} {rng.choice(SURNAMES)}",
                "role": role,
                "seniority": seniority,
                "company_id": c["company_id"],
            })
    return rows


def claim_rows(rng, companies, hub_by_name, n):
    ids = [c["company_id"] for c in companies]
    kind = {c["company_id"]: c["_kind"] for c in companies}
    industry = {c["company_id"]: c["industry"] for c in companies}
    hubs = sorted(hub_by_name.values())
    rows = []
    for i in range(1, n + 1):
        subject = rng.choice(ids)
        relation = rng.choices(RELATIONS, weights=RELATION_WEIGHTS[kind[subject]])[0]
        if relation == "uses" and rng.random() < 0.85:
            # Planted cause: the industry picks the vendor, with 35% noise.
            preferred = hub_by_name[PREFERRED_HUB[industry[subject]]]
            target = preferred if rng.random() < 0.65 else rng.choice(hubs)
        else:
            target = rng.choice(ids)
        if target == subject:
            target = ids[(ids.index(subject) + 1) % len(ids)]
        true = rng.random() < 0.75
        verdict = ("confirmed" if true else "refuted") if rng.random() < 0.6 else "unreviewed"
        rows.append({"claim_id": f"cl-{i:04d}", "subject": subject,
                     "relation": relation, "target": target, "verdict": verdict,
                     "_true": true})  # hidden: dropped before writing
    return rows


def evidence_rows(rng, claims, companies):
    name = {c["company_id"]: c["name"] for c in companies}
    phrase = {"uses": "uses", "partner_of": "partners with", "competes_with": "competes with",
              "supplies": "supplies", "acquired": "acquired"}
    rows, n = [], 0
    crawlers = [s for s in SOURCES if s.startswith("crawler:")]
    for cl in claims:
        # Planted cause: truth decides the evidence. A true claim is reported
        # independently by several sources; a false one mostly by one crawler
        # that refiles it, so it has volume ($length) without breadth
        # ($distinctLength).
        if cl["_true"]:
            sources = rng.sample(SOURCES, rng.choices([1, 2, 3, 4], weights=[2, 3, 3, 2])[0])
            p_refile = 0.4
        else:
            first = rng.choice(crawlers) if rng.random() < 0.7 else rng.choice(SOURCES)
            extra = rng.choices([0, 1], weights=[8, 2])[0]
            sources = [first] + rng.sample([s for s in SOURCES if s != first], extra)
            p_refile = 0.8
        for source in sources:
            refiles = rng.choice([2, 3]) if source.startswith("crawler:") and rng.random() < p_refile else 1
            for _ in range(refiles):
                n += 1
                published = AS_OF - timedelta(days=rng.randint(0, 540))
                rows.append({
                    "evidence_id": f"ev-{n:05d}",
                    "claim": cl["claim_id"],
                    "source": source,
                    "published": published.isoformat(),
                    "snippet": f"{name[cl['subject']]} {phrase[cl['relation']]} "
                               f"{name[cl['target']]}, according to {source}.",
                })
    return rows


def deal_rows(rng, companies, contacts, claims, hub_by_name, n):
    # What each company REALLY uses: only true claims change an outcome.
    hub_name = {cid: name for name, cid in hub_by_name.items()}
    really_uses = {}
    for cl in claims:
        if cl["relation"] == "uses" and cl["_true"] and cl["target"] in hub_name:
            really_uses.setdefault(cl["subject"], set()).add(hub_name[cl["target"]])
    contacts_of = {}
    for ct in contacts:
        contacts_of.setdefault(ct["company_id"], []).append(ct)
    buyers = [c for c in companies if c["company_id"] in contacts_of]
    rows = []
    for i in range(1, n + 1):
        c = rng.choice(buyers)
        champion = rng.choice(contacts_of[c["company_id"]]) if rng.random() < 0.8 else None
        # Planted signal: industry, size, segment and a senior champion move the odds.
        p = 0.35
        p += {"software": 0.15, "finance": 0.1, "retail": -0.05, "logistics": 0.0,
              "manufacturing": -0.05, "healthcare": 0.05}[c["industry"]]
        p += {"S": -0.1, "M": 0.0, "L": 0.05, "XL": 0.1}[c["size"]]
        p += 0.1 if c["segment"] == "digital" else 0.0
        p += {"exec": 0.2, "manager": 0.08, "ic": -0.05}[champion["seniority"]] if champion else -0.15
        # Planted cause: the vendor stack the company really runs.
        p += sum(HUB_EFFECT_ON_WIN.get(h, 0.0) for h in really_uses.get(c["company_id"], ()))
        won = rng.random() < max(0.05, min(0.95, p))
        rows.append({
            "deal_id": f"dl-{i:04d}",
            "company_id": c["company_id"],
            "champion_id": champion["contact_id"] if champion else None,
            "product": rng.choice(PRODUCTS),
            "amount": rng.choice([15000, 30000, 60000, 120000, 250000]),
            "outcome": "won" if won else "lost",
        })
    return rows


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--out", default=str(Path(__file__).with_name("data")))
    ap.add_argument("--seed", type=int, default=20260927)
    args = ap.parse_args()
    rng = random.Random(args.seed)

    companies, hubs, parents = company_rows(rng, 120)
    hub_by_name = {c["name"].split(" ")[0]: c["company_id"] for c in companies
                   if c["company_id"] in hubs}
    contacts = contact_rows(rng, companies)
    claims = claim_rows(rng, companies, hub_by_name, 400)
    evidence = evidence_rows(rng, claims, companies)
    deals = deal_rows(rng, companies, contacts, claims, hub_by_name, 800)
    for c in companies:
        del c["_kind"]
    for cl in claims:
        del cl["_true"]

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    for name, rows in [("companies", companies), ("contacts", contacts), ("deals", deals),
                       ("claims", claims), ("evidence", evidence)]:
        (out / f"{name}.json").write_text(json.dumps(rows, indent=0, ensure_ascii=False) + "\n")
        print(f"{name:10} {len(rows):5} rows")
    print(f"hubs {hubs}  parent groups {parents}")


if __name__ == "__main__":
    main()
