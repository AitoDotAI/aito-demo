const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const OpenAI = require('openai');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Azure OpenAI configuration
const AZURE_CONFIG = {
  apiKey: process.env.REACT_APP_OPENAI_MODEL_API_KEY,
  resourceName: process.env.REACT_APP_OPENAI_RESOURCE_NAME,
  deploymentName: process.env.REACT_APP_OPENAI_MODEL_DEPLOYMENT || 'gpt-4',
  apiVersion: process.env.REACT_APP_OPENAI_MODEL_API_VERSION || '2024-02-15-preview'
};

// Construct proper Azure OpenAI endpoint URL
function getAzureEndpoint() {
  const baseURL = process.env.REACT_APP_OPENAI_MODEL_URL;
  const resourceName = process.env.REACT_APP_OPENAI_RESOURCE_NAME;
  
  if (baseURL) {
    // If full URL is provided, use it directly but ensure it ends correctly
    return baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
  } else if (resourceName) {
    // If only resource name is provided, construct the URL
    return `https://${resourceName}.openai.azure.com`;
  } else {
    throw new Error('Either REACT_APP_OPENAI_MODEL_URL or REACT_APP_OPENAI_RESOURCE_NAME must be provided');
  }
}

// Initialize OpenAI client with proper Azure configuration
let openai;

try {
  const azureEndpoint = getAzureEndpoint();
  
  openai = new OpenAI({
    apiKey: AZURE_CONFIG.apiKey,
    baseURL: `${azureEndpoint}/openai/deployments/${AZURE_CONFIG.deploymentName}`,
    defaultQuery: { 
      'api-version': AZURE_CONFIG.apiVersion
    },
    defaultHeaders: {
      'api-key': AZURE_CONFIG.apiKey
    }
  });
  
  console.log('✅ Azure OpenAI client initialized successfully');
  console.log(`   Endpoint: ${azureEndpoint}`);
  console.log(`   Deployment: ${AZURE_CONFIG.deploymentName}`);
  console.log(`   API Version: ${AZURE_CONFIG.apiVersion}`);
} catch (error) {
  console.error('❌ Failed to initialize Azure OpenAI client:', error.message);
  openai = null;
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Chat completion endpoint
 * Accepts messages and tools, returns OpenAI chat completion
 */
app.post('/api/chat/completions', async (req, res) => {
  try {
    // Check if OpenAI client is properly initialized
    if (!openai) {
      return res.status(500).json({
        error: 'Azure OpenAI client not properly configured',
        message: 'Please check your Azure OpenAI environment variables'
      });
    }

    const { messages, tools, temperature = 0.7, max_tokens = 1000 } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'Invalid request: messages array is required'
      });
    }

    const requestParams = {
      model: AZURE_CONFIG.deploymentName,
      messages,
      temperature,
      max_tokens,
    };

    // Add tools if provided
    if (tools && Array.isArray(tools) && tools.length > 0) {
      requestParams.tools = tools;
      requestParams.tool_choice = 'auto';
    }

    console.log('Making OpenAI request:', {
      model: requestParams.model,
      messageCount: messages.length,
      toolCount: tools ? tools.length : 0,
      temperature,
      max_tokens
    });

    const completion = await openai.chat.completions.create(requestParams);

    console.log('OpenAI response:', {
      id: completion.id,
      model: completion.model,
      usage: completion.usage,
      finishReason: completion.choices[0]?.finish_reason
    });

    res.json(completion);

  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    // Handle different types of errors
    if (error.status) {
      res.status(error.status).json({
        error: error.message || 'OpenAI API error',
        code: error.code,
        type: error.type
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
});

/**
 * Get available models endpoint (for debugging)
 */
app.get('/api/models', async (req, res) => {
  try {
    const models = await openai.models.list();
    res.json(models);
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({
      error: 'Failed to fetch models',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Chat backend server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 Chat endpoint: http://localhost:${PORT}/api/chat/completions`);
  console.log(`📊 Models endpoint: http://localhost:${PORT}/api/models`);
  
  // Log configuration (without sensitive data)
  console.log('\n🔧 Configuration:');
  console.log(`   Deployment: ${AZURE_CONFIG.deploymentName}`);
  console.log(`   Resource URL: ${process.env.REACT_APP_OPENAI_MODEL_URL ? '[CONFIGURED]' : '[MISSING]'}`);
  console.log(`   Resource Name: ${process.env.REACT_APP_OPENAI_RESOURCE_NAME ? '[CONFIGURED]' : '[MISSING]'}`);
  console.log(`   API Key: ${process.env.REACT_APP_OPENAI_MODEL_API_KEY ? '[CONFIGURED]' : '[MISSING]'}`);
  console.log(`   API Version: ${AZURE_CONFIG.apiVersion}`);
  console.log(`   Client Status: ${openai ? '✅ Ready' : '❌ Failed'}`);
});

module.exports = app;