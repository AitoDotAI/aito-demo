# Grocery Price Optimization Demo - Implementation Briefing

## Overview

Create a demo application for grocery store price optimization that helps store management maximize profits through data-driven pricing decisions. This demo will showcase Aito's K-NN estimation capabilities with full explainability, enabling users to understand exactly how price and demand estimates are calculated.

## Business Problem

Grocery store managers need to set optimal prices for products to maximize profitability. The challenge is balancing:
- **Price/Margin**: Higher prices increase margin per unit
- **Demand/Volume**: Lower prices typically increase units sold
- **Profit**: The ultimate goal is maximizing `margin * demand`

Key insight: Price and demand are interconnected. The optimal price isn't simply "charge as much as possible" - it requires understanding the price-demand curve and finding the sweet spot where total profit is maximized.

## Data Source & Schema

### Table: `price_history`

Historical pricing and sales data for grocery products. Each row represents a product's performance on a specific day.

#### Link Field
- `product_id` (String, link to `products.id`) - Product identifier

#### Product Fields
- `name` (Text, English analyzer) - Product name (e.g., "Pirkka banana", "Cucumber Finland")
- `category` (String) - Category code (e.g., "100")
- `category_name` (String) - Category display name (e.g., "fresh")
- `brand` (String) - Brand name or empty string for store brand
- `tags` (string[]) - Product tags (e.g., ["fresh", "fruit", "pirkka"])

#### Temporal Fields
- `timestamp` (String) - ISO timestamp (e.g., "2024-01-01T00:00:00")
- `date` (String) - Date string (e.g., "2024-01-01")
- `week` (Int) - Week number (1-52)
- `month` (Int) - Month number (1-12)
- `year` (Int) - Year
- `day_of_week` (String) - Day name (e.g., "Monday")
- `is_weekend` (Boolean) - Weekend indicator
- `is_holiday_week` (Boolean) - Holiday week indicator

#### Pricing Fields (KPI Components)
- `list_price` (Decimal) - Regular shelf price
- `sale_price` (Decimal) - **ESTIMATION TARGET 1** - Actual selling price (may include discounts)
- `discount_percentage` (Decimal) - Discount percentage applied
- `purchase_cost` (Decimal) - Store's cost to acquire the product
- `margin_percentage` (Decimal) - Calculated as `(sale_price - purchase_cost) / sale_price * 100`

#### Demand Fields (KPI Components)
- `units_sold` (Int) - **ESTIMATION TARGET 2** - Number of units sold
- `units_in_stock` (Int) - Available inventory

#### Competitive & Contextual Fields
- `competitor_avg_price` (Decimal) - Average price of same product at competing stores
- `category_products_count` (Int) - Number of products in category
- `similar_products_on_sale` (Int) - Count of similar products with active promotions
- `promotional_placement` (String) - Store placement (e.g., "normal", "endcap")
- `days_since_delivery` (Int) - Days since product delivery (freshness indicator)
- `days_until_expiry` (Int) - Days until product expires (freshness indicator)
- `weather_temp` (Decimal) - Temperature in Celsius (affects demand for certain products)

### Example Data Point

```json
{
  "product_id": "2000818700008",
  "name": "Pirkka banana",
  "category": "100",
  "category_name": "fresh",
  "brand": "",
  "tags": ["fresh", "fruit", "pirkka"],
  "date": "2024-01-06",
  "day_of_week": "Saturday",
  "is_weekend": true,
  "is_holiday_week": true,
  "sale_price": 0.1608,
  "purchase_cost": 0.10,
  "margin_percentage": 36.9,
  "units_sold": 290,
  "units_in_stock": 580,
  "competitor_avg_price": 0.17,
  "promotional_placement": "normal",
  "days_since_delivery": 2,
  "days_until_expiry": 24,
  "weather_temp": 16.2
}
```

## Dataset Characteristics

- **Total records**: ~7,560 price history entries
- **Time range**: Appears to be daily data for 2024
- **Products**: Mix of fresh produce (bananas, cucumbers, etc.)
- **Price range**: €0.09 - €0.92 (typical grocery pricing)
- **Volume range**: 0 - 500+ units per day per product

## Estimation Queries

### Query Structure

The Aito estimate API uses this format:

```json
{
  "from": "price_history",
  "where": {
    "product_id": "2000818700008",
    "is_weekend": true,
    "competitor_avg_price": 0.18
  },
  "estimate": "sale_price"
}
```

