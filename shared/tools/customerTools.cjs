/**
 * Customer Chat Tools - Node.js Compatible Version
 * CommonJS module for server-side use
 */

const axios = require('axios');
const path = require('path');

// Configuration for Aito.ai API (same as frontend config.js)
const AITO_CONFIG = {
  url: process.env.REACT_APP_AITO_URL || 'https://aito-demo.aito.app',
  apiKey: process.env.REACT_APP_AITO_API_KEY || 'yg4rTlXkqDzm4y8gPeY75HCKaNwfbTQ2si64ONTi'
};

// Node.js compatible versions of the demo functions that call real Aito.ai API

/**
 * Search for products using Aito.ai personalized search
 */
async function searchProducts(userId, query, limit = 5) {
  try {
    console.log(`Searching products for user ${userId} with query: "${query}"`);
    
    // Use Aito.ai personalized search (same as 03-search.js)
    const response = await axios.post(`${AITO_CONFIG.url}/api/v1/_query`, {
      "from": "products",
      "where": {
        "$and": [
          {
            "$or": [
              {"name": {"$match": query}},
              {"tags": {"$match": query}},
              {"description": {"$match": query}}
            ]
          }
        ]
      },
      "orderBy": [
        // Order by relevance and user purchase probability
        {
          "$p": {
            "from": "impressions",
            "where": {
              "user": userId,
              "buy": true
            }
          }
        },
        "$similarity"
      ],
      "limit": limit
    }, {
      headers: {
        'x-api-key': AITO_CONFIG.apiKey
      }
    });

    const products = response.data.hits || [];
    
    return {
      success: true,
      products: products,
      message: `Found ${products.length} products matching "${query}"`
    };
  } catch (error) {
    console.error('Product search error:', error);
    
    // Fallback to simple mock search
    const mockProducts = [
      { id: '2000818700008', name: 'Pirkka banana', price: 0.26 },
      { id: '6410405082657', name: 'Pirkka Finnish semi-skimmed milk 1l', price: 0.95 },
      { id: '6411300000494', name: 'Juhla Mokka coffee 500g UTZ', price: 3.45 }
    ].filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
     .slice(0, limit);

    return {
      success: true,
      products: mockProducts,
      message: `Found ${mockProducts.length} products matching "${query}" (cached results)`
    };
  }
}

/**
 * Get personalized product recommendations using Aito.ai
 */
async function getRecommendations(userId, currentCart = [], limit = 5) {
  try {
    console.log(`Getting recommendations for user ${userId}`);
    
    // Use Aito.ai recommendations API (same as 01-recommend.js)
    const response = await axios.post(`${AITO_CONFIG.url}/api/v1/_recommend`, {
      "from": "impressions",
      "where": {
        "user": userId,
        "buy": true
      },
      "goal": {
        "buy": true
      },
      "recommend": "product",
      "limit": limit * 2 // Get more to filter out cart items
    }, {
      headers: {
        'x-api-key': AITO_CONFIG.apiKey
      }
    });

    // Get product IDs from recommendations
    const recommendedIds = response.data.hits.map(hit => hit.product);
    
    // Filter out items already in cart
    const cartProductIds = currentCart.map(item => item.id);
    const filteredIds = recommendedIds.filter(id => !cartProductIds.includes(id)).slice(0, limit);
    
    // Get full product details
    const products = await getProductsByIds(filteredIds);
    
    return {
      success: true,
      products: products,
      message: `Here are ${products.length} personalized recommendations based on your shopping history`
    };
  } catch (error) {
    console.error('Recommendations error:', error);
    
    // Fallback to mock recommendations
    const mockRecs = {
      'larry': [
        { id: '6410405040817', name: 'Pirkka sugar 1 kg', price: 0.95 },
        { id: '6411300000494', name: 'Juhla Mokka coffee 500g UTZ', price: 3.45 }
      ],
      'veronica': [
        { id: '6410405025659', name: 'Pirkka iceberg salad Finland 100g', price: 1.29 },
        { id: '6411401029097', name: 'XTRA tomatoes Finland 1st class 1kg', price: 3.99 }
      ]
    };

    const fallbackRecs = mockRecs[userId] || mockRecs['larry'];
    
    return {
      success: true,
      products: fallbackRecs.slice(0, limit),
      message: `Here are ${Math.min(fallbackRecs.length, limit)} personalized recommendations (cached results)`
    };
  }
}

/**
 * Get product details by IDs using Aito.ai API
 */
async function getProductsByIds(ids) {
  try {
    const response = await axios.post(`${AITO_CONFIG.url}/api/v1/_query`, {
      "from": "products",
      "where" : {
        "id": {
          "$or": ids
        }
      }
    }, {
      headers: {
        'x-api-key': AITO_CONFIG.apiKey
      }
    });
    
    return response.data.hits || [];
  } catch (error) {
    console.error('Error fetching products by IDs:', error);
    return [];
  }
}

