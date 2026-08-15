import { aitoPostRaw } from './aito-client'

/**
 * Evaluate model performance using Aito's _evaluate endpoint
 * 
 * This function runs model evaluation to measure accuracy, response times,
 * and provides detailed case-by-case analysis of predictions vs actual values.
 * 
 * @param {Object} query - The evaluation query containing:
 *   - test: Defines the test/train split (e.g., {$index: {$gt: 90}})
 *   - evaluate: Specifies the evaluation parameters (from, where, predict)
 *   - select: Array of metrics to return (accuracy, meanRank, meanMs, etc.)
 * @returns {Promise<Object>} Evaluation results including metrics and cases
 */
export async function evaluateModel(query) {
  try {
    console.log('Evaluating model with query:', JSON.stringify(query, null, 2))

    // v2 returns _evaluate wrapped in {kind, data}; aitoPostRaw unwraps it,
    // so `response.data` is the metrics object on both API versions.
    const response = await aitoPostRaw('_evaluate', query, {
      timeout: 30000, // 30 second timeout for evaluation
    })

    console.log('Evaluation response:', response.data)
    
    // Process the response to ensure consistent format
    const result = response.data
    
    // Ensure cases array exists
    if (!result.cases) {
      result.cases = []
    }
    
    // Calculate additional metrics if not provided
    if (result.accuracy !== undefined && result.testSamples) {
      result.correctPredictions = Math.round(result.accuracy * result.testSamples)
      result.errorRate = 1 - result.accuracy
    }
    
    return result
  } catch (error) {
    console.error('Evaluation error:', error)
    
    // Provide more detailed error information
    if (error.response) {
      const errorMessage = error.response.data?.error || error.response.data?.message || 'Evaluation failed'
      throw new Error(`Evaluation failed: ${errorMessage}`)
    } else if (error.request) {
      throw new Error('No response from Aito server. Please check your connection.')
    } else {
      throw new Error(`Evaluation error: ${error.message}`)
    }
  }
}