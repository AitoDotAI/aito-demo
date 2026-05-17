// Aito Predictive Application — Product Sheet
// Compile: typst compile --root . docs/product-sheet/product-sheet.typ docs/product-sheet/product-sheet.pdf

#set page(
  paper: "a4",
  margin: (x: 2cm, y: 2.5cm),
  footer: context [
    #set text(8pt, fill: luma(150))
    #h(1fr) The Predictive Application · aito-demo · Apache 2.0 #h(1fr)
    #counter(page).display()
  ],
)

#set text(size: 10pt, fill: luma(30))
#show heading.where(level: 1): set text(size: 18pt, weight: 700)
#show heading.where(level: 2): set text(size: 14pt, weight: 600)
#show heading.where(level: 3): set text(size: 11pt, weight: 600)

#let orange = rgb("#FF6B35")
#let teal   = rgb("#12B5AD")
#let purple = rgb("#9B69FF")
#let aitobg = rgb("#0c0f41")
#let muted  = luma(120)

// Paths are resolved relative to typst's `--root` (set to the repo
// root so screenshots can live outside `docs/product-sheet/`).
#let shot(name) = image("/docs/screenshots/features/" + name + ".png", width: 100%)

#let feature(title, description, icon: none) = {
  box(
    width: 100%,
    inset: 12pt,
    radius: 6pt,
    stroke: luma(220),
    [
      #if icon != none { text(size: 14pt, icon + " ") }
      #text(weight: 600, size: 11pt, title) \
      #text(size: 9.5pt, fill: luma(80), description)
    ]
  )
}

// ────────────────────────────────────────────────────────────
// Cover
// ────────────────────────────────────────────────────────────

#v(1cm)

#align(center)[
  #text(size: 13pt, fill: muted, weight: 500)[Aito.ai · A Predictive Database for Applications]

  #v(0.3cm)

  #text(size: 32pt, weight: 700, fill: luma(20))[The Predictive Application]

  #v(0.2cm)

  #text(size: 16pt, fill: luma(60), weight: 500)[
    13 ways a predictive database transforms what software does.
  ]

  #v(0.4cm)

  #text(size: 11pt, fill: luma(80))[
    A reference implementation across deliberately diverse application
    surfaces — personalised search, conversational UI, live analytics,
    NLP support, document classification, self-completing forms,
    predictive defaults, model self-evaluation. The Acme grocery setting
    is a coherence wrapper for the demo; the *point* is the breadth of
    application patterns one predictive database unlocks.
  ]

  #v(0.8cm)

  #shot("landing-page")
]

#pagebreak()

// ────────────────────────────────────────────────────────────
// The Challenge
// ────────────────────────────────────────────────────────────

= The Challenge — Intelligent Features Are Expensive

Modern applications want to feel intelligent. Search that personalises.
Forms that fill themselves. Support that auto-routes. Dashboards that
surface patterns. Automations that evaluate their own quality.

The traditional path to any one of those is an ML pipeline: data
engineering, feature store, training infrastructure, deployment,
drift monitoring, an owner. Most product teams can't justify that
investment for a single feature — so features ship as static rules,
and "intelligent" lives in the roadmap deck.

#v(0.3cm)

#grid(
  columns: (1fr, 1fr, 1fr),
  gutter: 12pt,
  feature(
    "Pipelines per feature",
    "Every smart capability needs its own model, its own training data, its own retraining schedule. Five features means five pipelines and five owners — most product teams stop at one.",
    icon: "🛠️",
  ),
  feature(
    "Predictions outlive their training",
    "The model trained on last quarter's data feels stale once the data distribution shifts. Nobody is watching the precision/recall curves until something visibly breaks.",
    icon: "📉",
  ),
  feature(
    "Black-box decisions",
    "A trained classifier returned answer X. Why? The product team has no recourse beyond \"the model said so\" — and the auditor has no recourse at all.",
    icon: "❓",
  ),
)

#v(0.8cm)

= The Solution — Predictions Become Queries

Aito is a predictive database. Replace _train model → deploy service →
monitor drift_ with _SQL-like query → live prediction_. Every
predictive feature you'd otherwise build as a separate ML service
becomes a query against the same database that already stores your
application data.

