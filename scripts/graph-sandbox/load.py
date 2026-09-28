#!/usr/bin/env python3
"""Load the graph sandbox dataset into its own environment. A DRY RUN unless --apply.

The dataset goes into a separate environment (default `graph`) branched off
the database's master, never into master itself: master serves the v1 docs
and demo.aito.ai. The branch starts as a copy-on-write view of master, so
this script drops the tables it inherited *inside the branch only* and
creates the graph collections there. An existing env is reloaded only if it
holds nothing but these collections, so a mistyped `--env` (say `v2`) stops
instead of dropping someone else's tables.

    pip install aitoai                      # 0.7.0 or newer
    python3 generate.py                     # writes data/
    AITO_API_KEY=<key> python3 load.py      # dry run: prints the plan, writes nothing
    AITO_API_KEY=<read-write key> python3 load.py --apply

A dry run needs only a read key. The data is public once loaded: the
database's read key reads every environment.
"""

import argparse
import json
import os
import sys
from pathlib import Path

from aito.v2 import Client, Error

HERE = Path(__file__).resolve().parent
#: parents before children, so every link target is loaded before its referrers
ORDER = ["companies", "contacts", "deals", "claims", "evidence"]


def envs_of(client):
    body = client.list_envs()
    return {e["name"] for e in body.get("envs", body.get("data", []))}


def names_in(schema):
    body = schema.get("schema", schema)
    return set(body) if isinstance(body, dict) else set()


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--db", default="https://shared.aito.ai/db/aito-demo")
    ap.add_argument("--env", default="graph")
    ap.add_argument("--data", default=str(HERE / "data"))
    ap.add_argument("--apply", action="store_true", help="perform the writes (default: dry run)")
    args = ap.parse_args()

    if args.env in ("", "master", "env.master"):
        sys.exit("refusing to load into master: pick a separate environment (--env)")
    key = os.environ.get("AITO_API_KEY")
    if not key:
        sys.exit("set AITO_API_KEY (a read key is enough for a dry run)")

    schema = json.loads((HERE / "schema.json").read_text())
    data = {name: json.loads((Path(args.data) / f"{name}.json").read_text()) for name in ORDER}
    assert list(schema) == ORDER, "schema.json and ORDER disagree"

    root = Client(args.db, key)                    # master-scoped: used ONLY for _envs
    exists = args.env in envs_of(root)
    plan = []
    if not exists:
        plan.append(f"branch environment '{args.env}' off master")
        inherited = names_in(root.get_schema())    # a new branch starts with master's tables
    else:
        inherited = names_in(Client(args.db, key, env=args.env).get_schema())
        # An existing env is only safe to reload if it holds nothing but this
        # dataset: `--env v2` must not drop the grocery tables the v2 docs use.
        foreign = sorted(inherited - set(ORDER))
        if foreign:
            sys.exit(f"refusing: env '{args.env}' already exists and holds other tables "
                     f"({', '.join(foreign)}). Pick a new --env; this script only "
                     "branches a fresh one or reloads its own.")
    for name in sorted(inherited - set(ORDER)):
        plan.append(f"drop '{name}' in env '{args.env}' (inherited from master; master is untouched)")
    for name in ORDER:
        if name in inherited:
            plan.append(f"drop and recreate '{name}' in env '{args.env}'")
        else:
            plan.append(f"create collection '{name}' in env '{args.env}'")
        plan.append(f"upload {len(data[name])} rows into '{name}', then optimize")

    print(f"target: {args.db}/env/{args.env}  ({'exists' if exists else 'new'})")
    for step in plan:
        print("  -", step)
    if not args.apply:
        print("dry run: nothing written. Re-run with --apply and a read-write key.")
        return 0

    if not exists:
        root.branch_env(args.env)
    env = Client(args.db, key, env=args.env)      # every write below is scoped to the branch
    assert env.env == args.env
    for name in sorted(inherited):
        try:
            env.delete_collection(name)
        except Error as err:
            if not err.is_not_found:
                raise
    for name in ORDER:
        env.create_collection(name, schema[name]["columns"])
        inserted = env.upload_entries(name, data[name], batch_size=1000)
        env.optimize(name)
        print(f"  {name:10} {inserted} rows")
    print(f"done: {args.db}/env/{args.env}/api/v2/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
