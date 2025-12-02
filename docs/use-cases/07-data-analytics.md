# Preference Analytics

![Preference Analytics](../screenshots/features/analytics-dashboard.png)

*Preference analytics in action: Discovering how different customer segments relate to product preferences*

**[🚀 Try Live Demo](https://demo.aito.ai/analytics)** - Explore product-customer relationships by selecting user demographics (tags, user ID) or temporal patterns (weekday). See which products are statistically more likely to be purchased.

## Overview

The data analytics feature showcases Aito.ai's `_relate` endpoint for discovering statistical correlations between customer characteristics and product preferences. By analyzing visitor session data, the system identifies which products have higher or lower purchase rates for specific user segments or time periods.

## How It Works

### Traditional vs. AI-Powered Analytics

**Traditional Analytics:**
- Requires manual SQL joins across multiple tables
- Complex aggregations and statistical calculations
- Static reports that need updating for new dimensions

**AI-Powered Analytics with Aito:**
- Single API call finds statistical relationships
- Automatic lift score calculation
- Dynamic exploration across any available dimension

### Implementation

The analytics feature uses Aito's `_relate` endpoint in a two-step process:

```javascript
// Core analytics logic from src/07-relate.js
export function relate(field, value) {
  // Build query condition for the field-value pair
  const where = {}
  where[field] = value

  // Step 1: Find statistical relationships using _relate endpoint
  return axios.post(`${config.aito.url}/api/v1/_relate`, {
    from: 'visits',        // Analyze visitor session data
    where: where,          // Filter by the specified field-value condition
    relate: 'purchases'    // Find relationships with the purchases field
  })
    .then(results => {
      // Extract product IDs from the relation results
      const productIds = results.data.hits.map(hit =>
        hit.related.purchases.$has
      )

      // Step 2: Get full product details for the related product IDs
      return axios.post(`${config.aito.url}/api/v1/_query`, {
        from: 'products',
        where: {
          id: { $or: productIds }
        }
      }).then(products => {
        // Combine lift scores with product names
        return results.data.hits.map(hit => ({
          lift: hit.lift,     // Statistical lift score
          value: products.find(p => p.id === hit.related.purchases.$has).name
        }))
      })
    })
}
```

## Key Features

### 1. Three Analysis Dimensions

The demo provides three predefined fields for analysis:

- **User Tag** (`user.tags`): Demographic segments like "young", "older", "male", "female", "club-member"
- **User ID** (`user.id`): Individual user purchase patterns (e.g., "larry", "veronica", "alice")
- **Weekday** (`weekday`): Temporal patterns like "Monday", "Saturday", etc.

### 2. Statistical Lift Scores

- **Lift > 1.0**: Product is MORE likely to be purchased by this segment
- **Lift = 1.0**: No statistical difference (average behavior)
- **Lift < 1.0**: Product is LESS likely to be purchased by this segment

Example: Lift of 1.34 means the product is 34% more likely to be purchased

### 3. Real-Time Results

- Dynamic dropdown population of available field values
- Instant correlation calculation
- Sorted by lift score (highest correlation first)

## Data Schema

The analytics feature connects three tables:

```json
{
  "visits": {
    "type": "table",
    "columns": {
      "id": { "type": "String" },
      "user": { "type": "String", "link": "users.id" },
      "purchases": { "type": "Array", "items": { "type": "String" } },
      "weekday": { "type": "String" }
    }
  },
  "users": {
    "type": "table",
    "columns": {
      "id": { "type": "String" },
      "tags": { "type": "Array", "items": { "type": "String" } }
    }
  },
  "products": {
    "type": "table",
    "columns": {
      "id": { "type": "String" },
      "name": { "type": "String" },
      "category": { "type": "String" },
      "price": { "type": "Decimal" },
      "tags": { "type": "String" }
    }
  }
}
```

## Demo Analysis Examples

### User Demographic Analysis

**Female Shoppers (default):**
```
Field: user.tags
Value: "female"

Results show products with highest lift scores:
- Yoga Mat (lift: 2.45) - 145% more likely
- Organic Face Cream (lift: 1.89) - 89% more likely
- Green Tea (lift: 1.56) - 56% more likely
```

**Club Members:**
```
Field: user.tags
Value: "club-member"

Results show products club members prefer:
- Bulk Rice (lift: 1.78) - 78% more likely
- Premium Coffee (lift: 1.52) - 52% more likely
- Organic products generally show positive lift
```

**Young Demographics:**
```
Field: user.tags
Value: "young"

Results show products young customers prefer:
- Energy Drinks (lift: 2.12) - 112% more likely
- Frozen Pizza (lift: 1.67) - 67% more likely
- Instant Noodles (lift: 1.43) - 43% more likely
```

### Temporal Pattern Analysis

**Saturday Shopping:**
```
Field: weekday
Value: "Saturday"

Results show products with weekend peaks:
- BBQ Products (lift: 1.92) - 92% more likely
- Snack Foods (lift: 1.54) - 54% more likely
- Family Packs (lift: 1.38) - 38% more likely
```

### Individual User Patterns

**User: Larry**
```
Field: user.id
Value: "larry"

Results show Larry's product preferences:
- Specific brands he favors
- Product categories he buys frequently
- Items unique to his shopping pattern
```

## Demo User Interface

### Control Panel

1. **Field Selector Dropdown**
   - Choose between: User Tag, User ID, or Weekday
   - Clean dropdown interface with clear labels

2. **Value Selector Dropdown**
   - Dynamically populated with available values for selected field
   - Automatically loads distinct values via `getDistinctValues()` API call
   - Updates when field selection changes

3. **Results Display**
   - Product list with names and lift scores
   - Sorted by lift value (highest first)
   - Color-coded visualization (positive lift highlighted)

### Workflow

1. Page loads with default: User Tag = "female"
2. User can change field (e.g., to "weekday")
3. Value dropdown auto-populates (e.g., "Monday", "Tuesday", ...)
4. User selects value (e.g., "Saturday")
5. Results update in real-time showing products correlated with Saturday shopping

## Technical Benefits

- **Two-Step Query Pattern**: Relates + Query for complete results
- **Automatic Lift Calculation**: Aito computes statistical significance
- **Linked Tables**: Seamlessly joins visits → purchases → products
- **Real-Time**: Results update instantly on selection change

## Implementation Example

```javascript
// From src/app/pages/AnalyticsPage.js
class AnalyticsPage extends Component {
  constructor(props) {
    super(props)
    this.state = {
      field: 'user.tags',      // Default field
      value: 'female',         // Default value
      results: [],             // Product list with lift scores
      availableValues: []      // Populated from API
    }
  }

  componentDidMount() {
    // Load available values for the default field
    this.fetchAvailableValues(this.state.field)
  }

  setField = (field) => {
    this.setState({
      field,
      value: this.getDefaultFieldValue(field),
      availableValues: []
    })
    this.fetchAvailableValues(field)
    this.debouncedFetchResults()
  }

  setValue = (value) => {
    this.setState({ value })
    this.debouncedFetchResults()
  }

  fetchResults = () => {
    // Call the relate function from 07-relate.js
    return this.props.dataFetchers.relate(this.state.field, this.state.value)
      .then(results => {
        this.setState({ results })
      })
  }

  fetchAvailableValues = (field) => {
    // Get distinct values for dropdown population
    return this.props.dataFetchers.getDistinctValues(field)
      .then(values => {
        this.setState({ availableValues: values })
      })
  }

  render() {
    return (
      <div className="AnalyticsPage">
        {/* Field selector */}
        <Dropdown>
          <DropdownItem onClick={() => this.setField('user.tags')}>
            User Tag
          </DropdownItem>
          <DropdownItem onClick={() => this.setField('user.id')}>
            User ID
          </DropdownItem>
          <DropdownItem onClick={() => this.setField('weekday')}>
            Weekday
          </DropdownItem>
        </Dropdown>

        {/* Value selector */}
        <Dropdown>
          {this.state.availableValues.map(value => (
            <DropdownItem onClick={() => this.setValue(value)}>
              {value}
            </DropdownItem>
          ))}
        </Dropdown>

        {/* Results display */}
        <ResultsList results={this.state.results} />
      </div>
    )
  }
}
```

## Business Applications from Demo

### 1. Customer Segmentation
**What the demo shows:** Which products appeal to specific demographic groups

**Real-world use:**
- Identify products for targeted email campaigns
- Optimize product placement in stores by customer demographics
- Plan inventory based on local customer base composition

**Example:** If "club-member" tag shows 1.78x lift for bulk products, stock more bulk items in stores with high club membership.

### 2. Temporal Optimization
**What the demo shows:** Product purchase patterns by day of week

**Real-world use:**
- Schedule promotional pricing for days when demand is highest
- Plan staffing and inventory based on daily patterns
- Optimize delivery schedules

**Example:** If Saturday shows 1.92x lift for BBQ products, increase BBQ product stock on Friday evenings.

### 3. Personalization Insights
**What the demo shows:** Individual user purchase preferences

**Real-world use:**
- Generate personalized product recommendations
- Customize email marketing content
- Tailor homepage displays

**Example:** If Larry's profile shows high lift for organic products, prioritize organic recommendations in his experience.

## Adapting This to Your Use Case

### Step 1: Identify Your Analysis Dimension

The demo uses three dimensions, but you can analyze any field in your data:

**Retail Examples:**
- Customer age group, income bracket, location
- Product category, price range, brand
- Time of day, day of week, season, holiday periods

**SaaS Examples:**
- Company size, industry, subscription tier
- Feature usage, login frequency, session duration
- Geographic region, time zone

**Healthcare Examples:**
- Patient demographics, diagnosis codes
- Treatment types, provider specialties
- Appointment types, time slots

### Step 2: Structure Your Data

You need the equivalent of these three tables:

```javascript
// 1. Session/Visit table with the dimension you want to analyze
{
  from: 'sessions',     // Your session/transaction data
  where: {
    [dimension]: value  // e.g., {customer_tier: 'premium'}
  },
  relate: 'items'      // What you want to find correlations for
}

// 2. Items table for detailed information
{
  from: 'items',       // Your products/services/outcomes
  where: {
    id: { $or: relatedIds }
  }
}
```

### Step 3: Modify the Query

Replace the demo's fields with your own:

```javascript
// Demo version
export function relate(field, value) {
  const where = {}
  where[field] = value

  return axios.post(`${config.aito.url}/api/v1/_relate`, {
    from: 'visits',
    where: where,
    relate: 'purchases'
  })
}

// Your version - Example: E-commerce
export function analyzeCustomerPreferences(segment, segmentValue) {
  const where = {}
  where[segment] = segmentValue

  return axios.post(`${config.aito.url}/api/v1/_relate`, {
    from: 'orders',           // Your transaction table
    where: where,
    relate: 'product_ids'     // Your product reference field
  })
}

// Your version - Example: SaaS
export function analyzeFeatureUsage(companyAttribute, value) {
  const where = {}
  where[companyAttribute] = value

  return axios.post(`${config.aito.url}/api/v1/_relate`, {
    from: 'user_sessions',    // Your session table
    where: where,
    relate: 'features_used'   // Your feature usage array
  })
}
```

### Step 4: Interpret Lift Scores

- **Lift = 1.5** → 50% more likely than average
- **Lift = 0.7** → 30% less likely than average
- **Lift = 1.0** → Average behavior (no correlation)

Use lift scores to:
- Prioritize products/features for specific segments
- Identify negative correlations to avoid
- Quantify the strength of relationships

## Technical Considerations

### Data Requirements
- **Minimum sample size**: At least 50-100 records per segment for reliable statistics
- **Linked tables**: Proper table linking (e.g., `link: "products.id"`)
- **Array fields**: Works with array fields like `purchases: ["item1", "item2"]`

### Performance
- **Query speed**: <100ms for typical datasets
- **Scalability**: Works with millions of records
- **Real-time**: No batch processing or pre-computation needed

### Limitations
1. **Correlation ≠ Causation**: High lift doesn't mean one causes the other
2. **Temporal snapshots**: Point-in-time analysis, not time-series
3. **Statistical significance**: Small datasets may show spurious correlations
4. **Interpretation**: Requires domain knowledge to act on results

## Common Use Case Patterns

### Pattern 1: Customer-Product Affinity
```javascript
// Find which products specific customer segments prefer
relate('customer.tags', 'premium')
// Returns: Products with high lift for premium customers
```

### Pattern 2: Temporal Demand Analysis
```javascript
// Find which products sell better on specific days/times
relate('order.dayOfWeek', 'Saturday')
// Returns: Products with weekend lift
```

### Pattern 3: Behavioral Segmentation
```javascript
// Find what users with specific behaviors do next
relate('user.behaviorTag', 'frequent-buyer')
// Returns: Products/actions frequent buyers exhibit
```

### Pattern 4: Cross-Sell Discovery
```javascript
// Find products that users with specific purchase history buy
relate('user.id', 'user_12345')
// Returns: Products this specific user is likely to purchase
```

---

**Key Takeaway**: The demo shows a simple but powerful pattern: analyze how different segments (demographics, time periods, individuals) relate to outcomes (purchases). This same pattern applies to countless business scenarios - just swap the dimension and outcome to match your use case.