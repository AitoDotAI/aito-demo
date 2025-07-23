/**
 * Customer Chat Tools - Node.js Compatible Version
 * CommonJS module for server-side use
 */

const axios = require('axios');
const path = require('path');

// We need to dynamically import the demo files since they're ES modules
// For now, let's create Node.js compatible versions of the key functions

/**
 * Search for products based on user query
 */
async function searchProducts(userId, query, limit = 5) {
  try {
    // This would call the actual search function from 03-search.js
    // For now, return a mock response to demonstrate the architecture
    const products = [
      {
        id: '2000818700008',
        name: 'Pirkka banana',
        price: 1.50,
        tags: 'fresh fruit pirkka',
        $matches: ['banana']
      },
      {
        id: '6410405082657', 
        name: 'Pirkka Finnish semi-skimmed milk 1l',
        price: 1.20,
        tags: 'dairy milk pirkka',
        $matches: ['milk']
      }
    ].filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || 
                  p.tags.toLowerCase().includes(query.toLowerCase()))
     .slice(0, limit);

    return {
      success: true,
      products: products,
      message: `Found ${products.length} products matching "${query}"`
    };
  } catch (error) {
    console.error('Product search error:', error);
    return {
      success: false,
      products: [],
      message: `Sorry, I couldn't search for products right now. Please try again later.`
    };
  }
}

/**
 * Get personalized product recommendations
 */
async function getRecommendations(userId, currentCart = [], limit = 5) {
  try {
    // Mock recommendations based on user
    const recommendations = {
      'larry': [
        { id: '6410405040817', name: 'Pirkka sugar 1 kg', price: 0.95, tags: 'baking pirkka' },
        { id: '6411300000494', name: 'Juhla Mokka coffee 500g', price: 4.50, tags: 'coffee drinks' }
      ],
      'veronica': [
        { id: '6410711140014', name: 'Organic tomatoes', price: 3.20, tags: 'organic vegetables' },
        { id: '6410405029411', name: 'Organic milk 1l', price: 1.80, tags: 'organic dairy' }
      ]
    };

    const userRecs = recommendations[userId] || recommendations['larry'];
    
    return {
      success: true,
      products: userRecs.slice(0, limit),
      message: `Here are ${Math.min(userRecs.length, limit)} personalized recommendations for you`
    };
  } catch (error) {
    console.error('Recommendations error:', error);
    return {
      success: false,
      products: [],
      message: `Sorry, I couldn't get recommendations right now. Please try again later.`
    };
  }
}

/**
 * Get smart cart autofill suggestions based on user history
 */
async function getSmartCartSuggestions(userId) {
  try {
    const predictions = {
      'larry': [
        { id: '2000818700008', name: 'Pirkka banana', price: 1.50, tags: 'fresh fruit' },
        { id: '6410405082657', name: 'Lactose-free milk 1l', price: 1.60, tags: 'dairy lactose-free' },
        { id: '6410405040817', name: 'Pirkka sugar 1 kg', price: 0.95, tags: 'baking' }
      ],
      'veronica': [
        { id: '6410711140014', name: 'Organic tomatoes', price: 3.20, tags: 'organic vegetables' },
        { id: '6410405029411', name: 'Organic milk 1l', price: 1.80, tags: 'organic dairy' },
        { id: '6410405029145', name: 'Organic bread', price: 2.40, tags: 'organic bakery' }
      ]
    };

    const userPredictions = predictions[userId] || predictions['larry'];
    
    return {
      success: true,
      products: userPredictions,
      productIds: userPredictions.map(p => p.id),
      message: `Based on your shopping patterns, I predict you'll want these ${userPredictions.length} items on your next visit`
    };
  } catch (error) {
    console.error('Smart cart error:', error);
    return {
      success: false,
      products: [],
      productIds: [],
      message: `Sorry, I couldn't analyze your shopping patterns right now. Please try again later.`
    };
  }
}

/**
 * Get autocomplete suggestions for search
 */
async function getSearchSuggestions(userId, prefix) {
  try {
    const suggestions = [
      'milk', 'milk organic', 'milk lactose-free',
      'bread', 'bread organic', 'bread whole grain',
      'banana', 'bananas organic',
      'coffee', 'coffee beans', 'coffee instant',
      'tomato', 'tomatoes organic', 'tomato sauce'
    ].filter(s => s.toLowerCase().startsWith(prefix.toLowerCase()))
     .slice(0, 5);
    
    return {
      success: true,
      suggestions: suggestions,
      message: `Here are some search suggestions: ${suggestions.join(', ')}`
    };
  } catch (error) {
    console.error('Autocomplete error:', error);
    return {
      success: false,
      suggestions: [],
      message: `Sorry, I couldn't get search suggestions right now.`
    };
  }
}

