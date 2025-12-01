# Automated Invoice Processing

![Invoice Processing](../screenshots/features/invoice-automation.png)

*Invoice processing in action: Automatic GL code assignment and approval routing*

**[🚀 Try Live Demo](https://demo.aito.ai/invoicing)** - Experience AI-powered invoice processing. Select different invoices to see automatic GL code assignment and approval routing predictions.

## Overview

The invoice processing feature demonstrates how Aito.ai can transform manual document processing into an intelligent, automated workflow. By analyzing invoice content, the system automatically assigns GL codes, routes for appropriate approval, and extracts key fields with high accuracy.

## How It Works

### Traditional vs. AI-Powered Invoice Processing

**Traditional Processing:**
- Manual data entry and field extraction
- Static rules for GL code assignment
- Fixed approval workflows
- High error rates and processing delays

**AI-Powered Processing with Aito:**
- Automatic field extraction and classification
- Intelligent GL code prediction based on content
- Dynamic routing based on amount, vendor, and type
- Learning from historical processing decisions

### Implementation

The invoice processing uses a flexible prediction function from `src/08-predict-invoice.js`:

```javascript
// Core invoice processing logic
// Configuration for which fields to return for each prediction type
const outputFields = {
  Processor: ['Name', 'Role', 'Department', 'Superior'],  // Employee details
  Acceptor: ['Name', 'Role', 'Department', 'Superior'],   // Approver details
  GLCode: ['Name', 'GLCode', 'Department']                // GL code details
}

export function predictInvoice(input, output) {
  // Make predictions for each requested field in parallel
  return Promise.all(output.map(predicted => {
    // Build select clause with probability and explanation
    const select = [
      '$p',                   // Probability score
      {
        $why: {               // Explanation for the prediction
          highlight: {
            posPreTag: '<b>',   // Highlight key factors
            posPostTag: '</b>'
          }
        }
      }
    ]

    // Add specific fields for this prediction type
    outputFields[predicted].forEach(field => {
      select.push(field)
    })

    // Execute the prediction
    return axios.post(`${config.aito.url}/api/v1/_predict`, {
      from: 'invoices',       // Analyze historical invoices
      where: input,           // Invoice details (vendor, amount, description)
      predict: predicted,     // Field to predict (Processor/Acceptor/GLCode)
      select: select,         // Return probability, explanation, and details
      limit: 10               // Top 10 predictions
    }).then(response => response.data.hits)
  }))
}

// Usage example:
const input = {
  Vendor: 'Office Supplies Inc',
  Amount: 450.00,
  Description: 'Monthly office supplies order'
}

const predictions = await predictInvoice(input, ['Processor', 'GLCode'])
// Returns array: [processorPredictions[], glCodePredictions[]]
```

## Key Features

### 1. Multi-Field Prediction
- Predicts **Processor** (who should handle the invoice)
- Predicts **Acceptor** (who should approve it)
- Predicts **GL Code** (accounting category)
- All predictions run in parallel for efficiency

### 2. Explainable AI with $why
- Each prediction includes explanation (`$why` operator)
- Highlights which invoice fields influenced the decision
- HTML formatting shows key factors in bold
- Helps users understand and trust predictions

### 3. Confidence Scoring
- Every prediction includes probability score (`$p`)
- Top 10 predictions returned for each field
- Allows filtering by confidence threshold
- Enables human review of low-confidence cases

### 4. Linked Data Enrichment
- Returns complete employee details (Name, Role, Department, Superior)
- Returns GL code details (Name, GLCode, Department)
- Uses table linking to fetch related information
- Single query returns all necessary context

## Data Schema

The invoice processing leverages multiple data tables:

```json
{
  "invoices": {
    "type": "table",
    "columns": {
      "id": { "type": "String" },
      "vendor": { "type": "String" },
      "amount": { "type": "Decimal" },
      "description": { "type": "Text", "analyzer": "English" },
      "glCode": { "type": "String", "link": "glCodes.code" },
      "processor": { "type": "String", "link": "employees.id" },
      "requiresApproval": { "type": "Boolean" },
      "processedDate": { "type": "DateTime" }
    }
  },
  "glCodes": {
    "type": "table",
    "columns": {
      "code": { "type": "String" },
      "name": { "type": "String" },
      "category": { "type": "String" },
      "department": { "type": "String" }
    }
  },
  "employees": {
    "type": "table",
    "columns": {
      "id": { "type": "String" },
      "name": { "type": "String" },
      "department": { "type": "String" },
      "approvalLimit": { "type": "Decimal" },
      "role": { "type": "String" }
    }
  }
}
```

## Processing Workflows

### Standard Invoice Flow

1. **Receipt & Extraction**
   - Invoice received via email/upload
   - OCR extraction of key fields
   - Initial data validation

2. **AI Classification**
   - GL code prediction based on content
   - Processor assignment based on expertise
   - Approval requirement determination

3. **Review & Approval**
   - Routed to predicted processor
   - Confidence scores guide review priority
   - Automated approval for high-confidence cases

4. **Exception Handling**
   - Low-confidence predictions flagged for review
   - Manual override capabilities
   - Learning from corrections

### Special Case Handling

**Large Amount Invoices:**
- Automatic escalation to senior approvers
- Additional verification requirements
- Multi-level approval workflows

**New Vendor Invoices:**
- Enhanced review processes
- Vendor verification steps
- Pattern learning for future invoices

**Recurring Invoices:**
- Streamlined processing for known patterns
- Automatic coding for utility bills
- Bulk processing capabilities

## Technical Benefits

- **Automated Classification**: Predicts GL codes based on invoice content
- **Confidence Scoring**: Each prediction includes probability score
- **Explainable AI**: Shows which factors influenced predictions
- **Workflow Integration**: Automatically routes to appropriate approvers

## Implementation Example

```javascript
// Basic usage
import { processInvoice, validatePredictions } from '../api/invoiceProcessing'

const InvoiceProcessor = ({ invoiceData }) => {
  const [predictions, setPredictions] = useState(null)
  const [processing, setProcessing] = useState(false)

  const handleProcess = async () => {
    setProcessing(true)
    try {
      const results = await processInvoice(invoiceData)
      setPredictions(results)
      
      // Auto-approve if high confidence
      if (results.confidence.glCode > 0.9 && 
          results.confidence.processor > 0.8) {
        await autoApprove(results)
      }
    } catch (error) {
      console.error('Processing failed:', error)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div>
      <InvoiceDetails data={invoiceData} />
      
      {predictions && (
        <PredictionResults 
          predictions={predictions}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
      
      <button onClick={handleProcess} disabled={processing}>
        {processing ? 'Processing...' : 'Process Invoice'}
      </button>
    </div>
  )
}
```

## Business Value

### Efficiency Gains
- **Time Savings**: Substantial reduction in processing time
- **Cost Reduction**: Significant reduction in processing costs
- **Resource Optimization**: Staff focus on exceptions only

### Accuracy Improvements
- **Error Reduction**: Major reduction in classification errors
- **Consistency**: Standardized coding across departments
- **Audit Trail**: Complete processing history

### Compliance Benefits
- **Audit Readiness**: Automated documentation
- **Policy Enforcement**: Consistent approval workflows
- **Risk Reduction**: Fraud detection capabilities

## Advanced Features

### Learning Capabilities
- **Continuous Improvement**: Model updates from corrections
- **Pattern Recognition**: Identification of new invoice types
- **Vendor Learning**: Adaptation to vendor-specific patterns

### Integration Features
- **ERP Integration**: Direct posting to accounting systems
- **Email Processing**: Automatic invoice extraction from emails
- **Mobile Support**: Mobile approval capabilities

### Analytics & Reporting
- **Processing Metrics**: Real-time dashboard monitoring
- **Trend Analysis**: Spending pattern identification
- **Performance Tracking**: Accuracy and efficiency metrics

## Security Considerations

### Data Protection
- **Encryption**: All invoice data encrypted in transit and at rest
- **Access Controls**: Role-based access to sensitive information
- **Audit Logs**: Complete activity tracking

### Compliance
- **SOX Compliance**: Segregation of duties enforcement
- **GDPR**: Data retention and deletion policies
- **Industry Standards**: Adherence to accounting best practices

## Technical Limitations

1. **Data Input Requirements**: Relies on structured invoice data, not OCR
2. **Language Constraints**: Works best with consistent language in invoice fields
3. **Training Data Dependency**: Requires sufficient historical invoice examples
4. **Confidence Thresholds**: May need manual review for uncertain predictions
5. **Integration Complexity**: Requires custom development for enterprise systems