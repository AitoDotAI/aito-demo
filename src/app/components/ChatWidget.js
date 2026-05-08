import React, { Component } from 'react';
import { Badge } from 'reactstrap';
import { FaComments, FaTimes, FaPaperPlane, FaRobot } from 'react-icons/fa';
import assistantClient from '../../services/assistantClient';
import './ChatWidget.css';

class ChatWidget extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      isOpen: false,
      inputValue: '',
      unreadCount: 0,
      messages: [
        {
          role: 'assistant',
          content: "Hi! 👋 I'm your shopping assistant. How can I help you today?"
        }
      ],
      isLoading: false,
      error: null,
      isConfigured: true
    };
    
    this.messagesEndRef = React.createRef();
  }

  componentDidMount() {
    // Mark the body so other fixed-position widgets (LatencyPill) can
    // lift themselves above the chat button on pages that show it.
    document.body.classList.add('has-chat-widget');

    // Show initial unread indicator after a delay
    setTimeout(() => {
      if (!this.state.isOpen) {
        this.setState({ unreadCount: 1 });
      }
    }, 3000);
  }

  componentWillUnmount() {
    document.body.classList.remove('has-chat-widget');
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

  // Send message using the new assistant client
  sendMessage = async (userMessage) => {
    if (!userMessage.trim() || this.state.isLoading) return;

    // Add user message to conversation
    this.setState(prevState => ({
      messages: [...prevState.messages, { role: 'user', content: userMessage }],
      isLoading: true,
      error: null
    }));

    try {
      // Build context for the assistant
      const context = {
        userId: this.props.userId || 'guest',
        cartItems: this.props.currentCart?.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price
        })) || [],
        currentPage: window.location.pathname
      };

      // Send message to assistant with conversation history
      const result = await assistantClient.sendCustomerMessage(userMessage, context, this.state.messages);

      if (result.success) {
        // Handle cart operations if any
        if (result.cartOperations && result.cartOperations.length > 0 && this.props.actions) {
          result.cartOperations.forEach(operation => {
            if (operation.type === 'add' && operation.products) {
              operation.products.forEach(product => {
                this.props.actions.addItemToCart(product);
              });
            } else if (operation.type === 'remove' && operation.productIds) {
              operation.productIds.forEach(productId => {
                this.props.actions.removeItemFromCart(productId);
              });
            }
          });
        }
        
        // Use the enhanced conversation history from server if available
        if (result.conversationHistory) {
          this.setState({
            messages: result.conversationHistory,
            isLoading: false
          });
        } else {
          // Fallback: Add assistant response to conversation
          this.setState(prevState => ({
            messages: [...prevState.messages, { role: 'assistant', content: result.response }],
            isLoading: false
          }));
        }
      } else {
        // Handle error - use server conversation history if available, otherwise add error message
        if (result.conversationHistory) {
          this.setState({
            messages: result.conversationHistory,
            isLoading: false,
            error: result.error
          });
        } else {
          this.setState(prevState => ({
            messages: [...prevState.messages, { 
              role: 'assistant', 
              content: result.response || 'I apologize, but I encountered an error. Please try again.' 
            }],
            isLoading: false,
            error: result.error
          }));
        }
      }
    } catch (error) {
      console.error('ChatWidget sendMessage error:', error);
      this.setState(prevState => ({
        messages: [...prevState.messages, { 
          role: 'assistant', 
          content: 'I apologize, but I\'m having trouble processing your request right now. Please try again later.' 
        }],
        isLoading: false,
        error: error.message
      }));
    }
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
    const { isOpen, inputValue, unreadCount, messages, isLoading, error, isConfigured } = this.state;

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
                        onClick={() => this.handleQuickAction('Prefill my cart with predicted items')}
                        className="chat-widget-quick-btn"
                      >
                        Smart Cart Fill
                      </button>
                      <button 
                        onClick={() => this.handleQuickAction('Give me personalized recommendations')}
                        className="chat-widget-quick-btn"
                      >
                        Recommendations
                      </button>
                      <button 
                        onClick={() => this.handleQuickAction('Help me search for products')}
                        className="chat-widget-quick-btn"
                      >
                        Product Search
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
  }
}

export default ChatWidget;