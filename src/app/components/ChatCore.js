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

      // Handle tool calls
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        const toolResults = await this.executeTools(
          assistantMessage.tool_calls, 
          userId, 
          currentCart
        );
        
        finalMessages = [...finalMessages, ...toolResults.messages];
        
        // Get final response with proper context
        const finalContextMessages = this.buildValidMessageContext(finalMessages);
        
        const finalResponse = await createChatCompletion(
          finalContextMessages,
          tools
        );
        
        finalMessages.push(finalResponse.choices[0].message);
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
    
    // Keep system message and recent context (last 15 messages)
    const systemMessage = validMessages.find(m => m.role === 'system');
    const nonSystemMessages = validMessages.filter(m => m.role !== 'system');
    const recentMessages = nonSystemMessages.slice(-14); // Leave room for system message
    
    return systemMessage ? [systemMessage, ...recentMessages] : recentMessages;
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