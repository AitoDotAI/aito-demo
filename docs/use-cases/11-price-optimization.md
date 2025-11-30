# Price Optimization & Demand Forecasting

![Price Optimization](../screenshots/features/price-optimization.png)

*Price optimization dashboard showing demand forecasts, profit maximization, and explainable price-demand relationships*

**[🚀 Try Live Demo](https://demo.aito.ai/pricing)** - Experience AI-powered pricing. Set product conditions and see optimal price recommendations with demand forecasts and profit projections.

## Overview

The price optimization feature demonstrates how Aito.ai's `_estimate` endpoint enables data-driven pricing decisions without complex modeling infrastructure. By analyzing historical price-demand relationships and contextual factors, retailers can maximize profit while maintaining competitive positioning.

## How It Works

### Traditional vs. AI-Powered Price Optimization

**Traditional Pricing:**
- Manual price setting based on gut feel
- Simple cost-plus markup formulas
- Reactive competitor price matching
- Limited consideration of demand elasticity
- Slow response to market changes

**AI-Powered Pricing with Aito:**
- Automatic price-demand curve estimation
- Multi-factor optimization (day, season, placement, competition)
- Real-time profit maximization
- Explainable recommendations with regression analysis
- Instant what-if scenario testing

### Implementation

The pricing system uses both K-NN and regression-based estimation:

```javascript
// Core price optimization logic
const optimizePrice = async (productConditions) => {
  // Estimate optimal price given conditions
  const priceEstimate = await aitoClient.estimate({
    from: 'price_history',
    where: {
      product_id: 'milk_organic',
      day_of_week: 'Friday',
      is_weekend: false,
      promotional_placement: 'normal',
      competitor_avg_price: 2.99
    },
    estimate: 'sale_price',
    select: ['estimate', 'why']
  })

  // Estimate demand at the recommended price
  const demandEstimate = await aitoClient.estimate({
    from: 'price_history',
    where: {
      ...productConditions,
      sale_price: priceEstimate.estimate
    },
    estimate: 'units_sold',
    select: ['estimate', 'why']
  })

  // Get regression-based explanation
  const priceExplanation = await aitoClient.estimate({
    from: 'price_history',
    where: productConditions,
    estimate: 'sale_price',
    model: 'regression',  // Use regression for clearer explanations
    select: ['estimate', 'why']
  })

  // Calculate profit
  const margin = priceEstimate.estimate - productConditions.purchase_cost
  const profit = margin * demandEstimate.estimate

  return {
    recommendedPrice: priceEstimate.estimate,
    expectedDemand: demandEstimate.estimate,
    estimatedProfit: profit,
    marginPercent: (margin / priceEstimate.estimate) * 100,
    explanation: priceExplanation.why,
    neighbors: priceEstimate.why.components
  }
}
```

## Key Features

### 1. Multi-Factor Price Estimation
- **Product Attributes**: Category, brand, cost
- **Temporal Factors**: Day of week, weekend, holiday season
- **Competitive Context**: Competitor pricing, promotional placement
- **Environmental**: Weather, temperature, seasonality
- **Expiry Management**: Days until expiration for perishables

### 2. Demand Forecasting
- **Price Elasticity**: How demand changes with price
- **Cross-Price Effects**: Impact of competitor pricing
- **Temporal Patterns**: Day-of-week and seasonal trends
- **Promotion Response**: Lift from featured placement
- **Customer Segments**: Demand by demographic groups

### 3. Explainable AI
- **Regression Explanations**: Progressive factor breakdown
- **Base Value**: Starting point from historical mean
- **Factor Effects**: Percentage impact of each condition
- **History Adjustment**: Fine-tuning from similar cases
- **Visual Table**: Running totals showing calculation

### 4. Interactive What-If Analysis
- **Price-Demand Curves**: Visualize elasticity
- **Profit Optimization**: Find maximum profit point
- **Scenario Testing**: Toggle between original and adjusted values
- **Neighbor Analysis**: See similar historical cases
- **Real-Time Updates**: Instant recalculation on changes

## Data Schema

The pricing system uses a comprehensive price history table:

```json
{
  "price_history": {
    "type": "table",
    "columns": {
      "product_id": { "type": "String" },
      "product_name": { "type": "String" },
      "category": { "type": "String" },
      "brand": { "type": "String" },
      "purchase_cost": { "type": "Decimal" },

      "sale_price": { "type": "Decimal" },
      "units_sold": { "type": "Int" },
      "revenue": { "type": "Decimal" },
      "margin_percentage": { "type": "Decimal" },

      "date": { "type": "String" },
      "day_of_week": { "type": "String" },
      "is_weekend": { "type": "Boolean" },
      "is_holiday_week": { "type": "Boolean" },

      "competitor_avg_price": { "type": "Decimal" },
      "promotional_placement": { "type": "String" },

      "weather_temp": { "type": "Decimal" },
      "days_until_expiry": { "type": "Int" }
    }
  },
  "products": {
    "type": "table",
    "columns": {
      "id": { "type": "String" },
      "name": { "type": "String" },
      "category": { "type": "String" },
      "cost": { "type": "Decimal" }
    }
  }
}
```

## Pricing Workflows

### Standard Price Optimization Flow

1. **Context Selection**
   - Choose product to price
   - Set temporal context (day, season)
   - Define competitive environment
   - Specify promotional strategy

2. **Price Estimation**
   - AI recommends optimal price
   - Forecasts expected demand
   - Calculates projected profit
   - Shows price-demand curve

3. **Explainability Analysis**
   - Review factor contributions
   - Understand base value calculation
   - See category/product effects
   - Examine similar historical cases

4. **Decision & Implementation**
   - Compare against current price
   - Test what-if scenarios
   - Validate with business rules
   - Apply pricing decision

### Advanced Optimization Scenarios

**Seasonal Pricing:**
- Adjust for holiday demand patterns
- Optimize clearance pricing strategies
- Plan promotional calendar
- Maximize seasonal revenue

**Competitive Response:**
- React to competitor price changes
- Maintain market share targets
- Optimize price positioning
- Balance volume vs. margin

**Inventory Clearance:**
- Price perishables by days to expiry
- Optimize markdown timing
- Minimize waste while maximizing revenue
- Dynamic pricing for aging inventory

## Technical Benefits

- **Real-Time Estimation**: <100ms prediction latency
- **No Training Required**: Works immediately with historical data
- **Multi-Model Support**: K-NN for accuracy, regression for explainability
- **Neighbor Analysis**: See which cases influenced prediction
- **Profit Maximization**: Automatic margin × demand optimization

## Implementation Example

```javascript
// React component for price optimization
import {
  estimatePrice,
  estimateDemand,
  estimatePriceRegression
} from '../api/12-price-estimation'

const PriceOptimizer = ({ product }) => {
  const [conditions, setConditions] = useState({
    product_id: product.id,
    purchase_cost: product.cost,
    day_of_week: 'Friday',
    is_weekend: false
  })

  const [results, setResults] = useState(null)

  const optimize = async () => {
    // Get KNN-based price estimate
    const priceResult = await estimatePrice(conditions)

    // Get regression explanation
    const priceExplanation = await estimatePriceRegression(conditions)

    // Estimate demand at recommended price
    const demandConditions = {
      ...conditions,
      sale_price: priceResult.estimate
    }
    const demandResult = await estimateDemand(demandConditions)
    const demandExplanation = await estimateDemandRegression(demandConditions)

    // Calculate profit
    const margin = priceResult.estimate - conditions.purchase_cost
    const profit = margin * demandResult.estimate

    setResults({
      price: priceResult.estimate,
      demand: demandResult.estimate,
      profit: profit,
      priceWhy: parseRegressionExplanation(priceExplanation),
      demandWhy: parseRegressionExplanation(demandExplanation),
      neighbors: extractNeighbors(priceResult, demandResult)
    })
  }

  return (
    <div>
      <ConditionSelector
        conditions={conditions}
        onChange={setConditions}
      />

      <button onClick={optimize}>Optimize Price</button>

      {results && (
        <>
          <KPICards
            price={results.price}
            demand={results.demand}
            profit={results.profit}
            priceExplanation={results.priceWhy}
            demandExplanation={results.demandWhy}
          />

          <PriceDemandChart
            neighbors={results.neighbors}
            estimate={{
              price: results.price,
              demand: results.demand
            }}
          />

          <NeighborEvidence
            neighbors={results.neighbors}
            showAdjusted={true}
          />
        </>
      )}
    </div>
  )
}
```

## Business Value

### Revenue Optimization
- **Profit Maximization**: Find optimal price point for each product
- **Dynamic Pricing**: Adapt to market conditions in real-time
- **Margin Protection**: Balance volume and margin goals
- **Competitive Positioning**: Maintain market share while maximizing profit

### Efficiency Gains
- **Automated Decisions**: Reduce manual pricing effort by 80%
- **Faster Response**: React to market changes instantly
- **Data-Driven**: Eliminate guesswork from pricing
- **Scalable**: Price thousands of SKUs effortlessly

### Risk Reduction
- **Demand Forecasting**: Reduce stockouts and overstock
- **Waste Minimization**: Optimize perishable pricing
- **Competitive Intelligence**: Factor in competitor moves
- **Explainable**: Understand why prices are recommended

## Advanced Features

### Regression-Based Explainability

The system provides two estimation approaches:

**K-NN Estimation (Accuracy):**
- Finds similar historical cases
- Weights by similarity score
- Adjusts for condition differences
- Highly accurate predictions

**Regression Estimation (Explainability):**
- Clear factor breakdown
- Percentage effects shown
- Progressive calculation display
- Business-friendly explanations

**Example Explanation Table:**

| Factor | Effect | Running Total |
|--------|--------|---------------|
| Base (mean) | — | €2.50 |
| Product: Organic Milk | ↑ +15.2% | €2.88 |
| Category: Dairy | ↑ +8.3% | €3.12 |
| Day: Friday | ↓ -5.1% | €2.96 |
| Weekend: No | ↑ +2.4% | €3.03 |
| Competitor: €2.99 | ↓ -3.2% | €2.93 |
| History adjustment | ↑ +4.8% | **€3.07** |

### Neighbor Analysis

Each prediction includes similar historical cases:

```javascript
{
  "neighbors": [
    {
      "hitScore": 9.82,
      "instance": {
        "product_id": "milk_organic",
        "sale_price": 2.95,
        "units_sold": 142,
        "day_of_week": "Friday",
        "promotional_placement": "normal"
      },
      "adjustedPrice": 3.07,
      "adjustedDemand": 138,
      "weight": 0.85
    }
    // ... more neighbors
  ]
}
```

### Price-Demand Curve Visualization

The system generates curves by:
1. Estimating demand at multiple price points
2. Calculating profit at each point
3. Identifying maximum profit price
4. Visualizing elasticity relationships

## Use Cases by Industry

### Grocery Retail
- Fresh produce with expiry dates
- Competitive pricing for staples
- Promotional planning
- Seasonal demand optimization

### E-Commerce
- Dynamic pricing by traffic patterns
- Competitor-aware pricing
- Flash sale optimization
- Inventory clearance

### Hospitality
- Room rate optimization
- Seasonal demand management
- Event-based pricing
- Occupancy maximization

### Transportation
- Seat pricing by demand
- Route optimization
- Time-based pricing
- Capacity management

## Technical Considerations

### Estimation Models

**K-NN Model:**
- Best for: High accuracy predictions
- Considers: All contextual factors
- Output: Adjusted values from similar cases
- Use when: Final pricing decisions needed

**Regression Model:**
- Best for: Explainability and transparency
- Shows: Factor-by-factor breakdown
- Output: Clear percentage effects
- Use when: Stakeholders need justification

### Performance

- **Latency**: <100ms for typical queries
- **Scalability**: Handles millions of price history records
- **Freshness**: Real-time updates as new data arrives
- **Throughput**: Supports concurrent pricing requests

## Best Practices

### Data Quality
- **Historical Coverage**: Maintain 6-12 months of price history
- **Condition Completeness**: Capture all relevant factors
- **Regular Updates**: Sync competitive and weather data daily
- **Cleansing**: Remove outliers and data errors

### Pricing Strategy
- **Test Gradually**: Start with non-critical products
- **Monitor Results**: Track actual vs. predicted outcomes
- **Set Bounds**: Apply business rules for min/max prices
- **Review Regularly**: Evaluate model performance weekly

### Explainability
- **Show Reasoning**: Always display factor breakdowns
- **Validate Logic**: Ensure effects align with intuition
- **Document Decisions**: Record why prices were set
- **Train Users**: Help teams understand AI recommendations

## Limitations & Considerations

1. **Historical Data Required**: Needs sufficient price-demand history
2. **Contextual Completeness**: Missing factors reduce accuracy
3. **Market Changes**: May not predict unprecedented events
4. **Competitor Data**: Requires regular competitive intelligence
5. **Business Rules**: Should augment, not replace, pricing policies

## ROI Metrics

Track these KPIs to measure pricing optimization impact:

- **Revenue per SKU**: Compare before/after implementation
- **Margin %**: Track profitability improvements
- **Sell-through Rate**: Measure inventory turnover
- **Waste Reduction**: Quantify perishable losses avoided
- **Pricing Speed**: Time to update prices across catalog
- **Forecast Accuracy**: Predicted vs. actual demand correlation

---

**Pro Tip**: Start by optimizing high-volume products where small margin improvements generate significant revenue. Use regression explanations to build stakeholder trust, then scale to automated pricing for your entire catalog.
