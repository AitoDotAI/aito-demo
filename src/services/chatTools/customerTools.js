/**
 * Customer Chat Tools
 * Provides tools for customer-facing AI assistant
 */

import { getProductSearchResults } from '../../01-search';
import { getRecommendedProducts } from '../../02-recommend';
import { getAutoComplete } from '../../04-autocomplete';
import { getAutoFill, getProductsByIds } from '../../05-autofill';
import { prompt } from '../../06-prompt';

/**
 * Search for products based on user query
 */
async function searchProducts(userId, query, limit = 5) {
  try {
    const results = await getProductSearchResults(userId, query);
    return {
      success: true,
      products: results.slice(0, limit),
      message: `Found ${results.length} products matching "${query}"`
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
    const results = await getRecommendedProducts(userId, currentCart, limit);
    return {
      success: true,
      products: results,
      message: `Here are ${results.length} personalized recommendations for you`
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
 * Get autocomplete suggestions for search
 */
async function getSearchSuggestions(userId, prefix) {
  try {
    const results = await getAutoComplete(userId, prefix);
    const suggestions = results
      .filter(item => item.$p > 0.001)
      .slice(0, 5)
      .map(item => item.$value);
    
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
 * Get smart cart autofill suggestions based on user history
 */
async function getSmartCartSuggestions(userId) {
  try {
    const productIds = await getAutoFill(userId);
    
    if (productIds.length === 0) {
      return {
        success: true,
        products: [],
        productIds: [],
        message: `I don't have enough purchase history to make predictions yet. Try browsing our products and I'll learn your preferences!`
      };
    }

    // Get full product details for the predicted IDs
    const products = await getProductsByIds(productIds);
    
    return {
      success: true,
      products: products.slice(0, 8), // Limit to 8 suggestions
      productIds: productIds.slice(0, 8), // Include IDs for easy cart addition
      message: `Based on your shopping patterns, I predict you'll want these ${Math.min(products.length, 8)} items on your next visit`
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
 * Get shopping list suggestions based on user history (legacy function)
 */
async function getShoppingListSuggestions(userId) {
  try {
    const results = await getAutoFill(userId);
    return {
      success: true,
      suggestions: results,
      message: `Based on your shopping history, you might want to add these items to your list`
    };
  } catch (error) {
    console.error('Shopping list error:', error);
    return {
      success: false,
      suggestions: [],
      message: `Sorry, I couldn't get shopping list suggestions right now.`
    };
  }
}

/**
 * Analyze customer prompts using AI to understand intent and provide smart responses
 */
async function analyzePrompt(userPrompt) {
  try {
    const analysis = await prompt(userPrompt);
    
    if (!analysis || !analysis.type) {
      return {
        success: false,
        type: 'unknown',
        message: 'I couldn\'t understand your question. Could you please rephrase it?'
      };
    }

    if (analysis.type === 'question' && analysis.answer) {
      return {
        success: true,
        type: 'question',
        answer: analysis.answer.answer || analysis.answer,
        message: 'I found an answer to your question'
      };
    } else if (analysis.type === 'feedback') {
      let feedbackResponse = 'Thank you for your feedback! ';
      
      if (analysis.sentiment) {
        if (analysis.sentiment === 'positive') {
          feedbackResponse += 'We\'re glad to hear you had a good experience. ';
        } else if (analysis.sentiment === 'negative') {
          feedbackResponse += 'We\'re sorry to hear about your experience and will work to improve. ';
        }
      }
      
      if (analysis.categories) {
        feedbackResponse += `Your feedback about ${analysis.categories} has been noted. `;
      }
      
      feedbackResponse += 'Your input helps us provide better service!';
      
      return {
        success: true,
        type: 'feedback',
        sentiment: analysis.sentiment,
        categories: analysis.categories,
        tags: analysis.tags,
        message: feedbackResponse
      };
    } else if (analysis.type === 'request') {
      let requestResponse = 'I\'ve understood your request. ';
      
      if (analysis.assignee) {
        requestResponse += `I'll route this to ${analysis.assignee} who can best help you. `;
      }
      
      if (analysis.urgency) {
        requestResponse += `This has been marked as ${analysis.urgency} priority. `;
      }
      
      if (analysis.categories) {
        requestResponse += `This relates to: ${analysis.categories}. `;
      }
      
      requestResponse += 'You should receive a response within 24 hours.';
      
      return {
        success: true,
        type: 'request',
        assignee: analysis.assignee,
        urgency: analysis.urgency,
        categories: analysis.categories,
        message: requestResponse
      };
    }

    return {
      success: true,
      type: analysis.type,
      message: 'I understood your message but don\'t have a specific response for this type of inquiry.'
    };
  } catch (error) {
    console.error('Prompt analysis error:', error);
    return {
      success: false,
      type: 'error',
      message: 'I had trouble understanding your message. Please try rephrasing it or ask me something specific about products or shopping.'
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
export const CUSTOMER_TOOLS = [
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
      name: 'get_shopping_list_suggestions',
      description: 'Get shopping list suggestions based on user purchase history.',
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
      name: 'get_smart_cart_predictions',
      description: 'Get AI-powered cart predictions with full product details based on user shopping patterns. More advanced than shopping list suggestions.',
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
      description: 'Analyze customer messages using AI to understand intent, classify feedback, or handle special requests. Use this for complex questions or when the customer message needs interpretation.',
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
      name: 'add_to_cart',
      description: 'Add a product to the customer\'s shopping cart. Use this when a customer asks to add items to their cart or wants to purchase something. Provide either productId or productName.',
      parameters: {
        type: 'object',
        properties: {
          productId: {
            type: 'string',
            description: 'The exact product ID to add to cart (optional if productName is provided)'
          },
          productName: {
            type: 'string',
            description: 'The product name to search for and add to cart (optional if productId is provided)'
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
      description: 'Remove a product from the customer\'s shopping cart. Use this when a customer asks to remove items from their cart. Provide either productId or productName.',
      parameters: {
        type: 'object',
        properties: {
          productId: {
            type: 'string',
            description: 'The exact product ID to remove from cart (optional if productName is provided)'
          },
          productName: {
            type: 'string',
            description: 'The product name to find and remove from cart (optional if productId is provided)'
          }
        },
        required: []
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
 * Execute a tool function call
 */
export async function executeCustomerTool(toolName, parameters, userId, currentCart = []) {
  console.log(`Executing customer tool: ${toolName} for user: ${userId}`, parameters);
  
  switch (toolName) {
    case 'search_products':
      return await searchProducts(userId, parameters.query, parameters.limit);
    
    case 'get_recommendations':
      return await getRecommendations(userId, currentCart, parameters.limit);
    
    case 'get_search_suggestions':
      return await getSearchSuggestions(userId, parameters.prefix);
    
    case 'get_shopping_list_suggestions':
      return await getShoppingListSuggestions(userId);
    
    case 'get_smart_cart_predictions':
      console.log(`Getting smart cart predictions for user: ${userId}`);
      const smartCartResult = await getSmartCartSuggestions(userId);
      console.log(`Smart cart result:`, smartCartResult);
      return smartCartResult;
    
    case 'analyze_customer_message':
      return await analyzePrompt(parameters.message);
    
    case 'get_general_help':
      return getGeneralHelp(parameters.topic);
    
    case 'add_to_cart':
    case 'remove_from_cart':
      // These are handled by the CustomerChatPage component
      return {
        success: false,
        message: `Cart operations should be handled by the page component`
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
export const CUSTOMER_SYSTEM_PROMPT = `You are an advanced AI shopping assistant for an online grocery store with smart predictive capabilities. Your role is to help customers find products, get recommendations, and provide intelligent shopping assistance.

Key capabilities:
- Search for products based on customer requests with personalized results
- Provide AI-powered recommendations based on shopping history and preferences
- Smart cart predictions - predict what customers will likely want to buy next
- Add and remove items from the shopping cart by name or product ID
- Natural language understanding - analyze complex customer messages and feedback
- Autocomplete and search suggestions for better product discovery
- Intelligent shopping list suggestions based on purchase patterns
- Answer questions about products, store policies, and shopping

Advanced features:
- Smart cart autofill: Use predictive analytics to suggest items customers are likely to buy based on their shopping patterns
- Message analysis: Understand customer intent, classify feedback (positive/negative), and handle special requests
- Personalized recommendations that consider dietary restrictions and preferences

Customer context:
- You're talking to a customer who is shopping online
- Be friendly, helpful, and conversational
- Always prioritize the customer's dietary restrictions and preferences
- If someone mentions being lactose-intolerant, focus on lactose-free options
- For health-conscious customers, emphasize organic and low-sodium products
- Use the available tools to provide specific product information and recommendations

Guidelines:
- Always use tools when the customer asks for specific products or recommendations
- Use add_to_cart when customers say they want to buy, purchase, or add items to their cart
- Use remove_from_cart when customers want to remove items from their cart
- For complex messages or feedback, use the message analysis tool to better understand intent
- Proactively suggest smart cart predictions when customers ask about shopping lists
- Be proactive in suggesting alternatives and related products
- Explain why you're recommending certain products when relevant
- Keep responses concise but informative
- Use the smart features to anticipate customer needs

Special instructions:
- When customers ask about "what to buy" or "shopping list", offer smart cart predictions
- When customers express interest in a product, ask if they'd like to add it to their cart
- For feedback or complaints, use message analysis to provide appropriate responses
- Always leverage the predictive capabilities to make shopping more convenient
- After adding items to cart, suggest complementary products or ask if they need anything else

Cart management instructions:
- When customers ask to "prefill" or "fill my cart", use get_smart_cart_predictions first
- If the customer agrees to add predicted items, add them one by one using add_to_cart with productId
- For each product added, briefly mention what it is
- Always show a summary of what was added to the cart

Cart management phrases to watch for:
- "Add [product] to my cart", "I want to buy [product]", "Put [product] in my basket"
- "Remove [product] from cart", "Take out [product]", "I don't want [product] anymore"
- "Prefill my cart", "Add my usual items", "Fill my basket with predictions"

Remember: You're an intelligent assistant that learns from shopping patterns to make grocery shopping smarter and more personalized!`;