### Example 1: Estimate Sale Price

**Query:**
```json
{
  "from": "price_history",
  "where": {
    "category": "100",
    "competitor_avg_price": 0.18,
    "weather_temp": 20.0
  },
  "estimate": "sale_price",
  "select": ["estimate", "field", "neighbors_count", "$why"]
}
```

**Response:**
```json
{
  "estimate": 0.16568640513808489,
  "field": "sale_price",
  "neighbors_count": 41,
  "$why": {
    "type": "weightedAverage",
    "value": 0.16619228122234916,
    "components": [ /* 8-50 neighbors */ ]
  }
}
```

### Example 2: Estimate Units Sold (Demand)

**Query:**
```json
{
  "from": "price_history",
  "where": {
    "product_id": "2000604700007",
    "promotional_placement": "endcap",
    "is_weekend": true
  },
  "estimate": "units_sold"
}
```

**Response:**
```json
{
  "estimate": 232.0623865689299,
  "field": "units_sold",
  "neighbors_count": 50
}
```

## Explanation Structure ($why)

The `$why` field provides complete transparency into K-NN estimation through a **weighted average of neighbors**:

### Top-Level Structure

```json
{
  "type": "weightedAverage",
  "value": 0.166,
  "components": [
    {
      "weight": 1.0,
      "value": { /* neighbor explanation */ }
    }
    /* ... 7-50 more neighbors */
  ]
}
```

### Individual Neighbor Explanation

Each neighbor component has type `"neighborContext"` and contains:

```json
{
  "type": "neighborContext",
  "value": 0.1726,           // Adjusted value (after transformations)
  "original": 0.1726,        // Original value from database
  "hitScore": 2.789,         // Similarity score (higher = more similar)
  "position": "0",           // Database row position
  "adjustments": {
    "type": "exponent",      // Log scale: exp(inner) transformation
    "base": { "type": "constant", "value": 2.718281828459045 },
    "power": {
      "type": "sum",
      "terms": [
        {
          "type": "constant",
          "value": -0.0257    // Base adjustment
        },
        {
          "type": "reduction",
          "name": "weather_temp:20.0->10.236",
          "value": -0.0012    // Feature normalization
        },
        {
          "type": "reduction",
          "name": "competitor_avg_price:0.18->-1.194",
          "value": -1.174     // Linear model coefficient
        },
        {
          "type": "restoration",
          "name": "category:100",
          "value": -0.810     // Category effect
        },
        {
          "type": "mean centering",
          "name": "mean",
          "value": 0.254      // Dataset mean
        }
      ]
    }
  },
  "instance": {
    // Full instance data for this neighbor
    "product_id": "2000818700008",
    "name": "Pirkka banana",
    "category": "100",
    "sale_price": 0.1726,
    "units_sold": 170,
    "margin_percentage": 37.2,
    "competitor_avg_price": 0.18,
    "is_weekend": false,
    "weather_temp": 18.9,
    "promotional_placement": "normal",
    // ... all other fields
  }
}
```

### Explanation Components Interpretation

1. **Log Scale Transformation**: Many estimates use log scale (exp/exponent) because:
   - Prices and demand are typically log-normal distributions
   - Prevents negative predictions
   - Captures multiplicative effects (e.g., 10% price increase → X% demand decrease)

2. **Adjustment Types**:
   - `"reduction"`: Normalizes continuous variables (weather, competitor price) to model space
   - `"restoration"`: Categorical variable effects (category, product_id, placement)
   - `"mean centering"`: Base dataset average in transformed space
   - `"constant"`: Model intercept

3. **Hit Score**: Similarity metric showing how well this neighbor matches the query:
   - Based on matched categorical features
   - Higher score = more similar historical situation
   - Used for selecting top-K neighbors

## Key Use Cases for Demo

### 1. Price Optimization Scenario

**User Goal**: "What price should I set for bananas this weekend?"

**Query Parameters**:
- `product_id`: "2000818700008" (Pirkka banana)
- `is_weekend`: true
- `competitor_avg_price`: 0.17 (from market research)
- `weather_temp`: 22.0 (from forecast)
- `promotional_placement`: "normal"

**Outputs**:
- Estimated price: €0.165
- Estimated demand: 280 units
- Estimated margin: 38%
- **Profit calculation**: (0.165 - 0.10) × 280 = €18.20

