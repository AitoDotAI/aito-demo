import React, { Component } from 'react';
import { Button, Input, Alert, Spinner, Badge } from 'reactstrap';
import { FaPaperPlane, FaRobot, FaUser, FaTools } from 'react-icons/fa';
import './Chat.css';

class AssistantChat extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      inputValue: '',
      messages: [],
      isLoading: false,
      error: null
    };
    
    this.messagesEndRef = React.createRef();
  }

  componentDidMount() {
    // Add initial assistant message
    this.setState({
      messages: [{
        role: 'assistant',
        content: this.props.chatType === 'admin' 
          ? "Hello! I'm your admin assistant. I can help you with analytics, inventory management, and business insights. What would you like to know?"
          : "Hi! 👋 I'm your shopping assistant. How can I help you today?"
      }]
    });
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }

  scrollToBottom = () => {
    if (this.messagesEndRef.current) {
      this.messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  handleInputChange = (e) => {
    this.setState({ inputValue: e.target.value });
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { inputValue } = this.state;
    
    if (!inputValue.trim() || this.state.isLoading) return;
    
    await this.handleMessage(inputValue.trim());
    this.setState({ inputValue: '' });
  };

  // Main message handling method
  handleMessage = async (userMessage) => {
    if (!userMessage.trim() || this.state.isLoading) return;

    // Add user message immediately
    this.setState(prevState => ({
      messages: [...prevState.messages, { role: 'user', content: userMessage }],
      isLoading: true,
      error: null
    }));

    try {
      // Pass current conversation history to the sendMessage prop
      const context = {
        conversationHistory: this.state.messages
      };

      const result = await this.props.sendMessage(userMessage, context);
      
      // Add assistant response
      this.setState(prevState => ({
        messages: [...prevState.messages, { 
          role: 'assistant', 
          content: result.response || 'I apologize, but I was unable to generate a response.' 
        }],
        isLoading: false,
        error: result.success === false ? result.error : null
      }));
    } catch (error) {
      console.error('Message handling error:', error);
      this.setState(prevState => ({
        messages: [...prevState.messages, { 
          role: 'assistant', 
          content: 'I apologize, but I encountered an error. Please try again.' 
        }],
        isLoading: false,
        error: error.message
      }));
    }
  };

  // Expose for external calls (like quick action buttons)
  sendMessage = async (userMessage) => {
    return await this.handleMessage(userMessage);
  };

  clearChat = () => {
    this.setState({ 
      messages: [{
        role: 'assistant',
        content: this.props.chatType === 'admin' 
          ? "Hello! I'm your admin assistant. I can help you with analytics, inventory management, and business insights. What would you like to know?"
          : "Hi! 👋 I'm your shopping assistant. How can I help you today?"
      }],
      error: null 
    });
  };

  formatMessage = (message, index) => {
    if (message.role === 'system') return null;

    const isUser = message.role === 'user';
    const isTool = message.role === 'tool';

    if (isTool) return null; // Don't display tool messages

    return (
      <div 
        key={index} 
        className={`chat-message ${isUser ? 'user-message' : 'assistant-message'}`}
      >
        <div className="message-header">
          <div className="message-avatar">
            {isUser ? <FaUser /> : <FaRobot />}
          </div>
          <div className="message-info">
            <span className="message-sender">
              {isUser ? 'You' : (this.props.chatType === 'admin' ? 'Admin Assistant' : 'Shopping Assistant')}
            </span>
            <span className="message-time">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        
        <div className="message-content">
          {this.renderMessageContent(message)}
        </div>
        
        {message.tool_calls && message.tool_calls.length > 0 && (
          <div className="tool-calls-indicator">
            <FaTools /> Using {message.tool_calls.length} tool{message.tool_calls.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
    );
  };

  renderMessageContent = (message) => {
    // Simple markdown-like formatting
    let content = message.content || '';
    
    // Convert **bold** to <strong>
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert *italic* to <em>
    content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Convert newlines to <br>
    content = content.replace(/\n/g, '<br>');
    
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  };

  render() {
    const { inputValue, messages, isLoading, error } = this.state;
    const { chatType } = this.props;

    return (
      <div className="chat-container">
        <div className="chat-header">
          <div className="chat-title">
            <FaRobot className="chat-icon" />
            <span>
              {chatType === 'admin' ? 'Admin Assistant' : 'Shopping Assistant'}
            </span>
            <Badge color="success" pill>AI</Badge>
          </div>
          <Button 
            color="link" 
            size="sm" 
            onClick={this.clearChat}
            disabled={isLoading}
          >
            Clear Chat
          </Button>
        </div>

        <div className="chat-messages">
          {messages.map((message, index) => this.formatMessage(message, index))}
          
          {isLoading && (
            <div className="chat-message assistant-message loading">
              <div className="message-header">
                <div className="message-avatar">
                  <FaRobot />
                </div>
                <div className="message-info">
                  <span className="message-sender">
                    {chatType === 'admin' ? 'Admin Assistant' : 'Shopping Assistant'}
                  </span>
                </div>
              </div>
              <div className="message-content">
                <Spinner size="sm" /> Thinking...
              </div>
            </div>
          )}
          
          <div ref={this.messagesEndRef} />
        </div>

        {error && (
          <Alert color="danger" className="chat-error">
            {error}
          </Alert>
        )}

        <form onSubmit={this.handleSubmit} className="chat-input-form">
          <div className="chat-input-container">
            <Input
              type="text"
              value={inputValue}
              onChange={this.handleInputChange}
              placeholder={
                chatType === 'admin' 
                  ? "Ask about analytics, inventory, or business insights..."
                  : "Ask me about products, get recommendations, or any shopping questions..."
              }
              disabled={isLoading}
              className="chat-input"
            />
            <Button 
              type="submit" 
              color="primary" 
              disabled={!inputValue.trim() || isLoading}
              className="chat-send-button"
            >
              <FaPaperPlane />
            </Button>
          </div>
        </form>
      </div>
    );
  }
}

export default AssistantChat;