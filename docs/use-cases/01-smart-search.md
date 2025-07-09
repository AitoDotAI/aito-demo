# Smart Search with Personalization

![Smart Search Example](../screenshots/features/search-milk-results.png)

*Smart search in action: "milk" query showing personalized lactose-free results for Larry*

## Overview

The smart search feature demonstrates how Aito.ai's predictive database can transform basic text search into an intelligent, personalized experience. Unlike traditional keyword matching, this implementation considers user behavior patterns to deliver more relevant results.

## How It Works

### Traditional Search vs. Smart Search

**Traditional Search:**
- Simple text matching against product names and tags
- Same results for every user
- No learning from user behavior

**Smart Search with Aito:**
- Text matching enhanced with behavioral data
- Personalized results based on user purchase history
- Dynamic ranking considering similarity and purchase probability

### Implementation

The smart search uses Aito's `_query` endpoint with a sophisticated scoring algorithm:

```javascript
// Core search logic from src/api/search.js
const where = {
  product: {
    $or: [
      { tags: { $match: inputValue } },
      { name: { $match: inputValue } },
    ],
  },
}

// Add user context for personalization
if (userId) {
  where['context.user'] = String(userId)
}

// Ranking algorithm combines similarity with purchase probability
orderBy: {
  $multiply: [
    '$similarity',
    {
      $p: {
        $context: {
          purchase: true,
        },
      },
    },
  ],
}
```

## Key Features

### 1. Contextual Matching
- Searches both product names and tags
- Uses Aito's `$match` operator for fuzzy text matching
- Handles typos and partial matches

### 2. Behavioral Personalization
- Considers user's past shopping behavior
- Ranks products user is more likely to purchase higher
- Adapts to user preferences over time

### 3. Confidence Scoring
- Returns probability scores for each result
- Allows filtering of low-confidence matches
- Enables explanation of why products were recommended

## Data Schema

The search leverages three main data tables:

```json
{
  "impressions": {
    "type": "table",
    "columns": {
      "session": { "type": "String", "link": "sessions.id" },
      "product": { "type": "String", "link": "products.id" },
      "purchase": { "type": "Boolean" }
    }
  },
  "products": {
    "type": "table",
    "columns": {
      "id": { "type": "String" },
      "name": { "type": "Text", "analyzer": "English" },
      "tags": { "type": "Text", "analyzer": "Whitespace" },
      "price": { "type": "Decimal" }
    }
  },
  "sessions": {
    "type": "table",
    "columns": {
      "id": { "type": "String" },
      "user": { "type": "String", "link": "users.username" }
    }
  }
}
```

## User Experience

### For Different User Personas

**Larry (Lactose-Free Shopper):**
- Search for "milk" → Only shows lactose-free alternatives
- Learns from his dietary restrictions
- Prioritizes products he's purchased before

**Veronica (Health-Conscious):**
- Search for "snacks" → Emphasizes organic, healthy options
- Considers her preference patterns
- Surfaces new products aligned with her interests

**Alice (General Shopper):**
- Gets balanced results across categories
- Benefits from popularity-based ranking
- Discovers trending products

## Technical Benefits

- **Personalization**: Results adapt to user purchase history
- **Relevance**: Combines text similarity with behavioral data
- **Implementation**: Single API call with scoring logic
- **Discovery**: Surfaces products aligned with user preferences

## Implementation Example

```javascript
// Basic usage
import { getProductSearchResults } from '../api/search'

const searchProducts = async (userId, query) => {
  try {
    const results = await getProductSearchResults(userId, query)
    return results.map(product => ({
      ...product,
      // Results include: name, id, tags, price, $matches
      highlights: product["$matches"] || [] // Match highlights
    }))
  } catch (error) {
    console.error('Search failed:', error)
    return []
  }
}
```

## Next Steps

1. **Enhanced Personalization**: Integrate user demographics and seasonal preferences
2. **Real-time Learning**: Update user models based on search interactions
3. **Multi-language Support**: Extend search to handle multiple languages
4. **Voice Search**: Add speech-to-text integration for voice queries
5. **Visual Search**: Enable image-based product discovery