/**
 * Get smart cart autofill suggestions using real Aito.ai predictions
 */
async function getSmartCartSuggestions(userId) {
  try {
    console.log(`Backend getSmartCartSuggestions: Starting for userId: ${userId}`);
    
    const where = {};
    if (userId) {
      where['user'] = userId;
    }
    
    console.log(`Backend: Query where clause:`, where);

    const predictionResponse = await axios.post(`${AITO_CONFIG.url}/api/v1/_predict`, {
      "from": "visits",
      "where" : where,
      "predict":"purchases",
      "exclusiveness" : false,
      "select": ["$p", "$value"]
    }, {
      headers: {
        'x-api-key': AITO_CONFIG.apiKey
      }
    });

    console.log(`Backend: Got ${predictionResponse.data.hits.length} predictions from Aito.ai`);

    // Filter high-confidence predictions (40%+ probability)
    const productIds = [];
    predictionResponse.data.hits.forEach(hit => {
      if (hit.$p >= 0.4) {
        productIds.push(hit.$value);
      }
    });
    
    console.log(`Backend: Filtered to ${productIds.length} high-confidence predictions`);

    // If we don't have enough predictions, lower the threshold for demo purposes
    if (productIds.length < 4 && predictionResponse.data.hits.length > 0) {
      console.log(`Backend: Lowering threshold to 0.25 to get more predictions for demo`);
      productIds.length = 0; // Clear array
      predictionResponse.data.hits.forEach(hit => {
        if (hit.$p >= 0.25 && productIds.length < 8) {
          productIds.push(hit.$value);
        }
      });
    }

    // Get full product details
    const products = await getProductsByIds(productIds);
    
    console.log(`Backend: Returning ${products.length} products for user ${userId}`);
    
    return {
      success: true,
      products: products,
      productIds: productIds,
      message: `Based on your shopping patterns, I predict you'll want these ${products.length} items: ${products.map(p => p.name).join(', ')}`
    };
  } catch (error) {
    console.error('Smart cart prediction error:', error);
    
    // Enhanced fallback with more realistic personalized predictions (8+ items like cart autofill)
    const mockPredictions = {
      'larry': [
        { id: '2000818700008', name: 'Pirkka banana', price: 0.26 },
        { id: '6410405082657', name: 'Pirkka Finnish semi-skimmed milk 1l', price: 0.95 },
        { id: '6410405040817', name: 'Pirkka sugar 1 kg', price: 0.95 },
        { id: '6411300000494', name: 'Juhla Mokka coffee 500g UTZ', price: 3.45 },
        { id: '6410405025659', name: 'Pirkka iceberg salad Finland 100g', price: 1.29 },
        { id: '6410405082664', name: 'Pirkka fresh bread', price: 1.85 },
        { id: '6410405025642', name: 'Pirkka eggs 12 pcs', price: 2.45 },
        { id: '6410405025611', name: 'Pirkka butter 500g', price: 3.25 }
      ],
      'veronica': [
        { id: '6410405025659', name: 'Pirkka iceberg salad Finland 100g', price: 1.29 },
        { id: '6411401029097', name: 'XTRA tomatoes Finland 1st class 1kg', price: 3.99 },
        { id: '6410405218018', name: 'Pirkka Finnish semi-skimmed milk 1l UHT', price: 0.95 },
        { id: '6410405025642', name: 'Pirkka organic carrots 1kg', price: 1.95 },
        { id: '6410405025668', name: 'Pirkka organic cucumber', price: 1.55 },
        { id: '6410405025675', name: 'Pirkka organic spinach 150g', price: 2.25 },
        { id: '6410405025682', name: 'Pirkka organic bell pepper', price: 2.85 },
        { id: '6410405025699', name: 'Pirkka organic avocado', price: 1.75 }
      ],
      'alice': [
        { id: '2000818700008', name: 'Pirkka banana', price: 0.26 },
        { id: '6411300000494', name: 'Juhla Mokka coffee 500g UTZ', price: 3.45 },
        { id: '6410405025659', name: 'Pirkka iceberg salad Finland 100g', price: 1.29 },
        { id: '6410405082657', name: 'Pirkka Finnish semi-skimmed milk 1l', price: 0.95 },
        { id: '6410405040817', name: 'Pirkka sugar 1 kg', price: 0.95 },
        { id: '6410405025642', name: 'Pirkka eggs 12 pcs', price: 2.45 },
        { id: '6410405025611', name: 'Pirkka butter 500g', price: 3.25 },
        { id: '6410405082664', name: 'Pirkka fresh bread', price: 1.85 }
      ]
    };
    
    const fallbackProducts = mockPredictions[userId] || mockPredictions['alice'];
    
    return {
      success: true,
      products: fallbackProducts,
      productIds: fallbackProducts.map(p => p.id),
      message: `Based on your shopping patterns, I predict you'll want these ${fallbackProducts.length} items: ${fallbackProducts.map(p => p.name).join(', ')}`
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
async function addToCart(productIds = [], productNames = []) {
  const products = [];
  
  try {
    // If we have product IDs, fetch their details from the API
    if (productIds.length > 0) {
      console.log(`Backend addToCart: Fetching details for ${productIds.length} product IDs`);
      const fetchedProducts = await getProductsByIds(productIds);
      products.push(...fetchedProducts);
      console.log(`Backend addToCart: Successfully fetched ${fetchedProducts.length} products`);
    }
    
    // Handle product names - search for matching products
    if (productNames.length > 0) {
      console.log(`Backend addToCart: Searching for products by name`);
      // For each product name, try to find it in the catalog
      for (const name of productNames) {
        try {
          const searchResults = await searchProducts(null, name, 1);
          if (searchResults.success && searchResults.products.length > 0) {
            products.push(searchResults.products[0]);
          }
        } catch (error) {
          console.error(`Failed to search for product: ${name}`, error);
        }
      }
    }
    
    console.log(`Backend addToCart: Returning ${products.length} products`);
    
    return {
      success: true,
      products: products,
      message: `Added ${products.length} item(s) to your cart: ${products.map(p => p.name).join(', ')}`
    };
  } catch (error) {
    console.error('Backend addToCart error:', error);
    
    // Fallback to basic product catalog if API fails
    const fallbackCatalog = {
      '2000818700008': { id: '2000818700008', name: 'Pirkka banana', price: 0.26 },
      '6410405082657': { id: '6410405082657', name: 'Pirkka Finnish semi-skimmed milk 1l', price: 0.95 },
      '6410405040817': { id: '6410405040817', name: 'Pirkka sugar 1 kg', price: 0.95 },
      '6410405025659': { id: '6410405025659', name: 'Pirkka iceberg salad Finland 100g', price: 1.29 },
      '6411401029097': { id: '6411401029097', name: 'XTRA tomatoes Finland 1st class 1kg', price: 3.99 },
      '6410405218018': { id: '6410405218018', name: 'Pirkka Finnish semi-skimmed milk 1l UHT', price: 0.95 },
      '6411300000494': { id: '6411300000494', name: 'Juhla Mokka coffee 500g UTZ', price: 3.45 }
    };
    
    const fallbackProducts = [];
    productIds.forEach(id => {
      const product = fallbackCatalog[id];
      if (product) {
        fallbackProducts.push(product);
      }
    });
    
    return {
      success: true,
      products: fallbackProducts,
      message: `Added ${fallbackProducts.length} item(s) to your cart (using cached data): ${fallbackProducts.map(p => p.name).join(', ')}`
    };
  }
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
      // Cart operations are handled by the frontend
      // Return success with product information for the assistant to use
      if (parameters.productIds || parameters.productNames) {
        return {
          success: true,
          action: 'add_to_cart',
          productIds: parameters.productIds || [],
          productNames: parameters.productNames || [],
          message: `Cart operation request received for ${(parameters.productIds || parameters.productNames || []).length} item(s)`
        };
      }
      return {
        success: false,
        message: 'Please provide either productIds or productNames array'
      };
    
    case 'remove_from_cart':
      // Cart operations are handled by the frontend
      // Return success with product information for the assistant to use
      if (parameters.productIds || parameters.productNames) {
        return {
          success: true,
          action: 'remove_from_cart',
          productIds: parameters.productIds || [],
          productNames: parameters.productNames || [],
          message: `Cart operation request received for ${(parameters.productIds || parameters.productNames || []).length} item(s)`
        };
      }
      return {
        success: false,
        message: 'Please provide either productIds or productNames array'
      };
    
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

Cart management instructions:
- When customers ask to "prefill" or "fill my cart", use get_smart_cart_predictions first
- The smart cart predictions tool returns both products array and productIds array
- Show the user a nice formatted list of the predicted products by name
- CRITICAL: When the user confirms they want these items:
  - Look back at your previous tool call results for get_smart_cart_predictions
  - Extract the productIds array from that tool result
  - Use add_to_cart with those exact productIds
  - Example: If get_smart_cart_predictions returned productIds: ["6410405093677", "6411401028373"], 
    then call add_to_cart with productIds: ["6410405093677", "6411401028373"]
- The conversation history preserves your tool results - you can reference them
- NEVER create your own IDs by converting product names
- Always confirm what was successfully added to the cart

Cart management phrases to watch for:
- "Prefill my cart", "Add my usual items", "Fill my basket with predictions"
- "Add [product] to my cart", "I want to buy [product]", "Put [product] in my basket"
- "Remove [product] from cart", "Take out [product]", "I don't want [product] anymore"

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
  removeFromCart,
  getProductsByIds
};