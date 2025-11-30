# Predictive Cart Autofill

![Autofill Feature](../screenshots/features/autofill-cart.png)

*Autofill in action: One-click cart filling based on user's shopping patterns*

**[🚀 Try Live Demo](https://demo.aito.ai/cart)** - Test the predictive autofill feature in the shopping cart. Click the "Smart Cart Fill" button to see personalized product suggestions based on shopping patterns.

## Overview

The autofill feature demonstrates how Aito.ai can predict and automatically populate a shopping cart based on user behavior patterns. This time-saving feature learns from shopping history to suggest likely purchases, making routine shopping faster and more convenient.

## How It Works

### Traditional vs. Predictive Autofill

**Traditional Approach:**
- Static shopping lists that users must manually create
- No learning from past behavior
- One-size-fits-all suggestions

**Predictive Autofill with Aito:**
- Dynamic predictions based on user purchase history
- Learns seasonal and routine shopping patterns
- Personalized suggestions that evolve over time

### Implementation

The autofill feature uses Aito's `_predict` endpoint to forecast likely purchases:

```javascript
// Core autofill logic from src/05-autofill.js
export function getAutoFill(userId) {
  return axios.post(`${config.aito.url}/api/v1/_predict`, {
    from: 'visits',           // Analyze visit/session data
    where: {
      user: userId            // Filter by specific user
    },
    predict: 'purchases',     // Predict the purchases field (array of product IDs)
    exclusiveness: false,     // Users can buy multiple products
    select: ['$p', '$value']  // Return probability and product ID
  })
  .then(result => {
    // Filter to include only high-confidence predictions
    const ids = result.data.hits
      .filter(hit => hit.$p >= 0.4)  // 40%+ purchase probability
      .map(hit => hit.$value)

    return ids
  })
}
```

## Key Features

### 1. Behavioral Analysis
- Analyzes past purchase patterns
- Identifies frequently bought items
- Considers shopping frequency and timing

### 2. Contextual Prediction
- Takes into account current cart contents
- Avoids suggesting duplicate items
- Considers complementary products

### 3. Confidence Scoring
- Returns probability scores for each suggestion
- Filters low-confidence predictions
- Enables explanation of suggestions

## Data Schema

The autofill feature leverages visit and purchase history data:

```json
{
  "visits": {
    "type": "table",
    "columns": {
      "id": { "type": "String" },
      "user": { "type": "String", "link": "users.id" },
      "purchases": { "type": "Array", "items": { "type": "String" } },
      "weekday": { "type": "String" },
      "timestamp": { "type": "DateTime" }
    }
  },
  "products": {
    "type": "table",
    "columns": {
      "id": { "type": "String" },
      "name": { "type": "String" },
      "category": { "type": "String" },
      "price": { "type": "Decimal" }
    }
  },
  "users": {
    "type": "table",
    "columns": {
      "id": { "type": "String" },
      "tags": { "type": "Array", "items": { "type": "String" } },
      "timestamp": { "type": "DateTime" }
    }
  }
}
```

## User Experience

### For Different Shopping Patterns

**Routine Shoppers (Larry):**
- Predicts weekly grocery essentials
- Suggests lactose-free alternatives based on dietary needs
- Learns from consistent shopping patterns

**Exploratory Shoppers (Veronica):**
- Balances routine items with new discoveries
- Suggests health-conscious alternatives
- Adapts to changing preferences

**Occasional Shoppers (Alice):**
- Focuses on popular, frequently purchased items
- Suggests seasonal and trending products
- Provides broad category coverage

## Technical Benefits

- **Behavioral Learning**: Adapts to user's shopping patterns over time
- **Context Awareness**: Considers current cart and session data
- **Confidence Scoring**: Each suggestion includes probability score
- **Personalization**: Unique suggestions for each user profile

## Implementation Example

```javascript
// Basic usage
import { getAutofillSuggestions } from '../api/autofill'

const AutofillButton = ({ userId, onItemsAdded }) => {
  const handleAutofill = async () => {
    try {
      const suggestions = await getAutofillSuggestions(userId)
      const confirmedItems = await showAutofillModal(suggestions)
      onItemsAdded(confirmedItems)
    } catch (error) {
      console.error('Autofill failed:', error)
    }
  }

  return (
    <button onClick={handleAutofill}>
      Autofill Cart
    </button>
  )
}
```

## Business Value

### Customer Benefits
- **Convenience**: One-click shopping for routine purchases
- **Discovery**: Find new products aligned with preferences
- **Time Savings**: Substantially reduce shopping time

### Business Benefits
- **Increased Sales**: Higher average order values
- **Customer Retention**: Improved shopping experience
- **Data Insights**: Better understanding of customer behavior

## Technical Considerations

### Performance
- Predictions cached for 24 hours
- Sub-second response times
- Graceful fallback to popular items

### Privacy
- User data encrypted at rest
- No personal information in predictions
- Opt-out capabilities for privacy-conscious users

### Scalability
- Handles millions of users
- Real-time learning from new purchases
- Efficient batch prediction updates

## Next Steps

1. **Seasonal Intelligence**: Incorporate weather and calendar data
2. **Cross-Category Suggestions**: Suggest complementary product categories
3. **Budget Awareness**: Consider user spending patterns
4. **Mobile Optimization**: Enhance mobile autofill experience
5. **Voice Integration**: "Fill my usual cart" voice commands