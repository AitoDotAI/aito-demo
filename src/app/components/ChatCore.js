import React, { Component } from 'react';
import { 
  createChatCompletion, 
  createSystemMessage, 
  createUserMessage, 
  createAssistantMessage, 
  createToolMessage,
  isConfigured 
} from '../../services/openai';

/**
 * Core chat functionality that can be shared between different chat interfaces
 * Handles message management, tool execution, and OpenAI API integration
 */
class ChatCore extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      messages: [],
      isLoading: false,
      error: null,
      isConfigured: isConfigured()
    };
  }

  componentDidMount() {
    this.initializeChat();
  }

  componentDidUpdate(prevProps) {
    // Reset chat if user changes
    if (prevProps.userId !== this.props.userId) {
      this.initializeChat();
    }
  }

  initializeChat = () => {
    const { systemPrompt, welcomeMessage } = this.props;
    
    const defaultWelcome = this.props.chatType === 'admin' 
      ? "Hello! I'm your admin assistant. I can help you with analytics, inventory management, product insights, and business reports. What would you like to know?"
      : `Hello! I'm your shopping assistant. I can help you find products, get recommendations, and answer questions about your shopping. What can I help you with today?`;

    this.setState({
      messages: [
        createSystemMessage(systemPrompt),
        createAssistantMessage(welcomeMessage || defaultWelcome)
      ],
      error: null
    });
  };

  sendMessage = async (userMessage) => {
    const { tools, executeToolFunction, userId, currentCart } = this.props;
    
    this.setState({ isLoading: true, error: null });
    
    try {
      // Add user message
      const userMsg = createUserMessage(userMessage);
      const updatedMessages = [...this.state.messages, userMsg];
      this.setState({ messages: updatedMessages });

      // Get assistant response
      const contextMessages = this.buildValidMessageContext(updatedMessages);
      
      const response = await createChatCompletion(
        contextMessages,
        tools
      );

      const assistantMessage = response.choices[0].message;
      let finalMessages = [...updatedMessages, assistantMessage];

      // Handle tool calls with loop protection
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        console.log('Processing tool calls:', assistantMessage.tool_calls.map(tc => tc.function.name));
        
        const toolResults = await this.executeTools(
          assistantMessage.tool_calls, 
          userId, 
          currentCart
        );
        
        console.log('Tool execution completed, getting final response...');
        finalMessages = [...finalMessages, ...toolResults.messages];
        
        // Get final response with proper context
        const finalContextMessages = this.buildValidMessageContext(finalMessages);
        
        // Add a system message to guide the AI to provide a final response
        // and explicitly prevent JSON leaking into the response
        const finalContextWithInstruction = [
          ...finalContextMessages,
          {
            role: 'system',
            content: `CRITICAL INSTRUCTIONS FOR THIS RESPONSE:
- You have already executed all necessary tools above. Do NOT attempt any more tool calls.
- Do NOT output any JSON, code blocks, product IDs, or technical data in your response.
- Summarize the tool results in friendly, natural language only.
- If the tool returned products, list them by NAME and optionally price — never by raw ID.
- Ask the customer if they would like to add these items to their cart.`
          }
        ];
        
        // Request final response without tools to prevent infinite loops
        const finalResponse = await createChatCompletion(
          finalContextWithInstruction,
          [] // Empty tools array forces a text response
        );
        
        const finalAssistantMessage = finalResponse.choices[0].message;
        
        // Safety check: If we still get tool calls, create a fallback message
        if (finalAssistantMessage.tool_calls && finalAssistantMessage.tool_calls.length > 0) {
          console.warn('AI returned tool calls after tool execution - creating fallback response');
          finalMessages.push({
            role: 'assistant',
            content: this.createFallbackResponse(toolResults.messages)
          });
        } else {
          finalMessages.push(finalAssistantMessage);
        }
      }

      this.setState({ 
        messages: finalMessages,
        isLoading: false 
      });

      // Notify parent of message update
      if (this.props.onMessagesUpdate) {
        this.props.onMessagesUpdate(finalMessages);
      }

    } catch (error) {
      console.error('Chat error:', error);
      this.setState({
        error: error.message || 'Sorry, I encountered an error. Please try again.',
        isLoading: false
      });
    }
  };

  executeTools = async (toolCalls, userId, currentCart) => {
    const { executeToolFunction } = this.props;
    const toolMessages = [];

    for (const toolCall of toolCalls) {
      try {
        const result = await executeToolFunction(
          toolCall.function.name,
          JSON.parse(toolCall.function.arguments),
          userId,
          currentCart
        );
        
        toolMessages.push(
          createToolMessage(toolCall.id, result)
        );
      } catch (error) {
        console.error(`Tool execution error for ${toolCall.function.name}:`, error);
        toolMessages.push(
          createToolMessage(toolCall.id, {
            success: false,
            message: `Error executing ${toolCall.function.name}: ${error.message}`
          })
        );
      }
    }

    return { messages: toolMessages };
  };

  createFallbackResponse = (toolMessages) => {
    // Create a human-readable response based on tool execution results
    if (!toolMessages || toolMessages.length === 0) {
      return "I've completed the requested action.";
    }
    
    try {
      // Parse the tool results and create a summary
      const results = toolMessages.map(msg => {
        try {
          return JSON.parse(msg.content);
        } catch {
          return { message: msg.content };
        }
      });
      
      // Build response based on tool results
      let response = "I've completed your request. ";
      
      results.forEach(result => {
        if (result.message) {
          response += result.message + " ";
        }
        
        if (result.products && result.products.length > 0) {
          response += `I found ${result.products.length} products. `;
        }
        
        if (result.suggestions && result.suggestions.length > 0) {
          response += `Here are ${result.suggestions.length} suggestions. `;
        }
      });
      
      return response.trim();
    } catch (error) {
      console.error('Error creating fallback response:', error);
      return "I've completed the requested action. Please let me know if you need anything else.";
    }
  };

  buildValidMessageContext = (messages) => {
    const validMessages = [];
    
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      
      if (message.role === 'system') {
        validMessages.push(message);
      } else if (message.role === 'user') {
        validMessages.push(message);
      } else if (message.role === 'assistant') {
        validMessages.push(message);
        
        // If this assistant message has tool calls, find ALL corresponding tool responses
        if (message.tool_calls && message.tool_calls.length > 0) {
          const expectedToolCallIds = new Set(message.tool_calls.map(tc => tc.id));
          const foundToolResponses = [];
          
          // Look ahead to find all tool responses for this assistant message
          for (let j = i + 1; j < messages.length; j++) {
            const nextMessage = messages[j];
            
            if (nextMessage.role === 'tool' && expectedToolCallIds.has(nextMessage.tool_call_id)) {
              foundToolResponses.push(nextMessage);
              expectedToolCallIds.delete(nextMessage.tool_call_id);
            } else if (nextMessage.role !== 'tool') {
              // Stop looking when we hit a non-tool message
              break;
            }
          }
          
          // Add all found tool responses
          foundToolResponses.forEach(toolMsg => validMessages.push(toolMsg));
          
          // Log warning if we're missing any tool responses
          if (expectedToolCallIds.size > 0) {
            console.warn('Missing tool responses for:', Array.from(expectedToolCallIds));
          }
        }
      }
      // Skip tool messages here as they're handled above
    }
    
    // Keep system messages and recent context (last 15 messages)
    const systemMessages = validMessages.filter(m => m.role === 'system');
    const nonSystemMessages = validMessages.filter(m => m.role !== 'system');
    const recentMessages = nonSystemMessages.slice(-14); // Leave room for system messages
    
    // Always include the original system message first, then any additional system messages
    const originalSystemMessage = systemMessages.find(m => !m.content.includes('tool execution results'));
    const additionalSystemMessages = systemMessages.filter(m => m.content.includes('tool execution results'));
    
    const result = [];
    if (originalSystemMessage) result.push(originalSystemMessage);
    result.push(...recentMessages);
    result.push(...additionalSystemMessages); // Add instruction messages at the end
    
    return result;
  };

  clearChat = () => {
    this.initializeChat();
  };

  // Get filtered messages for display (excludes system and tool messages)
  getDisplayMessages = () => {
    return this.state.messages.filter(msg => {
      // Always exclude system and tool messages
      if (msg.role === 'system' || msg.role === 'tool') {
        return false;
      }
      
      // For assistant messages, only show if they have actual content
      if (msg.role === 'assistant') {
        return msg.content && msg.content.trim().length > 0;
      }
      
      // Include user messages
      return msg.role === 'user';
    });
  };

  render() {
    // This is a headless component - it only manages state and logic
    // The actual UI is rendered by child components
    if (this.props.children) {
      return this.props.children({
        messages: this.getDisplayMessages(),
        allMessages: this.state.messages,
        isLoading: this.state.isLoading,
        error: this.state.error,
        isConfigured: this.state.isConfigured,
        sendMessage: this.sendMessage,
        clearChat: this.clearChat
      });
    }
    
    return null;
  }
}

export default ChatCore;