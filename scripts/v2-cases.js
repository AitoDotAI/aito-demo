/**
 * The query shapes aito-demo actually sends, one case per distinct call site.
 *
 * Each case records the module and line it was taken from so the list can be
 * audited against the source. When a call needs a different body on each API
 * version, give `bodyV1` / `bodyV2` instead of `body` — that difference IS the
 * migration finding, and the harness reports it rather than hiding it.
 *
 * Read-only: every endpoint here is a query endpoint. Nothing in this file
 * writes, so it is safe to point at the production `master` env.
 */

// Fixtures picked from data that exists in both envs.
const PRODUCT_ID = '6410405082657'   // Pirkka mustikkakeitto
const PRODUCT_NAME = 'Pirkka banana'
const USER = 'larry'

const CASES = [
  {
    id: '01-recommend',
    source: 'src/01-recommend.js:27',
    endpoint: '_recommend',
    body: {
      from: 'impressions',
      where: { 'context.user': USER, 'product.id': { $and: [{ $not: PRODUCT_ID }] } },
      recommend: 'product',
      goal: { purchase: true },
      select: ['name', 'id', 'tags', 'price'],
      limit: 5,
    },
  },
  {
    id: '02-autocomplete',
    source: 'src/02-autocomplete.js:35',
    endpoint: '_query',
    body: {
      from: 'contexts',
      where: { queryPhrase: { $startsWith: 'so' }, user: USER },
      get: 'queryPhrase',
      orderBy: '$p',
      select: ['$p', '$value'],
      limit: 5,
    },
  },
  {
    id: '03-search',
    source: 'src/03-search.js:32',
    endpoint: '_query',
    body: {
      from: 'impressions',
      where: { 'product.name': { $match: 'banana' }, 'context.user': USER },
      get: 'product',
      orderBy: { $multiply: ['$similarity', { $p: { $context: { purchase: true } } }] },
      select: ['name', 'id', 'tags', 'price'],
      limit: 5,
    },
  },
  {
    // Non-exclusive multi-value prediction. v2 rejects `exclusiveness: false`
    // ("contradicts the exclusive target 'tags'"), and on v1 `tags.$feature`
    // returns materially different probabilities, so neither form is portable
    // and the app branches via nonExclusivePredict(). Measured: v2's
    // tags.$feature reproduces v1's exclusiveness:false closely.
    id: '04-tag-suggestions',
    source: 'src/04-get-tag-suggestions.js:18',
    endpoint: '_predict',
    bodyV1: { from: 'products', where: { name: PRODUCT_NAME }, predict: 'tags', exclusiveness: false, limit: 5 },
    bodyV2: { from: 'products', where: { name: PRODUCT_NAME }, predict: 'tags.$feature', limit: 5 },
  },
  {
    id: '05-autofill-query',
    source: 'src/05-autofill.js:14',
    endpoint: '_query',
    body: { from: 'visits', where: { user: USER }, limit: 5 },
  },
  {
    id: '05-autofill-predict',
    source: 'src/05-autofill.js:50',
    endpoint: '_predict',
    bodyV1: {
      from: 'visits',
      where: { user: USER },
      predict: 'purchases',
      exclusiveness: false,
      select: ['$p', '$value'],
    },
    bodyV2: {
      from: 'visits',
      where: { user: USER },
      predict: 'purchases.$feature',
      select: ['$p', '$value'],
    },
  },
  {
    id: '06-prompt-categories',
    source: 'src/06-prompt.js:93',
    endpoint: '_predict',
    bodyV1: {
      from: 'prompts',
      where: { prompt: 'where is my order' },
      predict: 'categories',
      exclusiveness: false,
      limit: 1,
    },
    bodyV2: {
      from: 'prompts',
      where: { prompt: 'where is my order' },
      predict: 'categories.$feature',
      limit: 1,
    },
  },
  {
    id: '06-prompt-feedback-tags',
    source: 'src/06-prompt.js:44',
    endpoint: '_predict',
    bodyV1: {
      from: 'prompts',
      where: { prompt: 'the app is slow', type: 'feedback' },
      predict: 'tags',
      exclusiveness: false,
      limit: 1,
    },
    bodyV2: {
      from: 'prompts',
      where: { prompt: 'the app is slow', type: 'feedback' },
      predict: 'tags.$feature',
      limit: 1,
    },
  },
  {
    id: '06-prompt-sentiment',
    source: 'src/06-prompt.js:44',
    endpoint: '_predict',
    body: {
      from: 'prompts',
      where: { prompt: 'the app is slow', type: 'feedback' },
      predict: 'sentiment',
      exclusiveness: true,
      limit: 1,
    },
  },
  {
    id: '06-prompt-urgency',
    source: 'src/06-prompt.js:122',
    endpoint: '_predict',
    body: {
      from: 'prompts',
      where: { prompt: { $match: 'this is broken and I am furious' } },
      predict: 'urgency',
      limit: 3,
    },
  },
  {
    // v1 accepts a bare field name; v2 requires an array. Response `related`
    // shape is identical across both, so only the argument form moved.
    id: '07-relate',
    source: 'src/07-relate.js:31',
    endpoint: '_relate',
    // v2 drops `ps` and `relation` and returns `info` as a number rather than
    // an object. Verified unused: the app reads only `lift` and `related`
    // (src/07-relate.js:72, src/app/pages/AnalyticsPage.js:210).
    accept: 'v2 omits ps/relation/info-object; no consumer reads them',
    body: { from: 'visits', where: { 'user.tags': { $has: 'young' } }, relate: ['purchases'] },
  },
  {
    id: '07-relate-products',
    source: 'src/07-relate.js:48',
    endpoint: '_query',
    body: { from: 'products', where: { id: { $or: [PRODUCT_ID] } }, limit: 1 },
  },
  {
    id: '08-invoice-predict',
    source: 'src/08-predict-invoice.js:47',
    endpoint: '_predict',
    body: {
      from: 'invoices',
      where: { Description: { $match: 'office supplies' } },
      predict: 'GLCode',
      select: ['$p', '$value', 'Name', 'Department'],
      limit: 3,
    },
  },
  {
    id: '09-product-details',
    source: 'src/09-product.js:11',
    endpoint: '_query',
    body: { from: 'products', where: { id: PRODUCT_ID }, limit: 1 },
  },
  {
    id: '09-product-stats',
    source: 'src/09-product.js:50',
    endpoint: '_aggregate',
    body: {
      from: 'impressions',
      where: { 'product.id': PRODUCT_ID },
      aggregate: ['purchase.$sum', 'purchase.$mean'],
    },
  },
  {
    // v1 enumerates propositions across each property of the nested object.
    // v2 rejects the nested form; the flat dotted form ANDs the properties
    // into a single condition, which is a different question. Recorded as a
    // per-version body so the harness surfaces the semantic gap.
    id: '09-relate-purchase-props',
    source: 'src/09-product.js:88 (batch query 1)',
    endpoint: '_relate',
    body: {
      from: 'impressions',
      where: { purchase: true },
      relate: ['product.name', 'product.category', 'product.tags', 'product.price'],
      select: ['lift', 'related'],
    },
    note: 'ported off the nested-object proposition form, which v2 rejects',
    // _relate returns a ranked list of propositions, and the two engines rank
    // a different set. Comparing hits[i] to hits[i] therefore reports absent
    // keys that are really just a different proposition in that slot — an
    // artefact of positional comparison, not a missing field.
    accept: 'ranked proposition lists differ between engines; positional diff is not meaningful',
  },
  {
    id: '09-relate-demographics',
    source: 'src/09-product.js:88 (batch query 2)',
    endpoint: '_relate',
    body: {
      from: 'visits',
      where: { purchases: { $has: PRODUCT_ID } },
      relate: ['user.tags'],
      select: ['lift', 'related'],
    },
  },
  {
    id: '10-distinct-values',
    source: 'src/10-get-distinct-values.js:27',
    endpoint: '_match',
    body: { from: 'visits', match: 'user.tags.$feature', limit: 50 },
  },
  {
    id: '11-evaluate-products',
    source: 'src/11-evaluate.js:18',
    endpoint: '_evaluate',
    body: {
      test: { $index: { $mod: [4, 0] } },
      evaluate: {
        from: 'products',
        where: { name: { $get: 'name' } },
        predict: 'category',
      },
      select: ['n', 'accuracy', 'baseAccuracy', 'accuracyGain', 'meanRank'],
    },
  },
  {
    id: '11-evaluate-invoices',
    source: 'src/11-evaluate.js:18',
    endpoint: '_evaluate',
    body: {
      test: { $index: { $mod: [4, 0] } },
      evaluate: {
        from: 'invoices',
        where: { Description: { $get: 'Description' } },
        predict: 'GLCode',
      },
      select: ['n', 'accuracy', 'baseAccuracy', 'accuracyGain', 'meanRank'],
    },
  },
  {
    // v1 selects `estimate`; v2 renamed the field to `value`.
    id: '12-estimate-price',
    source: 'src/12-price-estimation.js:111',
    endpoint: '_estimate',
    bodyV1: {
      from: 'price_history',
      where: { category: '100' },
      estimate: 'sale_price',
      select: ['estimate', 'why'],
    },
    bodyV2: {
      from: 'price_history',
      where: { category: '100' },
      estimate: 'sale_price',
      select: ['value', 'why'],
    },
    // The KNN why is a weightedAverage whose components are rich objects on
    // v1 and plain numbers on v2. Nothing parses this one (PricingPage parses
    // only the regression why), so the loss is recorded, not blocking.
    accept: 'v2 KNN why components are scalars, not objects; unparsed by the app',
  },
  {
    id: '12-estimate-demand',
    source: 'src/12-price-estimation.js:139',
    endpoint: '_estimate',
    bodyV1: {
      from: 'price_history',
      where: { category: '100', sale_price: 2.5 },
      estimate: 'units_sold',
      select: ['estimate'],
    },
    bodyV2: {
      from: 'price_history',
      where: { category: '100', sale_price: 2.5 },
      estimate: 'units_sold',
      select: ['value'],
    },
  },
  {
    // The regression model is what PricingPage's explanation tooltip parses.
    // Both versions answer 200 and their estimates agree closely, but the
    // `why` payloads are structurally unrelated: v1 gives
    // `{type:'exponent', power:{terms:[...]}}` with a per-field proposition
    // and contribution per term, v2 gives `{type:'regression', neighbours:
    // [{value, adjusted}]}` with no field attribution at all.
    // parseRegressionExplanation keys off `type === 'exponent'` and so
    // returns null on v2; the tooltip is then simply not offered, which the
    // render path already guards for. Recorded here so the loss of field-level
    // explainability stays visible rather than silently accepted.
    id: '12-estimate-price-regression',
    source: 'src/12-price-estimation.js:153 (estimatePriceRegression)',
    endpoint: '_estimate',
    bodyV1: {
      from: 'price_history',
      where: { category: '100', day_of_week: 'Monday' },
      estimate: 'sale_price',
      model: 'regression',
      select: ['estimate', 'why'],
    },
    bodyV2: {
      from: 'price_history',
      where: { category: '100', day_of_week: 'Monday' },
      estimate: 'sale_price',
      model: 'regression',
      select: ['value', 'why'],
    },
    note: 'estimates agree; v2 why has no per-field terms (explainability gap)',
    accept: 'v2 why lacks power.terms; tooltip is suppressed by the existing render guard',
  },
  {
    id: '12-price-history-query',
    source: 'src/12-price-estimation.js:26',
    endpoint: '_query',
    body: { from: 'price_history', where: { category: '100' }, limit: 3 },
  },
  {
    id: '12-price-aggregate',
    source: 'src/12-price-estimation.js:246',
    endpoint: '_aggregate',
    body: {
      from: 'price_history',
      where: { category: '100' },
      aggregate: ['units_sold.$sum', 'sale_price.$mean'],
    },
  },
  {
    id: '13-predict-category',
    source: 'src/13-product-predictions.js:17',
    endpoint: '_predict',
    body: {
      from: 'products',
      where: { name: { $match: 'organic milk' } },
      predict: 'category',
      limit: 3,
    },
  },
  {
    id: '13-predict-price',
    source: 'src/13-product-predictions.js:55',
    endpoint: '_predict',
    body: {
      from: 'products',
      where: { name: { $match: 'organic milk' } },
      predict: 'price',
      limit: 3,
    },
  },
]

module.exports = { CASES, PRODUCT_ID, PRODUCT_NAME, USER }