**UI Should Show**:
- Price vs. Demand scatter plot with neighbors highlighted
- Profit curve (margin × demand at different price points)
- Neighbor list with their conditions and outcomes
- Explanation of why this estimate makes sense

### 2. Promotional Placement Impact

**User Goal**: "Is it worth putting cucumbers on an endcap display?"

**Compare Two Queries**:

Query A (Normal placement):
```json
{
  "product_id": "2000604700007",
  "is_weekend": true,
  "promotional_placement": "normal",
  "estimate": "units_sold"
}
```

Query B (Endcap placement):
```json
{
  "product_id": "2000604700007",
  "is_weekend": true,
  "promotional_placement": "endcap",
  "estimate": "units_sold"
}
```

**UI Should Show**:
- Side-by-side comparison
- Delta in estimated demand
- Cost-benefit analysis (increased demand vs. endcap cost)

### 3. Competitive Response

**User Goal**: "Competitor dropped banana price to €0.15. How should we respond?"

**Multi-scenario Analysis**:
- Match at €0.15
- Stay at €0.17
- Go to €0.14

For each scenario, estimate both price and demand to calculate total profit.

### 4. Weather-Based Dynamic Pricing

**User Goal**: "Should we adjust ice cream prices for the hot weekend forecast?"

Use `weather_temp` as a variable and show how demand estimates change with temperature.

## KPI Calculations

### Primary KPIs

1. **Margin per Unit** = `sale_price - purchase_cost`
2. **Margin Percentage** = `(sale_price - purchase_cost) / sale_price × 100`
3. **Volume** = `units_sold`
4. **Total Profit** = `(sale_price - purchase_cost) × units_sold`

### Derived Insights

- **Price Elasticity**: How much demand changes with price
- **Competitive Position**: Price vs. competitor average
- **Freshness Impact**: Effect of days_until_expiry on demand/price
- **Promotional Lift**: Impact of placement on volume

## Visualization Requirements

### 1. Price-Demand Scatter Plot

**Axes**:
- X-axis: `sale_price` (€0.05 - €1.00)
- Y-axis: `units_sold` (0 - 500)

**Points**:
- Blue dots: K-NN neighbors from estimate
- Red dot: Current estimate
- Size: Proportional to hit score (larger = more similar)
- Hover: Show full neighbor instance data

**Annotations**:
- Profit contour lines (margin × demand)
- Optimal price point highlighted
- Competitor price line (vertical)

### 2. Neighbor List Table

**Columns**:
- Similarity Score (hit score)
- Product Name
- Date / Day of Week
- Sale Price
- Units Sold
- Margin %
- Key Conditions (weekend, holiday, placement, etc.)
- Profit (calculated)

**Sorting**: By hit score (most similar first)

**Interaction**: Click to highlight on scatter plot

### 3. Explanation Tree/Flow

Visual representation of the adjustment calculation showing:
- Original neighbor values
- Transformations applied (log scale)
- Feature adjustments (weather, competitor price)
- Categorical effects (category, product, placement)
- Final estimate

**Format**: Sankey diagram or tree structure

### 4. Scenario Comparison Table

When user tests multiple scenarios:

| Scenario | Est. Price | Est. Demand | Margin | Profit | Change |
|----------|------------|-------------|--------|--------|--------|
| Current  | €0.17      | 250         | 37%    | €17.50 | -      |
| Option A | €0.16      | 280         | 35%    | €16.80 | -4%    |
| Option B | €0.18      | 220         | 39%    | €17.60 | +0.6%  |

## Data Flow

### User Interaction Flow

1. **Select Product** → Populate product_id, show current price/demand
2. **Set Conditions** → User selects/inputs:
   - Day of week / weekend
   - Weather forecast
   - Competitor pricing
   - Promotional placement
   - Holiday week status
3. **Get Estimates** → Run TWO queries in parallel:
   - Estimate `sale_price` given conditions
   - Estimate `units_sold` given conditions + estimated price
4. **Show Results** → Visualize:
   - Estimated outcomes
   - K-NN neighbors
   - Profit calculation
   - Explanations
5. **Refine** → User adjusts conditions, real-time re-estimation

### API Calls Required

#### 1. Get Product List
```json
{
  "from": "price_history",
  "select": ["product_id.name", "product_id.category"],
  "limit": 1000
}
```

#### 2. Estimate Price
```json
{
  "from": "price_history",
  "where": { /* user-selected conditions */ },
  "estimate": "sale_price",
  "select": ["estimate", "field", "neighbors_count", "$why"]
}
```