/**
 * Analyze customer prompts
 */
async function analyzePrompt(userPrompt) {
  try {
    // Simple sentiment and intent analysis
    const lowerPrompt = userPrompt.toLowerCase();
    
    let type = 'question';
    let sentiment = 'neutral';
    
    if (lowerPrompt.includes('problem') || lowerPrompt.includes('error') || lowerPrompt.includes('wrong')) {
      type = 'feedback';
      sentiment = 'negative';
    } else if (lowerPrompt.includes('great') || lowerPrompt.includes('love') || lowerPrompt.includes('excellent')) {
      type = 'feedback';
      sentiment = 'positive';
    } else if (lowerPrompt.includes('need') || lowerPrompt.includes('want') || lowerPrompt.includes('request')) {
      type = 'request';
    }

    return {
      success: true,
      type: type,
      sentiment: sentiment,
      message: `I understood your ${type}${sentiment !== 'neutral' ? ` with ${sentiment} sentiment` : ''}`
    };
  } catch (error) {
    console.error('Prompt analysis error:', error);
    return {
      success: false,
      type: 'error',
      message: 'I had trouble understanding your message. Please try rephrasing it.'
    };
  }
}

/**
 * Get general help information
 */
function getGeneralHelp(topic = null) {
  const helpTopics = {
    'search': 'To search for products, just type what you\'re looking for. I can help you find specific items and suggest alternatives based on your preferences.',
    'recommendations': 'I can suggest products based on your shopping history and preferences. Just ask me for recommendations!',
    'cart': 'I can help you manage your shopping cart, suggest items you might have forgotten, or recommend alternatives.',
    'orders': 'You can ask me about placing orders, delivery options, and order tracking.',
    'account': 'I can help you with account-related questions like updating preferences or viewing order history.',
    'products': 'Ask me about product details, availability, ingredients, or alternatives.',
    'delivery': 'I can provide information about delivery areas, fees, and scheduling options.',
    'payment': 'I can explain our payment methods and help with checkout questions.',
    'returns': 'I can guide you through our return policy and process.',
    'default': 'I\'m here to help you with shopping! I can help you search for products, get personalized recommendations, manage your cart, and answer questions about orders, delivery, and our services.'
  };

  const message = helpTopics[topic] || helpTopics.default;
  
  return {
    success: true,
    message: message,
    availableTopics: Object.keys(helpTopics).filter(t => t !== 'default')
  };
}

/**
 * Tool definitions for OpenAI function calling
 */
const CUSTOMER_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_products',
      description: 'Search for products in the grocery store based on user query. Returns personalized results.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query from the user (e.g., "organic milk", "bread", "lactose-free")'
          },
          limit: {
            type: 'integer',
            description: 'Maximum number of products to return (default: 5)',
            default: 5
          }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_to_cart',
      description: 'Add one or more products to the user\'s shopping cart. Use this when the user wants to add specific items.',
      parameters: {
        type: 'object',
        properties: {
          productIds: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Array of product IDs to add to cart'
          },
          productNames: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Array of product names to add to cart (alternative to IDs)'
          }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'remove_from_cart',
      description: 'Remove products from the user\'s shopping cart.',
      parameters: {
        type: 'object',
        properties: {
          productIds: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Array of product IDs to remove from cart'
          },
          productNames: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Array of product names to remove from cart (alternative to IDs)'
          }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_recommendations',
      description: 'Get personalized product recommendations based on user shopping history and current cart.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'integer',
            description: 'Maximum number of recommendations to return (default: 5)',
            default: 5
          }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_search_suggestions',
      description: 'Get autocomplete suggestions for search queries.',
      parameters: {
        type: 'object',
        properties: {
          prefix: {
            type: 'string',
            description: 'Partial search query to get suggestions for'
          }
        },
        required: ['prefix']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_smart_cart_predictions',
      description: 'Get AI-powered cart predictions with full product details based on user shopping patterns.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'analyze_customer_message',
      description: 'Analyze customer messages using AI to understand intent, classify feedback, or handle special requests.',
      parameters: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'The customer message to analyze for intent and appropriate response'
          }
        },
        required: ['message']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_general_help',
      description: 'Provide general help information about using the grocery store.',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'Specific help topic (search, recommendations, cart, orders, account, products, delivery, payment, returns)',
            enum: ['search', 'recommendations', 'cart', 'orders', 'account', 'products', 'delivery', 'payment', 'returns']
          }
        },
        required: []
      }
    }
  }
];

