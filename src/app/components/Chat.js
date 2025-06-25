import React, { Component } from 'react';
import { Button, Input, Alert, Spinner, Badge } from 'reactstrap';
import { FaPaperPlane, FaRobot, FaUser, FaTools } from 'react-icons/fa';
import ChatCore from './ChatCore';
import './Chat.css';

class Chat extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      inputValue: ''
    };
    
    this.messagesEndRef = React.createRef();
    this.chatCoreRef = React.createRef();
  }

  componentDidUpdate() {
    // Scroll to bottom when new messages arrive
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
    
    if (!inputValue.trim()) return;
    
    // Use ChatCore to send the message
    if (this.chatCoreRef.current) {
      await this.chatCoreRef.current.sendMessage(inputValue.trim());
      this.setState({ inputValue: '' });
    }
  };

  // Expose sendMessage method for external calls (like quick actions)
  sendMessage = async (userMessage) => {
    if (this.chatCoreRef.current) {
      return await this.chatCoreRef.current.sendMessage(userMessage);
    }
  };

  formatMessage = (message, index) => {
    if (message.role === 'system') return null;

    const isUser = message.role === 'user';
    const isAssistant = message.role === 'assistant';
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
    const { inputValue } = this.state;
    const { chatType, systemPrompt, tools, executeToolFunction, userId, currentCart } = this.props;

    return (
      <ChatCore
        ref={this.chatCoreRef}
        chatType={chatType}
        systemPrompt={systemPrompt}
        tools={tools}
        executeToolFunction={executeToolFunction}
        userId={userId}
        currentCart={currentCart}
        onMessagesUpdate={() => this.scrollToBottom()}
      >
        {({ messages, isLoading, error, isConfigured, clearChat }) => {
          if (!isConfigured) {
            return (
              <div className="chat-container">
                <Alert color="warning">
                  <h5>Chat Not Configured</h5>
                  <p>
                    The AI chat feature requires OpenAI API configuration. 
                    Please set up the following environment variables:
                  </p>
                  <ul>
                    <li>REACT_APP_OPENAI_MODEL_URL</li>
                    <li>REACT_APP_OPENAI_MODEL_API_KEY</li>
                    <li>REACT_APP_OPENAI_MODEL_DEPLOYMENT</li>
                  </ul>
                </Alert>
              </div>
            );
          }

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
                  onClick={clearChat}
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
        }}
      </ChatCore>
    );
  }
}

export default Chat;