The 13 features in this demo are deliberately *not* a vertical product.
They're 13 different application patterns — each a single query body,
all sharing the same operators, the same explanations, the same
evaluation discipline. The point isn't grocery retail. The point is
what changes about software when intelligence is a database query
rather than a project plan.

#v(0.3cm)

#grid(
  columns: (1fr, 1fr, 1fr),
  gutter: 12pt,
  feature(
    "One technology, many patterns",
    "Search, recommendation, classification, regression, relation analysis, evaluation — all share the same query API. Learn it once, ship it across the application.",
    icon: "🧩",
  ),
  feature(
    "Explainable by design",
    "Every `_predict` returns the multiplicative chain that produced it — base rate × pattern lifts → final probability. Click any prediction to see why. No black box.",
    icon: "📋",
  ),
  feature(
    "Honest when uncertain",
    "`_evaluate` reports accuracy AND accuracy gain. A 96 % model that doesn't beat the prior is flagged honest-failure, not shipped as success. The application knows when it doesn't know.",
    icon: "✓",
  ),
)

#pagebreak()

// ────────────────────────────────────────────────────────────
// Pattern 1 — Personalised UI Surfaces
// ────────────────────────────────────────────────────────────

= Pattern 1 — Personalised UI Surfaces

The application pattern: a list, grid, or feed that re-ranks per user
without per-user models. The same query body returns a different
ordering for every user, derived from the live interaction history
in the database.

The Acme demo of this pattern is Smart Search. Type `milk` as a
generic query. Switch the shopper pill between Larry (lactose-
sensitive), Veronica (organic-only), and Alice (budget-driven) — three
personas, three completely different top-5 lists, one query body, no
retrained model in between.

#shot("smart-search-milk-larry")

#v(0.3cm)

*What's happening underneath:*
- _Generic_: `_query where {product.name: {$match: "milk"}}` — token relevance only.
- _Predictive_: same `_query`, with `orderBy: $multiply($similarity, $p({purchase: true}))` and the active user pinned via `context.user`. Aito re-ranks the same rows by similarity-weighted purchase probability against the live history table.
- The only thing that varies between users is the user binding. The same pattern applies anywhere your application shows ranked content — search results, recommendations, notifications, feed ordering, support article suggestions.

#pagebreak()

// ────────────────────────────────────────────────────────────
// Pattern 2 — Conversational Interfaces Grounded in Live Data
// ────────────────────────────────────────────────────────────

= Pattern 2 — Conversational Interfaces, Grounded

The application pattern: a chat surface where every answer is backed
by a live query against your own application data, not a hallucinated
sentence from training data. The LLM composes the prose; the
predictive database supplies the facts.

The Acme demo is the Customer Assistant. "What's good for a lactose-
free dinner under €15?" — the assistant invokes `_recommend` and
`_predict` as tool calls, then writes the reply. Same architecture
also powers an Employee Assistant for back-office questions: one
predictive database, two chat surfaces, different system prompts.

#shot("shopping-assistant-interface")

#v(0.3cm)

*Three properties that distinguish predictive-database-backed chat from RAG-over-PDFs:*

#box(
  width: 100%,
  inset: 14pt,
  radius: 6pt,
  fill: luma(248),
  stroke: luma(230),
  [
    #text(size: 10pt, fill: luma(60))[
      *Tool-call grounded* — every entity the model mentions came from
      a live Aito query in the same turn. No hallucinated SKUs, no
      stale knowledge cutoff. \
      *Context-aware* — the active user (or session, or tenant) is
      part of the system prompt and conditions every `_recommend goal`
      issued under the chat. \
      *Latency-visible* — the LatencyPill above the chat reports the
      round-trip for each underlying Aito call. The user sees the
      answer cost one `_recommend` and one `_predict`, not a magic box.
    ]
  ]
)

#pagebreak()

// ────────────────────────────────────────────────────────────
// Pattern 3 — Live Analytics Without Warehousing
// ────────────────────────────────────────────────────────────

= Pattern 3 — Live Analytics Without Warehousing