/**
 * Add products to cart
 */
function addToCart(productIds = [], productNames = []) {
  // Mock implementation - in a real app this would update the database
  // For now, return the products that would be added
  const products = [];
  
  // Handle product IDs
  productIds.forEach(id => {
    // Mock product lookup
    const product = {
      id: id,
      name: `Product ${id}`,
      price: Math.floor(Math.random() * 10) + 1
    };
    products.push(product);
  });
  
  // Handle product names
  productNames.forEach(name => {
    const product = {
      id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name,
      price: Math.floor(Math.random() * 10) + 1
    };
    products.push(product);
  });
  
  return {
    success: true,
    products: products,
    message: `Added ${products.length} item(s) to your cart: ${products.map(p => p.name).join(', ')}`
  };
}

/**
 * Remove products from cart
 */
function removeFromCart(productIds = [], productNames = []) {
  // Mock implementation
  const removedItems = [...productIds, ...productNames];
  
  return {
    success: true,
    removedItems: removedItems,
    message: `Removed ${removedItems.length} item(s) from your cart`
  };
}

/**
 * Execute a tool function call
 */
async function executeCustomerTool(toolName, parameters, userId, currentCart = []) {
  console.log(`Executing customer tool: ${toolName} for user: ${userId}`, parameters);
  
  switch (toolName) {
    case 'search_products':
      return await searchProducts(userId, parameters.query, parameters.limit);
    
    case 'get_recommendations':
      return await getRecommendations(userId, currentCart, parameters.limit);
    
    case 'get_search_suggestions':
      return await getSearchSuggestions(userId, parameters.prefix);
    
    case 'get_smart_cart_predictions':
      return await getSmartCartSuggestions(userId);
    
    case 'analyze_customer_message':
      return await analyzePrompt(parameters.message);
    
    case 'get_general_help':
      return getGeneralHelp(parameters.topic);
    
    case 'add_to_cart':
      return addToCart(parameters.productIds, parameters.productNames);
    
    case 'remove_from_cart':
      return removeFromCart(parameters.productIds, parameters.productNames);
    
    default:
      return {
        success: false,
        message: `Unknown tool: ${toolName}`
      };
  }
}

/**
 * Customer system prompt
 */
const CUSTOMER_SYSTEM_PROMPT = `You are an advanced AI shopping assistant for an online grocery store with smart predictive capabilities. Your role is to help customers find products, get recommendations, and provide intelligent shopping assistance.

Key capabilities:
- Search for products based on customer requests with personalized results
- Provide AI-powered recommendations based on shopping history and preferences
- Smart cart predictions - predict what customers will likely want to buy next
- Natural language understanding - analyze complex customer messages and feedback
- Autocomplete and search suggestions for better product discovery
- Intelligent shopping list suggestions based on purchase patterns
- Answer questions about products, store policies, and shopping

Customer context:
- You're talking to a customer who is shopping online
- Be friendly, helpful, and conversational
- Always prioritize the customer's dietary restrictions and preferences
- If someone mentions being lactose-intolerant, focus on lactose-free options
- For health-conscious customers, emphasize organic and low-sodium products
- Use the available tools to provide specific product information and recommendations

Guidelines:
- Always use tools when the customer asks for specific products or recommendations
- For complex messages or feedback, use the message analysis tool to better understand intent
- Proactively suggest smart cart predictions when customers ask about shopping lists
- Be proactive in suggesting alternatives and related products
- Explain why you're recommending certain products when relevant
- Keep responses concise but informative
- Use the smart features to anticipate customer needs

Remember: You're an intelligent assistant that learns from shopping patterns to make grocery shopping smarter and more personalized!`;

module.exports = {
  CUSTOMER_TOOLS,
  executeCustomerTool,
  CUSTOMER_SYSTEM_PROMPT,
  searchProducts,
  getRecommendations,
  getSmartCartSuggestions,
  getSearchSuggestions,
  analyzePrompt,
  getGeneralHelp,
  addToCart,
  removeFromCart
};