#### 3. Estimate Demand
```json
{
  "from": "price_history",
  "where": {
    /* user-selected conditions */
    "sale_price": /* estimated from step 2 or user override */
  },
  "estimate": "units_sold",
  "select": ["estimate", "field", "neighbors_count", "$why"]
}
```

#### 4. Get Historical Data for Visualization
```json
{
  "from": "price_history",
  "where": {
    "product_id": "2000818700008"
  },
  "select": ["sale_price", "units_sold", "margin_percentage", "date"],
  "limit": 365
}
```

## Explainability Features

### Why This Estimate?

For each estimate, the UI must clearly explain:

1. **Neighbor Selection**: "We found 41 similar historical situations"
2. **Top Contributors**: Show top 3-5 most similar neighbors with:
   - Date and conditions
   - Actual outcomes
   - Why they're similar
3. **Feature Impact**:
   - "Weekend increases demand by ~15%"
   - "Endcap placement adds ~30 units"
   - "Competitor price €0.02 lower decreases our demand by ~10 units"
4. **Confidence**: Based on:
   - Number of neighbors
   - Similarity scores
   - Variance in neighbor outcomes

### Interactive Explanation Drill-Down

User clicks on a neighbor → Show:
- Full instance details
- Similarity breakdown (which fields matched)
- Contribution to final estimate
- Historical context (was this an outlier day?)

## Edge Cases & Validation

### Handle Missing Data
- Some fields may be null/undefined
- Use nullable: true in schema
- UI should show "unknown" or allow user to specify

### Unusual Scenarios
- No neighbors found → Show baseline (dataset average) with warning
- Very few neighbors (< 5) → Show confidence warning
- High variance in neighbors → Indicate uncertainty

### Input Validation
- Price ranges: €0.05 - €5.00 (reject outliers)
- Weather: -20°C to 40°C
- Dates: Must be valid
- Competitor prices: Should be realistic

## Success Metrics for Demo

The demo should demonstrate:

1. **Accuracy**: Estimates align with business intuition (higher price → lower demand)
2. **Explainability**: User can understand WHY estimate is what it is
3. **Actionability**: User can make pricing decision based on insights
4. **Interactive**: Real-time response to parameter changes
5. **Visual**: Clear, intuitive visualizations of price-demand relationship

## Implementation Notes

### Technologies
- Use existing Aito demo stack (React + Node.js + Aito API)
- Charting library: Recharts or similar for scatter plots
- State management: React hooks for query state

### Performance
- Cache product list
- Debounce estimate queries (wait 300ms after user input)
- Show loading states during estimation

### Error Handling
- API errors → Show user-friendly message
- Invalid inputs → Inline validation
- No neighbors → Suggest relaxing conditions

### Data Freshness
- Show data date range in UI
- Indicate if historical data is old
- Suggest what-if scenarios for future dates

## Example User Journey

**Scenario**: Store manager preparing for weekend pricing

1. **Opens app** → Sees product selector
2. **Selects "Pirkka banana"** → Shows current stats (last week avg: €0.17, 250 units/day)
3. **Sets conditions**:
   - Weekend: Yes
   - Weather: 25°C (sunny forecast)
   - Competitor price: €0.16
   - Placement: Normal
4. **Clicks "Estimate"** → Shows:
   - Recommended price: €0.165
   - Expected demand: 285 units
   - Expected profit: €18.53
   - 38 similar historical situations
5. **Views scatter plot** → Sees cluster of weekend sales, hovers over points to see details
6. **Clicks top neighbor** → Sees it was last Saturday, similar weather, competitor at €0.17
7. **Adjusts scenario**: Changes placement to "endcap"
8. **Re-estimates** → Demand increases to 320 units, profit to €20.80
9. **Makes decision**: Schedule endcap placement for weekend

## Questions for Demo Developers

1. Should we allow batch scenario testing (test 10 price points at once)?
2. Do we want historical trend charts (price/demand over time for product)?
3. Should we include a "recommendation engine" that auto-suggests optimal price?
4. Do we want to export results (PDF/CSV) for management reporting?
5. Should we show confidence intervals around estimates?

## Data Preparation

The price_history table is already loaded in the Aito grocery test database. The demo can:
- Use the existing test dataset (7,560 records)
- Or generate additional synthetic data following the same schema
- Products table is linked and contains metadata

No additional data preparation should be needed - connect to the test Aito instance and start querying.