#grid(
  columns: (1fr, 1fr),
  gutter: 16pt,
  [
    == Per-Entity Dashboards

    The application pattern: every chart in the analytics surface is a
    live query, not a nightly-aggregated rollup. Drill into a single
    entity — product, customer, supplier, ticket — and the panel
    populates from the same database the operational app reads.

    #shot("product-analytics")
  ],
  [
    == Regression & Estimation

    The application pattern: ask the data what a continuous variable
    should be — price, demand, latency, conversion — from a
    multivariate regression performed at query time. `_estimate` runs
    the regression on every call; no separately-trained price model.

    #shot("pricing-analytics")
  ],
)

#v(0.5cm)

*Why this matters operationally:* a product manager who has to choose
between two intervention options answers the question against this
week's data, not last quarter's snapshot. The same Aito instance that
serves the operational application surfaces serves the analytics
panels, so the numbers a user sees on a record page never disagree
with the numbers an analyst sees on a dashboard.

#v(0.4cm)

The same pattern extends to *Preference Analytics* — `_relate`
surfacing which segments correlate with which clusters. Demographic
targeting that's mathematically defensible: every cell of the heatmap
is a real lift number, derived from the data the application already
holds.

#pagebreak()

// ────────────────────────────────────────────────────────────
// Pattern 4 — Auto-Classification and Routing
// ────────────────────────────────────────────────────────────

= Pattern 4 — Auto-Classification and Routing

The application pattern: documents, tickets, requests, or events arrive
unstructured; the application labels them and routes them. Each routing
decision is a `_predict` call that returns a class plus a confidence
chip, with `$why` exposed for audit.

The Acme demo is Invoice Processing. Drop an invoice → GL code +
approver + processing path suggested with confidence. The same shape
generalises to support-ticket routing, expense categorisation,
content moderation, fraud-flag triage, or any classify-and-route flow
in the back office.

#shot("invoice-processing-list")

#v(0.3cm)

*What this catches:*
- *Routine items* — recurring patterns auto-route to the right owner with ≥ 95 % confidence and never touch a human
- *Anomalies* — out-of-pattern features drop confidence below threshold and route to manual review automatically — the application is correctly admitting it isn't sure
- *Audit-ready* — every prediction carries its `$why` chain. Compliance can answer "why did this go to Pekka?" by clicking the prediction, without scheduling a meeting

The demo's invoice schema is deliberately small (100 invoices, 10 GL
codes, 10 employees). The query body doesn't change at production
scale; Aito's prediction performance is independent of total row
count up to multi-million rows.

#pagebreak()

// ────────────────────────────────────────────────────────────
// Pattern 5 — Self-Completing Forms
// ────────────────────────────────────────────────────────────

= Pattern 5 — Self-Completing Forms

The application pattern: a form where most fields fill themselves in
from the few the user enters. Each suggested field is its own
`_predict` or `_estimate` call against the application's own history;
confidence chips block low-quality guesses; `$why` opens the decision
tree on demand.

The Acme demo is Product Catalog Enrichment. Paste a new SKU name →
category, tags, and suggested price predicted in parallel. The same
pattern is the spine of any application where data entry is
high-friction: CRM enrichment, ticket triage forms, expense report
classification, partner-onboarding intake forms.

#shot("tag-prediction")

#v(0.3cm)

*What this catches:*
- *Missing categorical fields* — "Vegan Oat Drink 1L" tokenises to `tags: vegan, plant-based, dairy-alternative` with > 90 % confidence
- *Missing continuous fields* — `_estimate` against history lands on a regressed price with a confidence band, not a point guess pretending to certainty
- *Locked attributes* — fields already supplied are predicted *anyway* and tagged `🔒 stored` for honesty. Aito's prediction agrees with the stored value? Trust the catalog. Disagrees? Flag for review.

The `Text` type on `name` is load-bearing here — Aito tokenises and
uses individual words as features. A schema with `name: String` would
collapse this whole pattern to exact-name lookup and the moment would
disappear. The detail matters anywhere this pattern lands.

#pagebreak()

// ────────────────────────────────────────────────────────────
// Pattern 6 — Self-Evaluating Applications
// ────────────────────────────────────────────────────────────

