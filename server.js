const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const OpenAI = require('openai');
const path = require('path');

// Import shared tools
const { 
  CUSTOMER_TOOLS, 
  executeCustomerTool, 
  CUSTOMER_SYSTEM_PROMPT 
} = require('./shared/tools/customerTools.cjs');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 80;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'build')));

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
      finishReason: completion.choices[0]?.finish_reason,
      hasToolCalls: !!(completion.choices[0]?.message?.tool_calls?.length),
      toolCallCount: completion.choices[0]?.message?.tool_calls?.length || 0
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
 * Secure Customer Assistant endpoint
 * Handles customer chat with tool execution server-side
 */
app.post('/api/assistant/customer', async (req, res) => {
  try {
    if (!openai) {
      return res.status(500).json({
        error: 'Azure OpenAI client not properly configured'
      });
    }

    const { message, context = {}, conversationHistory = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({
        error: 'Message is required'
      });
    }

    // Basic rate limiting - in production, use Redis or proper rate limiter
    const clientIP = req.ip || req.connection.remoteAddress;
    console.log(`Customer assistant request from ${clientIP}: "${message.substring(0, 50)}..." for user: ${context.userId || 'guest'}`);

    // Build conversation with system prompt, history, and new user message
    const messages = [
      {
        role: 'system',
        content: `${CUSTOMER_SYSTEM_PROMPT}

        Current customer context:
        - User ID: ${context.userId || 'guest'}
        - Cart items: ${context.cartItems?.length || 0} items
        - Current page: ${context.currentPage || 'unknown'}
        - Timestamp: ${new Date().toISOString()}`
      }
    ];
    
    // Process conversation history to include tool information
    for (const msg of conversationHistory.filter(msg => msg.role !== 'system')) {
      if (msg.role === 'assistant' && msg.tool_calls && msg.tool_results) {
        // Add the assistant message with tool calls
        messages.push({
          role: 'assistant',
          content: msg.content,
          tool_calls: msg.tool_calls
        });
        
        // Add tool results as separate messages
        for (let i = 0; i < msg.tool_calls.length; i++) {
          const toolCall = msg.tool_calls[i];
          const toolResult = msg.tool_results.find(r => r.tool_name === toolCall.function.name);
          if (toolResult) {
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolResult.result)
            });
          }
        }
      } else {
        // Regular user/assistant messages
        messages.push(msg);
      }
    }
    
    // Add the new user message
    messages.push({
      role: 'user',
      content: message
    });

    // First OpenAI call with tools
    const completion = await openai.chat.completions.create({
      model: AZURE_CONFIG.deploymentName,
      messages,
      tools: CUSTOMER_TOOLS,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 1000
    });

    const assistantMessage = completion.choices[0]?.message;
    let finalResponse = assistantMessage?.content || '';

    // Track cart operations for frontend state sync
    const cartOperations = [];

    // Handle tool calls if present
    if (assistantMessage?.tool_calls) {
      console.log(`Executing ${assistantMessage.tool_calls.length} tool(s) for ${context.userId || 'guest'}`);
      
      // Add assistant message with tool calls to conversation
      messages.push(assistantMessage);

      // Execute each tool call
      for (const toolCall of assistantMessage.tool_calls) {
        try {
          const toolResult = await executeCustomerTool(
            toolCall.function.name,
            JSON.parse(toolCall.function.arguments),
            context.userId || 'guest',
            context.cartItems || []
          );

          // Track cart operations for frontend sync
          if (toolCall.function.name === 'add_to_cart' && toolResult.success) {
            // For add_to_cart, we need to get the actual product data
            const args = JSON.parse(toolCall.function.arguments);
            const productIdsToAdd = args.productIds || [];
            
            if (productIdsToAdd.length > 0) {
              const productsToAdd = [];
              
              // Check if we just called get_smart_cart_predictions
              const prevToolCalls = messages.filter(m => m.role === 'tool').slice(-5); // Check last 5 tool responses
              let smartCartProducts = [];
              
              for (const toolMsg of prevToolCalls) {
                try {
                  const toolData = JSON.parse(toolMsg.content);
                  if (toolData.products && Array.isArray(toolData.products)) {
                    smartCartProducts = toolData.products;
                    break;
                  }
                } catch (e) {
                  // Continue if parsing fails
                }
              }
              
              // Map each product ID to its full product data
              for (const productId of productIdsToAdd) {
                let product = smartCartProducts.find(p => p.id === productId);
                
                if (!product) {
                  // Fallback: create minimal product object
                  product = {
                    id: productId,
                    name: 'Product',
                    price: 0
                  };
                }
                
                productsToAdd.push(product);
              }
              
              if (productsToAdd.length > 0) {
                cartOperations.push({
                  type: 'add',
                  products: productsToAdd
                });
              }
            }
          } else if (toolCall.function.name === 'remove_from_cart' && toolResult.success) {
            const args = JSON.parse(toolCall.function.arguments);
            const productIdsToRemove = args.productIds || args.productNames || [];
            if (productIdsToRemove.length > 0) {
              cartOperations.push({
                type: 'remove',
                productIds: productIdsToRemove
              });
            }
          }

          // Add tool result to conversation
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult)
          });
        } catch (toolError) {
          console.error(`Tool execution error for ${toolCall.function.name}:`, toolError);
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({
              success: false,
              message: 'I encountered an error while processing your request. Please try again.'
            })
          });
        }
      }

      // Get final response from OpenAI after tool execution
      const finalCompletion = await openai.chat.completions.create({
        model: AZURE_CONFIG.deploymentName,
        messages,
        temperature: 0.7,
        max_tokens: 1000
      });

      finalResponse = finalCompletion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.';
    }

    console.log(`Customer assistant response generated for ${clientIP}`);

    // Build the complete conversation history to return
    const updatedHistory = [
      ...conversationHistory.filter(msg => msg.role !== 'system'),
      {
        role: 'user',
        content: message
      },
      {
        role: 'assistant',
        content: finalResponse,
        // Include tool calls and their results in the history
        tool_calls: assistantMessage?.tool_calls,
        // Store the actual tool results for reference
        tool_results: assistantMessage?.tool_calls ? 
          await Promise.all(assistantMessage.tool_calls.map(async (tc) => {
            try {
              const result = JSON.parse(messages.find(m => 
                m.role === 'tool' && m.tool_call_id === tc.id
              )?.content || '{}');
              return {
                tool_name: tc.function.name,
                result: result
              };
            } catch (e) {
              return null;
            }
          })).then(results => results.filter(r => r !== null)) : []
      }
    ];

    res.json({
      response: finalResponse,
      usage: completion.usage,
      context: context,
      conversationHistory: updatedHistory,
      toolsUsed: assistantMessage?.tool_calls?.map(tc => tc.function.name) || [],
      cartOperations: cartOperations
    });

  } catch (error) {
    console.error('Customer assistant error:', error);
    res.status(500).json({
      error: 'Failed to process customer request',
      message: error.message
    });
  }
});

