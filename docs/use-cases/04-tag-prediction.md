# Automatic Tag Prediction

![Tag Prediction Interface](../screenshots/features/tag-prediction.png)

*AI-powered tag suggestion interface for automatic product categorization*

**[🚀 Try Live Demo](https://aito-demo.azurewebsites.net/admin)** - Experience automatic tag prediction by exploring the product catalog. See how AI suggests relevant tags based on product names and descriptions.

## Overview

Tag prediction demonstrates how Aito.ai can automatically categorize and label products based on their names and descriptions. This feature dramatically reduces manual catalog management work while improving consistency and discoverability.

## The Challenge

### Manual Tagging Problems
- **Time-consuming**: Manually tagging thousands of products takes weeks
- **Inconsistent**: Different people apply tags differently
- **Incomplete**: Products often miss relevant tags
- **Maintenance burden**: New products require constant attention

### Business Impact
- Significant e-commerce resources spent on catalog management
- Many products have missing or incorrect tags
- Poor search results due to inconsistent tagging
- Lost sales from undiscoverable products

## The Solution: AI-Powered Tag Prediction

Aito.ai learns from your existing product-tag relationships to automatically suggest tags for new products:

```javascript
// Core prediction logic from src/api/predictions.js
export function getTagSuggestions(productName) {
  return axios.post(`${config.aito.url}/api/v1/_predict`, {
    from: 'products',
    where: {
      name: productName
    },
    predict: 'tags',
    exclusiveness: false,  // Allow multiple tags
    limit: 10
  })
}
```

## How It Works

### 1. Pattern Recognition
Aito analyzes existing product-tag relationships to identify patterns:
- "Organic" appears in products tagged with 'organic', 'healthy', 'natural'
- "Chocolate" correlates with 'sweet', 'dessert', 'cocoa'
- "Milk" associates with 'dairy', 'beverage', 'breakfast'

### 2. Contextual Understanding
The system considers the full product name context:
- "Dark Chocolate" → ['chocolate', 'dark', 'premium', 'cocoa']
- "Milk Chocolate" → ['chocolate', 'milk', 'sweet', 'kids']
- "Chocolate Milk" → ['beverage', 'dairy', 'chocolate', 'kids']

### 3. Confidence Scoring
Each predicted tag comes with a confidence score:
```javascript
// Filter predictions by confidence
predictions.filter(tag => tag.$p > 0.5)
```

## Implementation Examples

### Basic Tag Prediction
```javascript
// Predict tags for a new product
const newProduct = "Organic Almond Butter Smooth 350g"
const tags = await getTagSuggestions(newProduct)

// Result:
[
  { feature: "organic", $p: 0.95 },
  { feature: "nuts", $p: 0.92 },
  { feature: "healthy", $p: 0.88 },
  { feature: "protein", $p: 0.85 },
  { feature: "spread", $p: 0.82 },
  { feature: "breakfast", $p: 0.75 }
]
```

### Batch Processing
```javascript
// Process multiple products efficiently
const processNewProducts = async (products) => {
  const taggedProducts = await Promise.all(
    products.map(async (product) => {
      const suggestions = await getTagSuggestions(product.name)
      return {
        ...product,
        suggestedTags: suggestions
          .filter(tag => tag.$p > 0.7)  // High confidence only
          .map(tag => tag.feature),
        needsReview: suggestions.some(tag => tag.$p < 0.7 && tag.$p > 0.5)
      }
    })
  )
  return taggedProducts
}
```

### Human-in-the-Loop Workflow
```javascript
// Semi-automated tagging with human review
const tagWorkflow = {
  autoApprove: (confidence) => confidence > 0.85,
  requireReview: (confidence) => confidence > 0.5 && confidence <= 0.85,
  reject: (confidence) => confidence <= 0.5
}

const processWithReview = async (product) => {
  const suggestions = await getTagSuggestions(product.name)
  
  return {
    product: product.name,
    autoTags: suggestions.filter(t => tagWorkflow.autoApprove(t.$p)),
    reviewTags: suggestions.filter(t => tagWorkflow.requireReview(t.$p)),
    stats: {
      totalSuggestions: suggestions.length,
      autoApproved: suggestions.filter(t => t.$p > 0.85).length,
      needsReview: suggestions.filter(t => t.$p > 0.5 && t.$p <= 0.85).length
    }
  }
}
```

## Advanced Features

### 1. Context-Aware Suggestions
Consider product category and brand in predictions:
```javascript
const contextualPrediction = {
  from: 'products',
  where: {
    name: productName,
    category: productCategory,
    brand: productBrand
  },
  predict: 'tags'
}
```

### 2. Batch Processing Optimization
Process multiple products efficiently:
```javascript
const batchTagPrediction = async (products) => {
  // Process in smaller batches to avoid API limits
  const batchSize = 10
  const results = []
  
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(product => getTagSuggestions(product.name))
    )
    results.push(...batchResults)
  }
  
  return results
}
```

### 3. Quality Control Workflows
Implement confidence-based review processes:
```javascript
const qualityControl = {
  autoApprove: (confidence) => confidence > 0.85,
  flagForReview: (confidence) => confidence > 0.5 && confidence <= 0.85,
  reject: (confidence) => confidence <= 0.5
}
```

## Use Cases Across Industries

### E-commerce
- **Fashion**: Size, color, style, season, material
- **Electronics**: Features, compatibility, use-case
- **Books**: Genre, topic, audience, difficulty

### Content Management
- **Articles**: Topics, sentiment, audience, SEO tags
- **Images**: Objects, colors, style, mood
- **Videos**: Content type, duration category, audience

### Document Processing
- **Invoices**: Department, category, urgency
- **Support Tickets**: Issue type, priority, skills needed
- **Emails**: Topic, sentiment, action required

## Technical Benefits

### Prediction Quality
- **Confidence Scoring**: Each prediction includes probability score
- **Multiple Suggestions**: Returns ranked list of relevant tags
- **Context Awareness**: Considers product name, category, and existing tags

### Implementation
- **Batch Processing**: Efficient handling of large product catalogs
- **API Integration**: Single endpoint for all prediction needs
- **Flexible Thresholds**: Configurable confidence levels

### Operational Impact
- **Automation**: Reduces manual tagging effort
- **Consistency**: Standardizes tag vocabulary across products
- **Discoverability**: Improves product search and categorization

## Best Practices

### 1. Training Data Quality
```javascript
// Good training example
{
  "name": "Green Valley Organic Whole Milk 1L",
  "tags": "organic dairy milk whole beverage breakfast"
}

// Poor training example  
{
  "name": "Milk",
  "tags": "product"
}
```

### 2. Confidence Thresholds
- **>0.9**: Auto-apply without review
- **0.7-0.9**: Apply with flag for review
- **0.5-0.7**: Suggest for manual review
- **<0.5**: Ignore suggestion

### 3. Continuous Improvement
```javascript
// Track and learn from corrections
const improveModel = async (productId, suggestedTags, approvedTags) => {
  const corrections = {
    product: productId,
    suggested: suggestedTags,
    approved: approvedTags,
    rejected: suggestedTags.filter(t => !approvedTags.includes(t)),
    added: approvedTags.filter(t => !suggestedTags.includes(t))
  }
  
  // Feed back to improve predictions
  await submitCorrections(corrections)
}
```

## Integration Examples

### React Component
```jsx
const TagSuggestionComponent = ({ productName, onTagsSelected }) => {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  
  const getSuggestions = async () => {
    setLoading(true)
    try {
      const tags = await getTagSuggestions(productName)
      setSuggestions(tags)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="tag-suggestions">
      <button onClick={getSuggestions} disabled={loading}>
        Get Tag Suggestions
      </button>
      
      {suggestions.map(tag => (
        <TagChip
          key={tag.feature}
          label={tag.feature}
          confidence={tag.$p}
          onSelect={() => onTagsSelected(tag.feature)}
        />
      ))}
    </div>
  )
}
```

### Bulk Import Pipeline
```javascript
const bulkImportWithTags = async (csvFile) => {
  const products = await parseCSV(csvFile)
  
  const enrichedProducts = await Promise.all(
    products.map(async (product) => {
      const tags = await getTagSuggestions(product.name)
      return {
        ...product,
        tags: tags
          .filter(t => t.$p > 0.8)
          .map(t => t.feature)
          .join(' ')
      }
    })
  )
  
  await importToDatabase(enrichedProducts)
  return {
    total: products.length,
    tagged: enrichedProducts.filter(p => p.tags).length
  }
}
```

## Technical Limitations

1. **Training Data Dependency**: Quality depends on existing product-tag relationships
2. **Cold Start Problem**: New product categories may have poor predictions initially
3. **Tag Vocabulary Control**: No automatic prevention of tag proliferation
4. **Context Limitations**: Cannot understand complex product relationships
5. **Language Constraints**: Works best with consistent language in product names

## Conclusion

Automatic tag prediction provides a practical approach to catalog management by leveraging existing product-tag relationships. The system works best when combined with human review workflows and proper training data curation.