= Pattern 6 — Self-Evaluating Applications

The application pattern: every predictive surface in the app ships
with a held-out `_evaluate` panel that reports two numbers — accuracy
and accuracy *gain over the prior*. Predictions that don't beat the
naïve baseline are flagged in the application UI, not silently
shipped. The application is honest about when it knows and when it
doesn't.

#shot("model-evaluation")

#v(0.3cm)

The "accuracy" column is the easy metric. The "gain" column is the
honest one — accuracy above what guessing the most common class would
give you. If about 3 % of items get returned regardless of features,
predicting "won't be returned" for everything is 97 % accurate and
adds zero information. That's what +0 pp gain means.

*Why this pattern is the most trust-building one in the demo:*
every predictive feature ships with its own evaluation, surfaced in
the application, not buried in a notebook. Aito tells you when its
predictions are real signal versus a coin flip dressed as accuracy.
The naïve-metric trap is the one most products hide. A predictive
application built this way labels it FAIL.

#v(0.3cm)

The seventh related pattern, *Predictive Defaults*, applies the same
discipline to the form layer: the shopping cart pre-populates with
the user's most-likely next basket, computed by `_recommend` against
their visit history. Zero clicks to a usable default — and zero
shipping of a prediction the evaluation panel can't defend.

#pagebreak()

// ────────────────────────────────────────────────────────────
// How It Works
// ────────────────────────────────────────────────────────────

= How It Works

#grid(
  columns: (1fr, 1fr, 1fr),
  gutter: 12pt,
  feature(
    "1. Connect your data",
    "Whatever tables already power your application: products, users, events, documents, invoices, tickets. JSON schema declared up front. Single-shot upload, no separate feature store.",
    icon: "📤",
  ),
  feature(
    "2. Query for predictions",
    "Six operators cover the application patterns in this demo:\n• _predict: classification\n• _recommend: ranking & defaults\n• _relate: correlation analysis\n• _query: KPIs + analytics\n• _estimate: regression\n• _evaluate: honest pass/fail",
    icon: "🔮",
  ),
  feature(
    "3. Integrate",
    "REST API · sub-100 ms response time · works from any application stack. This demo's frontend is React, but the same query bodies drop into mobile, server-side rendering, or back-office tools.",
    icon: "🔗",
  ),
)

#v(0.6cm)

== Architecture at a glance

#box(
  width: 100%,
  inset: 14pt,
  radius: 6pt,
  fill: luma(248),
  stroke: luma(230),
  [
    #text(size: 10pt, fill: luma(60))[
      *Frontend* — React 18 (Create React App) · Reactstrap + Bootstrap 5 · 13 numbered modules (`src/01-recommend.js` through `src/13-product-predictions.js`), each a standalone tutorial for one application pattern \
      *Aito* — REST API · `_predict` / `_recommend` / `_relate` / `_query` / `_estimate` / `_evaluate` \
      *Data* — 11 JSON tables shipped in `src/data/`, uploaded with `npm run upload-data` \
      *Demo persona* — 3 named users (Larry · Veronica · Alice) plus 67 tag-segmented users; menu organised by application-pattern pillar: Customer Experience · Analytics · Assistance · Automation \
      *Coherence wrapper* — the Acme grocery store is the scenario the 13 patterns share so the demo doesn't feel like 13 unrelated apps. The patterns are the deliverable; the grocery is the stage. \
      *Deployment* — Live at `demo.aito.ai` (Azure Web Apps); Netlify · Vercel · Docker · nginx configs all included
    ]
  ]
)

#v(0.5cm)

== Designed to be read

Each of the 13 numbered modules in `src/` is a standalone tutorial for
one Aito capability. Comprehensive JSDoc explains the application
pattern and the business motivation. Use-case guides live in
`docs/use-cases/`, one per module, with the full query body, expected
response, and a "production checklist" for hardening before you ship
the pattern in your own application.

#pagebreak()

// ────────────────────────────────────────────────────────────
// What This Demo Doesn't Try to Be
// ────────────────────────────────────────────────────────────

= What This Demo Isn't

