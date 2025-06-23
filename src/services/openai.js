/**
 * OpenAI service for Azure GPT integration via microbackend
 * Provides chat completion functionality with tool calling capabilities
 * Routes requests through backend to keep API keys secure
 */

const config = require('../config.js');

// Backend configuration
const BACKEND_CONFIG = {
  baseURL: process.env.REACT_APP_CHAT_BACKEND_URL || 'http://localhost:3001',
  timeout: 60000 // 60 seconds
};

/**
 * Check if backend is available
 */
async function checkBackendHealth() {
  try {
    const response = await fetch(`${BACKEND_CONFIG.baseURL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Backend health check failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('Backend health check failed:', error.message);
    throw new Error('Chat backend is not available. Please ensure the backend server is running.');
  }
}

/**
 * Call Azure OpenAI via backend with messages and optional tools
 * @param {Array} messages - Array of message objects
 * @param {Array} tools - Optional array of tool definitions
 * @param {string} modelName - Model deployment name (ignored, configured in backend)
 * @returns {Promise<Object>} Chat completion response
 */
export async function createChatCompletion(messages, tools = null, modelName = null) {
  try {
    // Check backend health first
    await checkBackendHealth();

    const requestBody = {
      messages: messages,
      max_tokens: 2000,
      temperature: 0.7
    };

    // Add tools if provided
    if (tools && tools.length > 0) {
      requestBody.tools = tools;
    }

    console.log('Making backend request:', {
      endpoint: `${BACKEND_CONFIG.baseURL}/api/chat/completions`,
      messageCount: messages.length,
      toolCount: tools?.length || 0
    });

    const response = await fetch(`${BACKEND_CONFIG.baseURL}/api/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      timeout: BACKEND_CONFIG.timeout
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Backend request failed: ${response.status}`);
    }

    const completion = await response.json();
    
    console.log('Backend response received:', {
      choices: completion.choices?.length,
      finishReason: completion.choices?.[0]?.finish_reason,
      hasToolCalls: !!completion.choices?.[0]?.message?.tool_calls?.length
    });

    return completion;
  } catch (error) {
    console.error('Chat completion error:', error);
    
    // Enhanced error handling
    if (error.message.includes('Chat backend is not available')) {
      throw new Error('Chat service is temporarily unavailable. Please make sure the backend server is running on port 3001.');
    } else if (error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to chat service. Please check your connection.');
    } else {
      throw new Error(`Chat error: ${error.message || 'Unknown error occurred'}`);
    }
  }
}

/**
 * Create a system message for the chat
 * @param {string} content - System message content
 * @returns {Object} System message object
 */
export function createSystemMessage(content) {
  return {
    role: 'system',
    content: content
  };
}

/**
 * Create a user message for the chat
 * @param {string} content - User message content
 * @returns {Object} User message object
 */
export function createUserMessage(content) {
  return {
    role: 'user',
    content: content
  };
}

/**
 * Create an assistant message for the chat
 * @param {string} content - Assistant message content
 * @param {Array} toolCalls - Optional tool calls
 * @returns {Object} Assistant message object
 */
export function createAssistantMessage(content, toolCalls = null) {
  const message = {
    role: 'assistant',
    content: content
  };
  
  if (toolCalls) {
    message.tool_calls = toolCalls;
  }
  
  return message;
}

/**
 * Create a tool message for the chat
 * @param {string} toolCallId - Tool call ID
 * @param {string} content - Tool result content
 * @returns {Object} Tool message object
 */
export function createToolMessage(toolCallId, content) {
  return {
    role: 'tool',
    tool_call_id: toolCallId,
    content: JSON.stringify(content)
  };
}

/**
 * Check if chat backend is properly configured
 * @returns {boolean} True if configured
 */
export function isConfigured() {
  return !!BACKEND_CONFIG.baseURL;
}

/**
 * Get configuration status for debugging
 * @returns {Object} Configuration status
 */
export function getConfigStatus() {
  return {
    backendURL: BACKEND_CONFIG.baseURL,
    timeout: BACKEND_CONFIG.timeout,
    note: 'API keys are configured on the backend server'
  };
}