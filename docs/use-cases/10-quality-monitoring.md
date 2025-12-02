# Model Quality

![Model Quality](../screenshots/features/quality-monitoring.png)

*Model quality dashboard showing performance metrics and case-by-case analysis*

**[🚀 Try Live Demo](https://demo.aito.ai/evaluation)** - Experience AI model evaluation. Monitor prediction accuracy, response times, and analyze individual predictions vs actual outcomes.

## Overview

The quality monitoring feature demonstrates how Aito.ai's built-in `_evaluate` endpoint enables continuous model performance tracking without separate testing infrastructure. By automatically splitting data into train/test sets and measuring key metrics, teams can ensure their ML applications maintain high accuracy over time.

## How It Works

### Traditional vs. Aito Model Evaluation

**Traditional ML Evaluation:**
- Manual train/test split management
- Separate evaluation pipelines
- Complex cross-validation setups
- Delayed feedback on model performance
- Version control for test datasets

**AI-Powered Evaluation with Aito:**
- Automatic train/test splitting via index-based queries
- Real-time performance metrics
- Case-by-case analysis with explanations
- Instant feedback on prediction quality
- No separate infrastructure needed

### Implementation

The evaluation system uses Aito's `_evaluate` endpoint:

```javascript
// Core evaluation logic
const evaluateModel = async (config) => {
  // Define test set using index-based split
  const testPercentage = (100 - config.trainSplit) / 100
  const testIndices = generateTestIndices(totalRecords, testPercentage)

  // Build evaluation query
  const query = {
    test: {
      $or: testIndices.map(idx => ({ $index: idx }))
    },
    evaluate: {
      from: 'invoices',
      where: {
        Description: { $get: 'Description' },
        Amount: { $get: 'Amount' }
      },
      predict: 'Processor'
    },
    select: [
      'accuracy',
      'meanRank',
      'meanMs',
      'trainSamples',
      'testSamples',
      'cases'
    ]
  }

  // Run evaluation
  const response = await aitoClient.evaluate(query)

  return {
    accuracy: response.accuracy,
    meanRank: response.meanRank,
    responseTime: response.meanMs,
    trainSize: response.trainSamples,
    testSize: response.testSamples,
    cases: response.cases
  }
}
```

## Key Features

### 1. Automated Performance Metrics
- **Accuracy**: Overall prediction correctness rate
- **Mean Rank**: Average position of correct answer
- **Response Time**: Mean prediction latency in milliseconds
- **Sample Counts**: Train and test set sizes

### 2. Case-by-Case Analysis
- Individual prediction vs actual comparison
- Confidence scores for each prediction
- Input features used for each case
- Identification of misclassifications

### 3. Flexible Test Splitting
- Index-based deterministic splitting
- Configurable train/test ratios (e.g., 90/10, 80/20)
- Reproducible test sets via seeded randomization
- Support for time-based splits

### 4. Real-Time Monitoring
- Live evaluation execution
- Instant metric updates
- Performance trend visualization
- Configurable evaluation schedules

## Data Schema

The evaluation system works with any Aito table structure:

```json
{
  "invoices": {
    "type": "table",
    "columns": {
      "id": { "type": "String" },
      "Description": { "type": "Text", "analyzer": "English" },
      "Amount": { "type": "Decimal" },
      "Vendor": { "type": "String" },
      "Processor": { "type": "String", "link": "employees.id" },
      "GLCode": { "type": "String" }
    }
  }
}
```

## Evaluation Workflows

### Standard Evaluation Flow

1. **Configuration**
   - Select prediction target field
   - Choose input features
   - Set train/test split ratio
   - Define evaluation metrics

2. **Test Set Generation**
   - Automatic index-based splitting
   - Deterministic sampling for reproducibility
   - Balanced distribution across categories

3. **Evaluation Execution**
   - Train on training subset
   - Predict on test subset
   - Calculate performance metrics
   - Generate case-by-case analysis

4. **Results Analysis**
   - Review overall accuracy
   - Examine response times
   - Identify error patterns
   - Investigate misclassifications

### Continuous Monitoring

**Scheduled Evaluations:**
- Periodic automatic evaluation runs
- Performance drift detection
- Alert on accuracy degradation
- Historical metric tracking

**A/B Testing:**
- Compare different feature combinations
- Test query variations
- Measure impact of data updates
- Optimize prediction strategies

## Technical Benefits

- **No Separate Infrastructure**: Built directly into query API
- **Real-Time Results**: Instant evaluation execution
- **Deterministic Splits**: Reproducible test sets
- **Explainable Results**: Case-by-case prediction analysis
- **Scalable**: Works with datasets from hundreds to millions of records

## Implementation Example

```javascript
// React component usage
import { evaluateModel } from '../api/11-evaluate'

const QualityMonitor = () => {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(false)

  const runEvaluation = async () => {
    setLoading(true)
    try {
      // Define evaluation configuration
      const config = {
        trainSplit: 90,  // 90% train, 10% test
        selectedFields: ['Description', 'Amount', 'Vendor'],
        predictTarget: 'Processor'
      }

      // Run evaluation
      const results = await evaluateModel(config)
      setMetrics(results)

      // Check if performance is acceptable
      if (results.accuracy < 0.8) {
        alert('Warning: Model accuracy below 80%')
      }
    } catch (error) {
      console.error('Evaluation failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={runEvaluation} disabled={loading}>
        {loading ? 'Evaluating...' : 'Run Evaluation'}
      </button>

      {metrics && (
        <div>
          <MetricCard
            title="Accuracy"
            value={`${(metrics.accuracy * 100).toFixed(1)}%`}
          />
          <MetricCard
            title="Mean Rank"
            value={metrics.meanRank.toFixed(2)}
          />
          <MetricCard
            title="Response Time"
            value={`${metrics.responseTime.toFixed(0)}ms`}
          />

          <CaseAnalysisTable cases={metrics.cases} />
        </div>
      )}
    </div>
  )
}
```

## Business Value

### Quality Assurance
- **Confidence**: Quantifiable model performance
- **Reliability**: Continuous accuracy monitoring
- **Transparency**: Clear understanding of prediction quality

### Cost Efficiency
- **No MLOps**: Eliminate separate evaluation infrastructure
- **Fast Iteration**: Instant feedback on changes
- **Resource Optimization**: Built-in evaluation reduces overhead

### Risk Management
- **Early Detection**: Identify performance degradation quickly
- **Audit Trail**: Complete evaluation history
- **Compliance**: Demonstrable model testing

## Advanced Features

### Custom Metrics
- **Top-K Accuracy**: Measure if correct answer is in top K predictions
- **Precision/Recall**: For classification tasks
- **RMSE/MAE**: For regression problems
- **Custom Scoring**: Application-specific metrics

### Error Analysis
- **Confusion Matrix**: Visualization of misclassifications
- **Error Patterns**: Common failure modes
- **Feature Impact**: Which fields cause errors
- **Confidence Analysis**: Correlation between confidence and accuracy

### Performance Optimization
- **Query Tuning**: Optimize prediction queries
- **Feature Selection**: Identify most impactful fields
- **Data Quality**: Detect problematic training examples
- **Threshold Tuning**: Set optimal confidence thresholds

## Metrics Interpretation

### Accuracy
- **Range**: 0.0 to 1.0 (0% to 100%)
- **Good**: > 0.85 for most business applications
- **Excellent**: > 0.95 for critical decisions
- **Action**: < 0.70 requires investigation

### Mean Rank
- **Meaning**: Average position of correct answer in predictions
- **Best**: 1.0 (always first choice)
- **Good**: < 2.0 (usually in top 2)
- **Action**: > 3.0 may need query refinement

### Response Time (meanMs)
- **Fast**: < 50ms
- **Acceptable**: 50-200ms
- **Slow**: > 200ms
- **Impact**: Consider caching or query optimization

## Use Cases

1. **Invoice Processing**: Evaluate GL code prediction accuracy
2. **Product Recommendations**: Measure recommendation relevance
3. **Customer Support**: Test inquiry routing accuracy
4. **Inventory Management**: Validate demand forecasting
5. **Fraud Detection**: Monitor fraud classifier performance

## Technical Limitations

1. **Test Set Size**: Requires sufficient data for meaningful splits (min ~100 records)
2. **Index-Based Splitting**: May not reflect temporal data patterns
3. **Metric Selection**: Choose metrics appropriate for your task
4. **Evaluation Time**: Large test sets increase evaluation duration
5. **No Cross-Validation**: Single split, not k-fold cross-validation

## Best Practices

### Regular Monitoring
- Run evaluations weekly or monthly
- Track metrics over time
- Set up alerts for degradation
- Document evaluation results

### Meaningful Splits
- Use realistic train/test ratios (80/20 or 90/10)
- Consider temporal splits for time-series data
- Ensure test set represents production distribution
- Maintain consistent split methodology

### Action on Results
- Investigate accuracy drops immediately
- Review misclassified cases for patterns
- Update training data to address weaknesses
- Re-evaluate after any schema changes

---

**Pro Tip**: Start with a simple baseline evaluation, then iterate on feature selection and query structure based on case-by-case analysis. The `_evaluate` endpoint makes experimentation fast and cost-effective.