This is a *deliberately broad* reference for predictive applications.
The 13 features are not a coherent product — they're a cross-section
of application patterns chosen for variety. We picked breadth over
vertical depth on purpose. For depth in a specific vertical, look at
the sibling demos:

#v(0.3cm)

#grid(
  columns: (1fr, 1fr),
  gutter: 12pt,
  [
    *Not an e-commerce platform* — vertical e-commerce (smart search,
    recommendations, catalog enrichment, basket lift, return-risk
    evaluation) is the focus of `aito-ecommerce-demo`. If your roadmap
    is an online shop, that's the more relevant reference.

    *Not an ERP system* — vertical ERP (goods receipt prediction,
    supplier matching, three-way match, inventory forecasting) is
    `aito-erp-demo`.

    *Not an accounting system* — vertical accounting (ledger entry
    classification, invoice approval routing, financial flow
    automation) is `aito-accounting-demo`.
  ],
  [
    *Not a complete grocery app* — no checkout, payments, fulfilment,
    inventory, supply chain. Acme exists to give the 13 unrelated
    patterns a shared cast of characters. The grocery context is
    cosmetic; the patterns transfer.

    *Not personalised at scale* — 70 demo users, 42 demo SKUs. Enough
    to show the patterns; not enough for per-individual modelling at
    production scale. The use-case docs note the data-volume
    thresholds where per-user `_recommend` starts paying off.

    *Not a UI showcase* — the Reactstrap + Bootstrap UI is
    intentionally plain. Look at the queries, not the components.
    Production teams swap their own design system on top of the same
    query bodies.
  ],
)

#v(0.5cm)

#text(size: 9.5pt, fill: muted)[
  Owning the scope is more credible than papering over it. The four
  Aito open-source demos (aito-demo · aito-accounting-demo ·
  aito-ecommerce-demo · aito-erp-demo) deliberately partition into
  one cross-cutting *pattern reference* (this one) and three
  *vertical references* (the others). If you're picking which one to
  fork, this one is the right starting point when you want to see
  *what's possible*; the verticals are right when you know *what
  you're building*.
]

#pagebreak()

// ────────────────────────────────────────────────────────────
// CTA
// ────────────────────────────────────────────────────────────

= Ready to Build Predictive Applications?

#v(0.4cm)

#grid(
  columns: (1fr, 1fr, 1fr),
  gutter: 12pt,
  feature(
    "See it live",
    "demo.aito.ai — full 13-pattern tour, no signup. Switch between Larry, Veronica, and Alice to watch the predictive surfaces re-rank in real time.",
    icon: "🚀"
  ),
  feature(
    "Run it locally",
    "git clone, npm install, npm start. The `.env.example` ships with a working public demo API key — predictions running in under 5 minutes from clone.",
    icon: "💻"
  ),
  feature(
    "Talk to us",
    "If your application roadmap has predictive search, conversation, classification, analytics, or evaluation on it, we should talk. EU hosted, no PII stored.",
    icon: "💬"
  ),
)

#v(1.2cm)

#box(
  width: 100%,
  inset: 20pt,
  radius: 8pt,
  fill: aitobg,
  [
    #text(fill: white, size: 11pt)[
      #text(weight: 600, size: 13pt)[Build predictive applications — without the ML pipeline]

      #v(0.3cm)

      Aito.ai is a predictive database. Upload the data your
      application already holds, query for predictions, ship features.
      The 13 patterns in this demo are the same query API you'd use in
      production — sub-100 ms `_predict` calls, full `$why`
      explanations, and honest `_evaluate` built in.

      #v(0.3cm)

      #text(fill: teal, weight: 500)[hello\@aito.ai · aito.ai · github.com/AitoDotAI/aito-demo · demo.aito.ai]
    ]
  ]
)

#v(0.5cm)

#align(center)[
  #text(size: 9pt, fill: muted)[
    Aito.ai builds predictive infrastructure for product teams who want
    statistical intelligence without standing up an ML team. Open-source
    demos: aito-demo (this one — cross-cutting patterns) ·
    aito-ecommerce-demo · aito-accounting-demo · aito-erp-demo.
  ]
]