/**
 * Secure Admin Assistant endpoint  
 * Handles admin chat with analytics and business intelligence
 */
app.post('/api/assistant/admin', async (req, res) => {
  try {
    if (!openai) {
      return res.status(500).json({
        error: 'Azure OpenAI client not properly configured'
      });
    }

    const { message, context = {} } = req.body;
    
    if (!message) {
      return res.status(400).json({
        error: 'Message is required'
      });
    }

    // Basic rate limiting - in production, use Redis or proper rate limiter
    const clientIP = req.ip || req.connection.remoteAddress;
    console.log(`Admin assistant request from ${clientIP}: "${message.substring(0, 50)}..."`);

    const messages = [
      {
        role: 'system',
        content: `You are an AI assistant for grocery store administrators and managers. 
        
        Admin context:
        - Request from: ${clientIP}
        - Timestamp: ${new Date().toISOString()}
        
        You can help with:
        - Business analytics and reporting
        - Inventory management insights
        - Customer behavior analysis
        - Performance metrics
        - Administrative tasks
        
        Please provide data-driven insights and actionable recommendations.
        Focus on metrics, trends, and business optimization opportunities.`
      },
      {
        role: 'user',
        content: message
      }
    ];

    const completion = await openai.chat.completions.create({
      model: AZURE_CONFIG.deploymentName,
      messages,
      temperature: 0.7,
      max_tokens: 1000
    });

    console.log(`Admin assistant response generated for ${clientIP}`);

    res.json({
      response: completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.',
      usage: completion.usage,
      context: context
    });

  } catch (error) {
    console.error('Admin assistant error:', error);
    res.status(500).json({
      error: 'Failed to process admin request',
      message: error.message
    });
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

// Serve React app for specific routes (avoid problematic wildcard)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/product', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/analytics', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/invoicing', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/help', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/customer-chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/admin-chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/data-inspect', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
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
  console.log(`🛒 Customer assistant: http://localhost:${PORT}/api/assistant/customer`);
  console.log(`👨‍💼 Admin assistant: http://localhost:${PORT}/api/assistant/admin`);
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