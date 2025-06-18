import axios from 'axios'
import config from './config'

// Configuration for invoice prediction fields
// Defines which related fields to return for each prediction type
const outputFields = {
  "Processor": ["Name", "Role", "Department", "Superior"],  // Employee who should process
  "Acceptor": ["Name", "Role", "Department", "Superior"],   // Employee who should approve
  "GLCode": ["Name", "GLCode", "Department"]                // General Ledger code
}

/**
 * Predicts invoice processing assignments using document analysis
 * 
 * This demonstrates Aito's document classification and routing capabilities:
 * - Analyzes invoice content (vendor, amount, description, etc.)
 * - Predicts appropriate processor, approver, and GL code
 * - Returns explanations for each prediction using $why operator
 * - Enables automated document routing in business processes
 * 
 * @param {Object} input - Invoice details (vendor, amount, description, etc.)
 * @param {Array<string>} output - Fields to predict (e.g., ['Processor', 'Acceptor', 'GLCode'])
 * @returns {Promise<Array>} Array of prediction results with explanations
 */
export function predictInvoice(input, output) {
  // Make predictions for each requested output field in parallel
  return Promise.all(output.map(predicted => {
    // Build the select clause for the prediction
    var select = [
      "$p",                   // Include probability score
      {
        "$why": {             // Include explanation for the prediction
          "highlight": {
            "posPreTag": "<b>",   // HTML tags for highlighting key factors
            "posPostTag": "</b>"
          }
        }
      }
    ]
    
    // Add all relevant fields for this prediction type
    outputFields[predicted].forEach(field => {
      select.push(field)
    })

    // Execute the prediction
    return axios.post(`${config.aito.url}/api/v1/_predict`, {
      from: 'invoices',       // Analyze historical invoice data
      where: input,           // Use invoice details as input context
      predict: predicted,     // Field to predict (Processor/Acceptor/GLCode)
      select: select,         // Fields to return in results
      limit: 10              // Top 10 predictions
    }, {
      headers: {
        'x-api-key': config.aito.apiKey
      },
    }).then(response => response.data.hits)
  }))
}
