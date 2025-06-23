import React, { Component } from 'react';
import { Container, Row, Col, Card, CardBody, Badge, Alert } from 'reactstrap';
import { FaChartLine, FaUsers, FaBoxes, FaHeadset, FaCog } from 'react-icons/fa';

import Chat from '../components/Chat';
import { ADMIN_TOOLS, executeAdminTool, ADMIN_SYSTEM_PROMPT } from '../../services/chatTools/adminTools';

import './AdminChatPage.css';

class AdminChatPage extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      chatKey: Date.now(), // Force chat re-render when needed
      stats: {
        totalUsers: 67,
        totalProducts: 42,
        activeOrders: 23,
        revenue: '$34,892'
      }
    };
  }

  executeToolFunction = async (toolName, parameters) => {
    return await executeAdminTool(toolName, parameters);
  };

  resetChat = () => {
    this.setState({ chatKey: Date.now() });
  };

  render() {
    const { state = {} } = this.props; // Provide default empty object
    const { chatKey, stats } = this.state;

    return (
      <div className="admin-chat-page">
        <Container fluid>
          <Row className="justify-content-center">
            <Col lg={10} xl={8}>
              {/* Page Header */}
              <div className="page-header">
                <div className="header-content">
                  <div className="header-icon">
                    <FaChartLine />
                  </div>
                  <div className="header-text">
                    <h2>Admin Assistant</h2>
                    <p>AI-powered insights for business operations and analytics</p>
                  </div>
                </div>
              </div>

              <Row>
                {/* Admin Dashboard Sidebar */}
                <Col lg={4} className="mb-4">
                  {/* Quick Stats */}
                  <Card className="stats-card">
                    <CardBody>
                      <h6>Quick Stats</h6>
                      <div className="stats-grid">
                        <div className="stat-item">
                          <div className="stat-icon users">
                            <FaUsers />
                          </div>
                          <div className="stat-info">
                            <span className="stat-value">{stats.totalUsers}</span>
                            <span className="stat-label">Total Users</span>
                          </div>
                        </div>
                        
                        <div className="stat-item">
                          <div className="stat-icon products">
                            <FaBoxes />
                          </div>
                          <div className="stat-info">
                            <span className="stat-value">{stats.totalProducts}</span>
                            <span className="stat-label">Products</span>
                          </div>
                        </div>
                        
                        <div className="stat-item">
                          <div className="stat-icon orders">
                            <FaCog />
                          </div>
                          <div className="stat-info">
                            <span className="stat-value">{stats.activeOrders}</span>
                            <span className="stat-label">Active Orders</span>
                          </div>
                        </div>
                        
                        <div className="stat-item">
                          <div className="stat-icon revenue">
                            <FaChartLine />
                          </div>
                          <div className="stat-info">
                            <span className="stat-value">{stats.revenue}</span>
                            <span className="stat-label">Monthly Revenue</span>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Quick Actions */}
                  <Card className="admin-actions-card">
                    <CardBody>
                      <h6>Quick Insights</h6>
                      <div className="admin-actions">
                        <button 
                          className="admin-action-btn analytics"
                          onClick={() => this.refs.chat?.sendMessage('Show me user analytics for this week')}
                        >
                          <FaUsers />
                          User Analytics
                        </button>
                        
                        <button 
                          className="admin-action-btn inventory"
                          onClick={() => this.refs.chat?.sendMessage('What is our current inventory status?')}
                        >
                          <FaBoxes />
                          Inventory Status
                        </button>
                        
                        <button 
                          className="admin-action-btn performance"
                          onClick={() => this.refs.chat?.sendMessage('Show me product performance analytics')}
                        >
                          <FaChartLine />
                          Product Performance
                        </button>
                        
                        <button 
                          className="admin-action-btn support"
                          onClick={() => this.refs.chat?.sendMessage('Give me customer support insights')}
                        >
                          <FaHeadset />
                          Support Dashboard
                        </button>
                        
                        <button 
                          className="admin-action-btn reports"
                          onClick={() => this.refs.chat?.sendMessage('Generate a business overview report')}
                        >
                          <FaCog />
                          Business Reports
                        </button>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Admin Info */}
                  <Card className="admin-info-card">
                    <CardBody>
                      <div className="admin-profile">
                        <div className="admin-avatar">
                          <FaCog />
                        </div>
                        <div className="admin-details">
                          <h6>Store Manager</h6>
                          <Badge color="success" className="admin-badge">Admin Access</Badge>
                        </div>
                      </div>
                      
                      <div className="admin-capabilities">
                        <h6>Available Insights:</h6>
                        <ul>
                          <li>User behavior analytics</li>
                          <li>Product performance metrics</li>
                          <li>Inventory management</li>
                          <li>Customer support data</li>
                          <li>Business intelligence reports</li>
                          <li>Sales trends and forecasting</li>
                        </ul>
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
                        chatType="admin"
                        systemPrompt={ADMIN_SYSTEM_PROMPT}
                        tools={ADMIN_TOOLS}
                        executeToolFunction={this.executeToolFunction}
                        userId="admin"
                        currentCart={[]}
                      />
                    </CardBody>
                  </Card>
                </Col>
              </Row>

              {/* Admin Help Section */}
              <Row className="mt-4">
                <Col>
                  <Alert color="info" className="admin-help-alert">
                    <h6>🔧 Admin Assistant Capabilities:</h6>
                    <Row>
                      <Col md={6}>
                        <ul className="admin-help-list">
                          <li><strong>Analytics:</strong> User behavior, sales trends, conversion rates</li>
                          <li><strong>Inventory:</strong> Stock levels, low inventory alerts, overstock items</li>
                          <li><strong>Products:</strong> Performance metrics, category analysis, search with admin details</li>
                        </ul>
                      </Col>
                      <Col md={6}>
                        <ul className="admin-help-list">
                          <li><strong>Support:</strong> Ticket analysis, response times, customer satisfaction</li>
                          <li><strong>Business Intelligence:</strong> Revenue reports, KPIs, operational insights</li>
                          <li><strong>Real-time Data:</strong> Current metrics and alerts for immediate action</li>
                        </ul>
                      </Col>
                    </Row>
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

export default AdminChatPage;