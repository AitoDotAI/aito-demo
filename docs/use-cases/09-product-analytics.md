# AI-Powered Product Analytics

![Product Analytics](../screenshots/features/product-analytics-page.png)

*Product analytics dashboard showing performance trends, customer segments, and shopping basket analysis*

**[🚀 Try Live Demo](https://demo.aito.ai/product)** - Navigate through products to see comprehensive analytics powered by Aito's batch query capabilities. View performance metrics, customer segments, and purchase patterns.

## Overview

The product analytics feature demonstrates how Aito.ai's `_batch` endpoint enables comprehensive product analysis through a single API call. By combining multiple query types (relate, aggregate, query), it delivers a complete analytics dashboard showing performance metrics, customer segmentation, basket analysis, search behavior, and temporal trends.

## How It Works

### Traditional vs. AI-Powered Product Analytics

**Traditional Analytics:**
- Multiple separate queries to different systems
- Manual join operations across data sources
- Complex ETL pipelines for dashboard data
- Delayed updates from batch processing

**AI-Powered Analytics with Aito:**
- Single batch API call returns all analytics
- Automatic statistical correlation analysis
- Real-time results from live data
- No ETL or pre-aggregation needed

### Implementation

The product analytics uses Aito's `_batch` endpoint to run 5 different analyses in parallel:

```javascript
// Core product analytics logic from src/09-product.js
export function getProductAnalytics(id) {
  // Execute multiple analytics queries in parallel using batch API
  return axios.post(`${config.aito.url}/api/v1/_batch`,
    [
      { // Query 1: Analyze which product properties correlate with purchases
        from: 'impressions',
        where: { purchase: true },
        relate: { product: id },
        select: ['lift', 'related']
      },
      { // Query 2: Analyze correlation between user demographics and this product
        from: 'visits',
        where: { purchases: { $has: id } },
        relate: 'user.tags',
        select: ['lift', 'related']
      },
      { // Query 3: Market basket analysis - what other products are bought together
        from: 'visits',
        where: { purchases: { $has: id } },
        relate: 'purchases',
        select: ['lift', 'related']
      },
      { // Query 4: Analyze which search terms lead to this product being purchased
        from: 'impressions',
        where: { 'product.id': id },
        get: 'context.queryPhrase',
        orderBy: { $sum: { $context: 'purchase' } },
        select: ['$score', '$value']
      },
      { // Query 5: Time-series analysis of purchase patterns
        from: 'impressions',
        where: { 'product.id': id },
        get: 'context.week',
        select: [
          '$value',
          '$f',
          { $sum: { $context: 'purchase' } },
          { $mean: { $context: 'purchase' } }
        ]
      }
    ]
  ).then(response => response.data)
}
```

## Key Features

### 1. Performance Metrics

Basic product performance aggregated from impressions:

```javascript
// Separate call to _aggregate endpoint
export function getProductStats(id) {
  return axios.post(`${config.aito.url}/api/v1/_aggregate`, {
    from: 'impressions',
    where: { 'product.id': id },
    aggregate: ['purchase.$sum', 'purchase.$mean']
  })
}

// Returns:
{
  'sum.samples': 1234,    // Total impressions
  'sum': 156,             // Total purchases
  'mean': 0.126           // CTR (12.6%)
}
```

### 2. Product Property Correlation (Query #1)

Identifies which product attributes (name, category, tags) correlate with higher purchase rates:

```javascript
// Example result
{
  related: { 'product.tags': { $has: 'organic' } },
  lift: 1.45  // 45% higher CTR for organic products
}
```

**UI Display:**
- "CTR by Product Property" card
- Shows lift scores for product attributes
- Color-coded: green for positive lift, red for negative

### 3. Customer Segmentation (Query #2)

Shows which user demographics are more or less likely to purchase this product:

```javascript
// Example result
{
  related: { 'user.tags': { $has: 'club-member' } },
  lift: 1.72  // Club members 72% more likely to buy
}
```

**UI Display:**
- "Purchase % by Customer Segment" card
- Lists user tags with lift scores
- Identifies target demographics

### 4. Shopping Basket Analysis (Query #3)

Discovers which products are frequently purchased together:

```javascript
// Example result
{
  related: { purchases: { $has: 'milk_organic' } },
  lift: 2.34  // 134% more likely to be bought together
}
```

**UI Display:**
- "Shopping Basket" card
- Shows complementary products
- Lift scores indicate bundle strength

### 5. Search Query Analysis (Query #4)

Identifies which search terms lead to purchases of this product:

```javascript
// Example result
{
  $value: 'organic cereal',
  $score: 45  // Sum of purchases from this search term
}
```

**UI Display:**
- "Top Search Terms" card
- Ordered by purchase count
- Helps with SEO and search optimization

### 6. Temporal Trends (Query #5)

Shows purchase patterns over time (by week):

```javascript
// Example result
{
  $value: '2024-W12',
  $f: 234,              // Total impressions that week
  $sum: 28,             // Total purchases that week
  $mean: 0.119          // CTR that week (11.9%)
}
```

**UI Display:**
- "Performance Trends" line chart
- X-axis: Week
- Y-axis: Purchase count
- Visualizes trends and seasonality

## Data Schema

The analytics feature uses three main tables:

```json
{
  "impressions": {
    "type": "table",
    "columns": {
      "product": { "type": "String", "link": "products.id" },
      "purchase": { "type": "Boolean" },
      "context": {
        "type": "Object",
        "schema": {
          "user": { "type": "String" },
          "queryPhrase": { "type": "String" },
          "week": { "type": "String" }
        }
      }
    }
  },
  "visits": {
    "type": "table",
    "columns": {
      "id": { "type": "String" },
      "user": { "type": "String", "link": "users.id" },
      "purchases": { "type": "Array", "items": { "type": "String" } }
    }
  },
  "products": {
    "type": "table",
    "columns": {
      "id": { "type": "String" },
      "name": { "type": "String" },
      "category": { "type": "String" },
      "tags": { "type": "String" },
      "price": { "type": "Decimal" }
    }
  },
  "users": {
    "type": "table",
    "columns": {
      "id": { "type": "String" },
      "tags": { "type": "Array", "items": { "type": "String" } }
    }
  }
}
```

## Demo User Interface

### Product Navigation

1. **Product Selector**
   - Previous/Next buttons to navigate through 42 products
   - Counter showing "X of 42"

2. **Product Card**
   - Product image from Kesko API
   - Product name and category
   - Tags (comma-separated list)

### Metrics Dashboard

1. **Top KPIs**
   - **Impressions**: Total product views (`sum.samples`)
   - **Purchases**: Total conversions (`sum`)
   - **CTR**: Click-through rate as percentage (`mean * 100`)

2. **Performance Trends Chart**
   - Line chart using Recharts
   - Shows purchases over time (by week)
   - Data from Query #5
   - Orange line (#FF6B35) matching design system

3. **CTR by Product Property**
   - List of product attributes with lift scores
   - Shows title, category, and tag correlations
   - Data from Query #1
   - Filters out lift = 1.0 (no correlation)

4. **Purchase % by Customer Segment**
   - List of user tags with lift scores
   - Shows demographic preferences
   - Data from Query #2
   - Color-coded positive/negative lift

5. **Shopping Basket**
   - List of products bought together
   - Shows complementary products
   - Data from Query #3
   - Lift scores indicate bundle strength

6. **Top Search Terms**
   - List of search queries leading to purchases
   - Ordered by purchase count
   - Data from Query #4
   - Helps optimize search and SEO

## Implementation Example

```javascript
// From src/app/pages/ProductPage.js
class ProductPage extends Component {
  constructor(props) {
    super(props)
    this.state = {
      product: 0,           // Current product index
      allProducts: {},      // All products loaded
      details: {},          // Current product details
      stats: {},            // Performance metrics
      analytics: null       // Batch query results (array of 5 results)
    }
  }

  componentDidMount() {
    this.fetchAllProducts()
  }

  fetchAllProducts() {
    return this.props.dataFetchers.getAllProducts()
      .then(result => {
        const allProducts = result.hits
        this.setState({
          allProducts,
          details: allProducts[this.state.product]
        })
        this.fetchProductStats()
      })
  }

  fetchProductStats() {
    return this.props.dataFetchers.getProductStats(this.state.details.id)
      .then(stats => {
        this.setState({ stats })
        this.fetchProductAnalytics()
      })
  }

  fetchProductAnalytics() {
    return this.props.dataFetchers.getProductAnalytics(this.state.details.id)
      .then(analytics => {
        // analytics is an array of 5 results from the batch query
        this.setState({ analytics })
      })
  }

  render() {
    const analytics = this.state.analytics

    return (
      <div className="ProductPage">
        {/* Navigation */}
        <button onClick={this.prev}>← Previous</button>
        <button onClick={this.next}>Next →</button>

        {/* Product Card */}
        <ProductCard details={this.state.details} />

        {/* Metrics */}
        <div className="MetricsRow">
          <MetricCard value={this.state.stats['sum.samples']} label="Impressions" />
          <MetricCard value={this.state.stats.sum} label="Purchases" highlight />
          <MetricCard value={`${(100 * this.state.stats.mean).toFixed(1)}%`} label="CTR" />
        </div>

        {/* Performance Trends Chart */}
        <LineChart data={analytics ? analytics[4].hits : []}>
          <Line dataKey="$sum" stroke="#FF6B35" />
        </LineChart>

        {/* CTR by Product Property (analytics[0]) */}
        <AnalyticsCard title="CTR by Product Property">
          {analytics && analytics[0].hits
            .filter(x => x.lift.toFixed(2) != 1)
            .map(a => {
              let label = a.related['product.name']
                ? `Title: ${a.related['product.name'].$has}`
                : a.related['product.category']
                ? `Category: ${a.related['product.category'].$has}`
                : `Tag: ${a.related['product.tags'].$has}`
              return <li>{label}: {a.lift.toFixed(2)}x</li>
            })}
        </AnalyticsCard>

        {/* Purchase % by Customer Segment (analytics[1]) */}
        <AnalyticsCard title="Purchase % by Customer Segment">
          {analytics && analytics[1].hits.map(a => (
            <li>
              {a.related['user.tags'].$has}: {a.lift.toFixed(2)}x
            </li>
          ))}
        </AnalyticsCard>

        {/* Shopping Basket (analytics[2]) */}
        {/* Top Search Terms (analytics[3]) */}
      </div>
    )
  }
}
```

## Business Applications from Demo

### 1. Customer Targeting

**What the demo shows:** Which demographics have high lift scores

**Real-world use:**
- Target email campaigns to high-affinity segments
- Customize product pages based on user demographics
- Plan inventory for specific store locations

**Example:** If "club-member" shows 1.72x lift, promote to club members via email and prioritize stock in club-heavy locations.

### 2. Product Bundling

**What the demo shows:** Which products are bought together

**Real-world use:**
- Create product bundles for higher conversion
- Recommend complementary products at checkout
- Optimize product placement in stores

**Example:** If milk shows 2.34x lift with cereal, create breakfast bundle or place them adjacent in stores.

### 3. Search Optimization

**What the demo shows:** Which search terms lead to purchases

**Real-world use:**
- Optimize product titles and descriptions for SEO
- Add search terms as metadata tags
- Improve internal search relevance

**Example:** If "organic cereal" leads to high purchases, ensure product title includes "organic" and "cereal".

### 4. Temporal Planning

**What the demo shows:** Purchase patterns by week

**Real-world use:**
- Identify seasonal trends for inventory planning
- Schedule promotions during high-demand periods
- Detect declining trends early

**Example:** If purchases spike in winter weeks, increase stock before the season and plan winter marketing.

### 5. Product Development

**What the demo shows:** Which product attributes correlate with purchases

**Real-world use:**
- Identify successful product features
- Guide new product development
- Optimize product portfolio

**Example:** If "organic" tag shows 1.45x lift across products, expand organic product line.

## Adapting This to Your Use Case

### Step 1: Define Your Analytics Queries

The demo uses 5 queries. Choose which analyses matter for your business:

**Required for most use cases:**
- Customer segmentation (Query #2 pattern)
- Temporal trends (Query #5 pattern)

**Optional based on business model:**
- Product bundling (Query #3) - for e-commerce
- Search analysis (Query #4) - for content platforms
- Attribute correlation (Query #1) - for product optimization

### Step 2: Adapt the Batch Query

Replace demo tables and fields with your own:

```javascript
// Demo version (simplified)
function getProductAnalytics(productId) {
  return aitoClient.batch([
    { from: 'impressions', where: { purchase: true }, relate: { product: productId } },
    { from: 'visits', where: { purchases: { $has: productId } }, relate: 'user.tags' },
    { from: 'visits', where: { purchases: { $has: productId } }, relate: 'purchases' },
    { from: 'impressions', where: { 'product.id': productId }, get: 'context.queryPhrase' },
    { from: 'impressions', where: { 'product.id': productId }, get: 'context.week' }
  ])
}

// Your version - Example: SaaS Feature Analytics
function getFeatureAnalytics(featureId) {
  return aitoClient.batch([
    {
      // Customer segments using this feature
      from: 'sessions',
      where: { features_used: { $has: featureId } },
      relate: 'company.industry'
    },
    {
      // What other features are used together
      from: 'sessions',
      where: { features_used: { $has: featureId } },
      relate: 'features_used'
    },
    {
      // Usage trends over time
      from: 'events',
      where: { feature_id: featureId },
      get: 'date',
      select: ['$value', { $count: true }]
    }
  ])
}

// Your version - Example: Content Analytics
function getArticleAnalytics(articleId) {
  return aitoClient.batch([
    {
      // Reader demographics
      from: 'page_views',
      where: { article_id: articleId },
      relate: 'user.demographics'
    },
    {
      // Related articles read together
      from: 'reading_sessions',
      where: { articles_read: { $has: articleId } },
      relate: 'articles_read'
    },
    {
      // Traffic sources
      from: 'page_views',
      where: { article_id: articleId },
      get: 'referrer',
      orderBy: { $count: true }
    },
    {
      // Engagement over time
      from: 'page_views',
      where: { article_id: articleId },
      get: 'date',
      select: ['$value', { $mean: { $context: 'time_spent' } }]
    }
  ])
}
```

### Step 3: Build the UI Components

Map each batch query result to a dashboard component:

| Query Result | Component Type | Visualization |
|--------------|---------------|---------------|
| Analytics[0] | Attribute Lift | List with lift scores |
| Analytics[1] | Customer Segments | List with demographics |
| Analytics[2] | Related Items | List with related products |
| Analytics[3] | Traffic Sources | Ordered list |
| Analytics[4] | Time Series | Line chart |

### Step 4: Optimize for Your Data Volume

**Small datasets (<1000 records):**
- All 5 queries run instantly (<100ms total)
- No optimization needed

**Medium datasets (1K-100K records):**
- Consider limiting results with `limit` parameter
- Cache batch results for 5-15 minutes

**Large datasets (>100K records):**
- Add indexes on frequently queried fields
- Use `limit` and pagination
- Consider time-based filtering (e.g., last 90 days)

## Technical Benefits

- **Single API Call**: All analytics in one batch request
- **Parallel Execution**: Queries run simultaneously
- **Real-Time Results**: No pre-computation or ETL
- **Automatic Joins**: Aito handles table relationships
- **Statistical Rigor**: Lift scores indicate significance

## Performance Characteristics

- **Latency**: 50-200ms for typical batch query
- **Scalability**: Handles millions of records
- **Consistency**: Real-time data, no stale caches
- **Reliability**: Automatic error handling per query

## Common Patterns

### Pattern 1: Single-Product Deep Dive
```javascript
// Comprehensive analysis of one item
batch([
  { ...segmentation_query },
  { ...basket_query },
  { ...trend_query }
])
```

### Pattern 2: Multi-Product Comparison
```javascript
// Compare multiple products side-by-side
const productIds = ['prod1', 'prod2', 'prod3']
productIds.map(id => getProductAnalytics(id))
```

### Pattern 3: Category Analytics
```javascript
// Analyze entire category
batch([
  { from: 'impressions', where: { 'product.category': 'Dairy' }, relate: 'user.tags' },
  { from: 'impressions', where: { 'product.category': 'Dairy' }, get: 'context.week' }
])
```

---

**Key Takeaway**: The demo shows how `_batch` enables comprehensive analytics dashboards with a single API call. By combining multiple query types (_relate, _query, _aggregate), you can build rich product/feature/content analytics without complex data pipelines. Adapt the 5-query pattern to your specific analytics needs.
