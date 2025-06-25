import React, { Component } from 'react';
import { Container, Row, Col, Card, CardBody, Badge, Alert } from 'reactstrap';
import { FaComments, FaShoppingCart, FaUser } from 'react-icons/fa';

import Chat from '../components/Chat';
import { CUSTOMER_TOOLS, executeCustomerTool, CUSTOMER_SYSTEM_PROMPT } from '../../services/chatTools/customerTools';

import './CustomerChatPage.css';

class CustomerChatPage extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      chatKey: Date.now() // Force chat re-render when needed
    };
  }

  executeToolFunction = async (toolName, parameters, userId, currentCart) => {
    // Handle cart operations directly in the page component
    if (toolName === 'add_to_cart' || toolName === 'remove_from_cart') {
      return await this.handleCartOperation(toolName, parameters, userId, currentCart);
    }
    
    return await executeCustomerTool(toolName, parameters, userId, currentCart);
  };

  handleCartOperation = async (toolName, parameters, userId, currentCart) => {
    const { actions, dataFetchers } = this.props;
    
    try {
      if (toolName === 'add_to_cart') {
        const { productId, productName } = parameters;
        
        // Validate at least one parameter is provided
        if (!productId && !productName) {
          return {
            success: false,
            message: 'Please provide either a product ID or product name to add to cart.'
          };
        }
        
        // Find the product details
        let product = null;
        if (productId) {
          const products = await dataFetchers.getProductsByIds([productId]);
          product = products[0];
        } else if (productName) {
          // Search for product by name
          const searchResults = await dataFetchers.getProductSearchResults(productName);
          product = searchResults.find(p => 
            p.name.toLowerCase().includes(productName.toLowerCase())
          );
        }
        
        if (!product) {
          return {
            success: false,
            message: `Sorry, I couldn't find a product ${productId ? `with ID ${productId}` : `named "${productName}"`}.`
          };
        }
        
        // Check if already in cart
        const isInCart = currentCart.some(item => item.id === product.id);
        if (isInCart) {
          return {
            success: false,
            message: `${product.name} is already in your cart.`
          };
        }
        
        // Add to cart
        actions.addItemToCart(product);
        
        return {
          success: true,
          product: product,
          message: `Added ${product.name} ($${product.price}) to your cart!`
        };
        
      } else if (toolName === 'remove_from_cart') {
        const { productId, productName } = parameters;
        
        // Validate at least one parameter is provided
        if (!productId && !productName) {
          return {
            success: false,
            message: 'Please provide either a product ID or product name to remove from cart.'
          };
        }
        
        // Find the product in cart
        let productToRemove = null;
        if (productId) {
          productToRemove = currentCart.find(item => item.id === productId);
        } else if (productName) {
          productToRemove = currentCart.find(item => 
            item.name.toLowerCase().includes(productName.toLowerCase())
          );
        }
        
        if (!productToRemove) {
          return {
            success: false,
            message: `Sorry, I couldn't find ${productId ? `product ID ${productId}` : `"${productName}"`} in your cart.`
          };
        }
        
        // Remove from cart
        actions.removeItemFromCart(productToRemove.id);
        
        return {
          success: true,
          product: productToRemove,
          message: `Removed ${productToRemove.name} from your cart.`
        };
      }
    } catch (error) {
      console.error('Cart operation error:', error);
      return {
        success: false,
        message: `Sorry, I couldn't ${toolName === 'add_to_cart' ? 'add the item to' : 'remove the item from'} your cart right now.`
      };
    }
  };

  resetChat = () => {
    this.setState({ chatKey: Date.now() });
  };

  render() {
    const { selectedUserId, actions, dataFetchers, appState = {} } = this.props;
    const { chatKey } = this.state;
    
    // Use selectedUserId from props, fallback to appState if needed
    const currentUserId = selectedUserId || appState.selectedUserId || 'larry';
    
    // Define user personas locally since they're not in the main state
    const users = [
      { id: 'larry', name: 'Lactose-free Larry' },
      { id: 'veronica', name: 'Vegetarian Veronica' },
      { id: 'alice', name: 'All-goes Alice' }
    ];
    
    const selectedUser = users.find(user => user.id === currentUserId) || { id: currentUserId, name: 'Guest' };
    const currentCart = appState.cart || [];
    const cartItemCount = currentCart.length;
    const cartTotal = currentCart.reduce((total, item) => total + item.price, 0).toFixed(2);

    return (
      <div className="customer-chat-page">
        <Container fluid>
          <Row className="justify-content-center">
            <Col lg={10} xl={8}>
              {/* Page Header */}
              <div className="page-header">
                <div className="header-content">
                  <div className="header-icon">
                    <FaComments />
                  </div>
                  <div className="header-text">
                    <h2>Shopping Assistant</h2>
                    <p>Get personalized help with your shopping experience</p>
                  </div>
                </div>
              </div>

              <Row>
                {/* User Info Sidebar */}
                <Col lg={4} className="mb-4">
                  <Card className="user-info-card">
                    <CardBody>
                      <div className="user-profile">
                        <div className="user-avatar">
                          <FaUser />
                        </div>
                        <div className="user-details">
                          <h5>{selectedUser.name || selectedUser.id || 'Guest'}</h5>
                          <div className="user-badges">
                            {selectedUser.id === 'larry' && (
                              <Badge color="info" className="preference-badge">
                                Lactose-Free
                              </Badge>
                            )}
                            {selectedUser.id === 'veronica' && (
                              <Badge color="success" className="preference-badge">
                                Health-Conscious
                              </Badge>
                            )}
                            {selectedUser.id === 'alice' && (
                              <Badge color="secondary" className="preference-badge">
                                General Shopper
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="cart-summary">
                        <div className="cart-header">
                          <FaShoppingCart />
                          <span>Current Cart</span>
                        </div>
                        <div className="cart-stats">
                          <div className="stat">
                            <span className="stat-value">{cartItemCount}</span>
                            <span className="stat-label">Items</span>
                          </div>
                          <div className="stat">
                            <span className="stat-value">${cartTotal}</span>
                            <span className="stat-label">Total</span>
                          </div>
                        </div>
                        
                        {currentCart && currentCart.length > 0 && (
                          <div className="cart-items">
                            <h6>Recent Items:</h6>
                            {currentCart.slice(-3).map((item, index) => (
                              <div key={index} className="cart-item">
                                <span className="item-name">{item.name}</span>
                                <span className="item-price">${item.price}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardBody>
                  </Card>

                  {/* Quick Actions */}
                  <Card className="quick-actions-card">
                    <CardBody>
                      <h6>Smart Actions</h6>
                      <div className="quick-actions">
                        <button 
                          className="quick-action-btn"
                          onClick={() => this.refs.chat?.sendMessage('Show me my personalized recommendations')}
                        >
                          AI Recommendations
                        </button>
                        <button 
                          className="quick-action-btn"
                          onClick={() => this.refs.chat?.sendMessage('Predict what I\'ll want to buy today')}
                        >
                          Smart Cart Predictions
                        </button>
                        <button 
                          className="quick-action-btn"
                          onClick={() => this.refs.chat?.sendMessage('Help me build a smart shopping list')}
                        >
                          Smart Shopping List
                        </button>
                        <button 
                          className="quick-action-btn"
                          onClick={() => this.refs.chat?.sendMessage('Add some organic milk to my cart')}
                        >
                          Try Cart Management
                        </button>
                      </div>
                    </CardBody>
                  </Card>
                </Col>

                {/* Chat Interface */}
                <Col lg={8}>
                  <Card className="chat-card">
                    <CardBody className="chat-body">
                      <Chat
                        key={chatKey}
                        ref="chat"
                        chatType="customer"
                        systemPrompt={CUSTOMER_SYSTEM_PROMPT}
                        tools={CUSTOMER_TOOLS}
                        executeToolFunction={this.executeToolFunction}
                        userId={currentUserId}
                        currentCart={currentCart}
                        dataFetchers={dataFetchers}
                      />
                    </CardBody>
                  </Card>
                </Col>
              </Row>

              {/* Help Section */}
              <Row className="mt-4">
                <Col>
                  <Alert color="info" className="help-alert">
                    <h6>🤖 Smart Shopping Assistant Tips:</h6>
                    <ul className="help-tips">
                      <li><strong>Cart Management:</strong> Just say "add [item] to cart" or "remove [item] from cart" and I'll handle it!</li>
                      <li><strong>Smart Predictions:</strong> Ask me to predict what you'll want to buy based on your shopping patterns</li>
                      <li><strong>AI Analysis:</strong> I can understand complex questions and analyze your feedback intelligently</li>
                      <li><strong>Personalized Search:</strong> Be specific about preferences (e.g., "lactose-free milk" or "organic vegetables")</li>
                      <li><strong>Smart Shopping:</strong> I can build intelligent shopping lists and automatically add items to your cart</li>
                    </ul>
                  </Alert>
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}

export default CustomerChatPage;