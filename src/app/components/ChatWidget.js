import React, { Component } from 'react';
import { Badge } from 'reactstrap';
import { FaComments, FaTimes, FaPaperPlane, FaRobot } from 'react-icons/fa';
import ChatCore from './ChatCore';
import { CUSTOMER_TOOLS, executeCustomerTool, CUSTOMER_SYSTEM_PROMPT } from '../../services/chatTools/customerTools';
import './ChatWidget.css';

class ChatWidget extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      isOpen: false,
      inputValue: '',
      unreadCount: 0
    };
    
    this.messagesEndRef = React.createRef();
    this.chatCoreRef = React.createRef();
  }

  componentDidMount() {
    // Show initial unread indicator after a delay
    setTimeout(() => {
      if (!this.state.isOpen) {
        this.setState({ unreadCount: 1 });
      }
    }, 3000);
  }

  componentDidUpdate(prevProps, prevState) {
    // Scroll to bottom when new messages arrive
    this.scrollToBottom();
    
    // Reset unread count when opened
    if (!prevState.isOpen && this.state.isOpen) {
      this.setState({ unreadCount: 0 });
    }
  }

  scrollToBottom = () => {
    if (this.messagesEndRef.current) {
      this.messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  toggleChat = () => {
    this.setState(prevState => ({
      isOpen: !prevState.isOpen
    }));
  };

  handleInputChange = (e) => {
    this.setState({ inputValue: e.target.value });
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { inputValue } = this.state;
    
    if (!inputValue.trim() || this.state.isLoading) return;
    
    await this.sendMessage(inputValue.trim());
    this.setState({ inputValue: '' });
  };

  // Expose sendMessage method for external calls (like quick actions)
  sendMessage = async (userMessage) => {
    if (this.chatCoreRef.current) {
      return await this.chatCoreRef.current.sendMessage(userMessage);
    }
  };

  // Custom tool execution for ChatWidget
  executeToolFunction = async (toolName, parameters, userId, currentCart) => {
    console.log(`ChatWidget executing tool: ${toolName}`, parameters);
    
    // Handle cart operations through parent component
    if (toolName === 'add_to_cart' || toolName === 'remove_from_cart') {
      if (this.props.onCartOperation) {
        return await this.props.onCartOperation(toolName, parameters);
      } else {
        return {
          success: false,
          message: 'Cart operations are not available in this context.'
        };
      }
    }
    
    // Execute other tools normally
    return await executeCustomerTool(toolName, parameters, userId, currentCart);
  };


  handleQuickAction = (action) => {
    this.sendMessage(action);
  };

  formatMessageContent = (content) => {
    if (!content) return '';
    
    // Simple text formatting for the widget
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .split('\n')
      .map((line, index) => (
        <div key={index}>{line || <br />}</div>
      ));
  };

  render() {
    const { isOpen, inputValue, unreadCount } = this.state;
    const { userId, currentCart } = this.props;

    return (
      <ChatCore
        ref={this.chatCoreRef}
        chatType="customer"
        systemPrompt={CUSTOMER_SYSTEM_PROMPT}
        tools={CUSTOMER_TOOLS}
        executeToolFunction={this.executeToolFunction}
        userId={userId}
        currentCart={currentCart}
        welcomeMessage="Hi! 👋 I'm your shopping assistant. How can I help you today?"
        onMessagesUpdate={() => this.scrollToBottom()}
      >
        {({ messages, isLoading, error, isConfigured }) => {
          if (!isConfigured) {
            return null; // Don't show widget if not configured
          }

          return (
            <>
              {/* Floating Chat Button */}
              {!isOpen && (
                <button 
                  className="chat-widget-button"
                  onClick={this.toggleChat}
                  aria-label="Open chat"
                >
                  <FaComments />
                  {unreadCount > 0 && (
                    <Badge color="danger" className="chat-widget-badge">
                      {unreadCount}
                    </Badge>
                  )}
                </button>
              )}

              {/* Chat Window */}
              {isOpen && (
                <div className="chat-widget-container">
                  {/* Header */}
                  <div className="chat-widget-header">
                    <div className="chat-widget-header-info">
                      <FaRobot className="chat-widget-avatar" />
                      <div>
                        <h6 className="chat-widget-title">Shopping Assistant</h6>
                        <span className="chat-widget-status">Always here to help</span>
                      </div>
                    </div>
                    <button 
                      className="chat-widget-close"
                      onClick={this.toggleChat}
                      aria-label="Close chat"
                    >
                      <FaTimes />
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="chat-widget-messages">
                    {messages.length > 0 ? messages.map((message, index) => {
                      // Safety check for message structure
                      if (!message || !message.role) {
                        console.warn('Invalid message structure:', message);
                        return null;
                      }
                      
                      return (
                        <div 
                          key={`msg-${index}-${message.role}`}
                          className={`chat-widget-message ${
                            message.role === 'user' ? 'user' : 'assistant'
                          }`}
                        >
                          <div className="chat-widget-message-content">
                            {this.formatMessageContent(message.content)}
                          </div>
                        </div>
                      );
                    }).filter(Boolean) : null}
                    
                    {isLoading && (
                      <div className="chat-widget-message assistant">
                        <div className="chat-widget-message-content">
                          <div className="chat-widget-typing">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {error && (
                      <div className="chat-widget-error">
                        {error}
                      </div>
                    )}
                    
                    <div ref={this.messagesEndRef} />
                  </div>

                  {/* Quick Actions */}
                  {messages.length <= 2 && (
                    <div className="chat-widget-quick-actions">
                      <button 
                        onClick={() => this.handleQuickAction('Show me today\'s deals')}
                        className="chat-widget-quick-btn"
                      >
                        Today's Deals
                      </button>
                      <button 
                        onClick={() => this.handleQuickAction('I need help finding products')}
                        className="chat-widget-quick-btn"
                      >
                        Product Search
                      </button>
                      <button 
                        onClick={() => this.handleQuickAction('What are your delivery options?')}
                        className="chat-widget-quick-btn"
                      >
                        Delivery Info
                      </button>
                    </div>
                  )}

                  {/* Input */}
                  <form onSubmit={this.handleSubmit} className="chat-widget-input-form">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={this.handleInputChange}
                      placeholder="Type your message..."
                      disabled={isLoading}
                      className="chat-widget-input"
                    />
                    <button
                      type="submit"
                      disabled={!inputValue.trim() || isLoading}
                      className="chat-widget-send"
                      aria-label="Send message"
                    >
                      <FaPaperPlane />
                    </button>
                  </form>
                </div>
              )}
            </>
          );
        }}
      </ChatCore>
    );
  }
}

export default ChatWidget;