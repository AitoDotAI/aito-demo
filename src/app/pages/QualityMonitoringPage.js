import React, { Component } from 'react'
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  Table,
  Badge,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Spinner,
  Alert
} from 'reactstrap'
import { FaCheckCircle, FaTimesCircle, FaSync, FaCog } from 'react-icons/fa'
import './QualityMonitoringPage.css'

class QualityMonitoringPage extends Component {
  constructor(props) {
    super(props)
    
    this.state = {
      activeTab: 'invoices',
      loading: false,
      error: null,
      
      // Configuration
      testSplit: 90,
      selectedFields: ['Description'],
      predictTarget: 'Processor', // What field to predict
      
      // Results
      metrics: null,
      cases: []
    }
  }
  
  componentDidMount() {
    this.runEvaluation()
  }
  
  // Generate deterministic sample indices for test set
  generateTestIndices = (totalRecords = 100, testPercentage = 0.1, seed = 12345) => {
    // Handle edge cases
    if (testPercentage === 0) {
      return [] // No test data
    }
    if (testPercentage === 1) {
      return Array.from({length: totalRecords}, (_, i) => i) // All data is test
    }
    
    // Use a simple linear congruential generator for deterministic randomness
    const rng = (seed) => {
      let state = seed
      return () => {
        state = (state * 1664525 + 1013904223) % (2 ** 32)
        return state / (2 ** 32)
      }
    }
    
    const random = rng(seed)
    const indices = []
    
    // Generate shuffled indices
    const allIndices = Array.from({length: totalRecords}, (_, i) => i)
    
    // Fisher-Yates shuffle with deterministic random
    for (let i = allIndices.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[allIndices[i], allIndices[j]] = [allIndices[j], allIndices[i]]
    }
    
    // Take first portion as test indices
    const testCount = Math.floor(totalRecords * testPercentage)
    return allIndices.slice(0, testCount)
  }

  buildEvaluateQuery = () => {
    const { testSplit, selectedFields, predictTarget } = this.state
    
    // Build the where clause based on selected fields
    const whereClause = {}
    selectedFields.forEach(field => {
      whereClause[field] = { "$get": field }
    })
    
    // Generate deterministic test indices (assumes ~100 invoice records)
    const testPercentage = (100 - testSplit) / 100
    const testIndices = this.generateTestIndices(100, testPercentage)
    
    console.log(`Generated ${testIndices.length} test indices:`, testIndices.slice(0, 10), '...')
    
    // Convert indices array to $or query for Aito
    // Handle edge case where no test indices (train = 100%)
    const testQuery = testIndices.length === 0 
      ? { "$index": -1 } // Impossible index, so no test data
      : { "$or": testIndices.map(idx => ({ "$index": idx })) }
    
    return {
      test: testQuery,
      evaluate: {
        from: "invoices",
        where: whereClause,
        predict: predictTarget
      },
      select: [
        "accuracy",
        "meanRank", 
        "meanMs",
        "trainSamples",
        "testSamples",
        "cases"
      ]
    }
  }
  
  runEvaluation = async () => {
    this.setState({ loading: true, error: null })
    
    try {
      const query = this.buildEvaluateQuery()
      console.log('Running evaluation with query:', query)
      
      const response = await this.props.dataFetchers.evaluateModel(query)
      
      // Extract metrics and cases
      const { cases, ...metrics } = response
      
      this.setState({
        metrics,
        cases: cases || [],
        loading: false
      })
    } catch (error) {
      console.error('Evaluation error:', error)
      this.setState({
        error: error.message || 'Failed to run evaluation',
        loading: false
      })
    }
  }
  
  handleTestSplitChange = (e) => {
    this.setState({ testSplit: parseInt(e.target.value) })
  }
  
  handlePredictTargetChange = (e) => {
    this.setState({ predictTarget: e.target.value })
  }
  
  handleFieldToggle = (field) => {
    const { selectedFields } = this.state
    if (selectedFields.includes(field)) {
      this.setState({
        selectedFields: selectedFields.filter(f => f !== field)
      })
    } else {
      this.setState({
        selectedFields: [...selectedFields, field]
      })
    }
  }
  
  formatConfidence = (confidence) => {
    const percentage = (confidence * 100).toFixed(1)
    let color = 'success'
    if (confidence < 0.7) color = 'danger'
    else if (confidence < 0.85) color = 'warning'
    
    return <Badge color={color}>{percentage}%</Badge>
  }
  
  formatPredictedValue = (prediction) => {
    if (!prediction) return '-'
    return prediction.Name || prediction.feature || '-'
  }
  
  renderMetricsCard = () => {
    const { metrics, loading } = this.state

    if (loading || !metrics) {
      return (
        <Card className="metrics-card">
          <CardBody className="text-center">
            <Spinner color="primary" />
          </CardBody>
        </Card>
      )
    }

    return (
      <Card className="metrics-card">
        <CardHeader>
          <h5>Model Performance Metrics</h5>
        </CardHeader>
        <CardBody className="metrics-card-body">
          <Row>
            <Col md={3} className="metric-item">
              <div className="metric-value">{(metrics.accuracy * 100).toFixed(2)}%</div>
              <div className="metric-label">Accuracy</div>
            </Col>
            <Col md={3} className="metric-item">
              <div className="metric-value">{metrics.meanRank?.toFixed(2) || 'N/A'}</div>
              <div className="metric-label">Mean Rank</div>
            </Col>
            <Col md={3} className="metric-item">
              <div className="metric-value">{metrics.meanMs?.toFixed(0) || 'N/A'}ms</div>
              <div className="metric-label">Avg Response Time</div>
            </Col>
            <Col md={3} className="metric-item">
              <div className="metric-value">{metrics.testSamples || 0}</div>
              <div className="metric-label">Test Samples</div>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col md={6} className="metric-item">
              <div className="metric-value">{metrics.trainSamples || 0}</div>
              <div className="metric-label">Training Samples</div>
            </Col>
            <Col md={6} className="metric-item">
              <div className="metric-value">
                {metrics.testSamples > 0
                  ? `${((metrics.accuracy * metrics.testSamples).toFixed(0))} / ${metrics.testSamples}`
                  : 'N/A'
                }
              </div>
              <div className="metric-label">Correct Predictions</div>
            </Col>
          </Row>
        </CardBody>
      </Card>
    )
  }
  
  renderConfigurationPanel = () => {
    const { testSplit, selectedFields, predictTarget } = this.state
    const availableFields = ['Description', 'SenderName', 'ProductName', 'AccountNumber', 'InvoiceID']
    const predictTargets = [
      { value: 'Processor', label: 'Invoice Processor' },
      { value: 'Acceptor', label: 'Invoice Approver' }, 
      { value: 'GLCode', label: 'GL Code' }
    ]
    
    return (
      <Card className="config-card">
        <CardHeader>
          <h5><FaCog className="me-2" />Evaluation Configuration</h5>
        </CardHeader>
        <CardBody>
          <Form>
            <FormGroup>
              <Label>Prediction Target</Label>
              <Input
                type="select"
                value={predictTarget}
                onChange={this.handlePredictTargetChange}
              >
                {predictTargets.map(target => (
                  <option key={target.value} value={target.value}>
                    {target.label}
                  </option>
                ))}
              </Input>
              <br />
              <small className="text-muted">
                Choose what field to predict and evaluate
              </small>
            </FormGroup>
            
            <FormGroup>
              <Label>Data Split Configuration</Label>
              <div className="d-flex align-items-center">
                <span className="text-muted me-2" style={{ minWidth: '35px', fontSize: '0.875rem' }}>
                  {testSplit}%
                </span>
                <Input
                  type="range"
                  min="0"
                  max="100"
                  value={testSplit}
                  onChange={this.handleTestSplitChange}
                  className="flex-grow-1"
                />
                <span className="text-muted ms-2" style={{ minWidth: '35px', fontSize: '0.875rem', textAlign: 'right' }}>
                  {100 - testSplit}%
                </span>
              </div>
              <small className="text-muted">
                {testSplit === 0 
                  ? "Zero-shot evaluation (no training data)" 
                  : testSplit === 100 
                    ? "Training set only (no test data)"
                    : `Train: ${testSplit}% (random) | Test: ${100 - testSplit}% (random)`
                }
              </small>
            </FormGroup>
            
            <FormGroup>
              <Label>Input Fields</Label>
              <div className="field-checkboxes">
                {availableFields.map(field => (
                  <div key={field} className="form-check">
                    <Input
                      type="checkbox"
                      id={`field-${field}`}
                      checked={selectedFields.includes(field)}
                      onChange={() => this.handleFieldToggle(field)}
                      disabled={selectedFields.length === 1 && selectedFields.includes(field)}
                    />
                    <Label check for={`field-${field}`}>
                      {field}
                    </Label>
                  </div>
                ))}
              </div>
            </FormGroup>
            
            <Button 
              color="primary" 
              onClick={this.runEvaluation}
              disabled={this.state.loading || selectedFields.length === 0}
              block
            >
              <FaSync className="me-2" />
              Run Evaluation
            </Button>
          </Form>
        </CardBody>
      </Card>
    )
  }
  
  getTargetDisplayName = () => {
    const { predictTarget } = this.state
    switch (predictTarget) {
      case 'Processor': return 'Processor'
      case 'Acceptor': return 'Approver' 
      case 'GLCode': return 'GL Code'
      default: return predictTarget
    }
  }
  
  renderCasesTable = () => {
    const { cases, loading } = this.state
    
    if (loading) {
      return (
        <div className="text-center p-5">
          <Spinner color="primary" />
        </div>
      )
    }
    
    if (!cases || cases.length === 0) {
      return (
        <Alert color="info">
          No evaluation cases available. Click "Run Evaluation" to generate results.
        </Alert>
      )
    }
    
    const targetDisplayName = this.getTargetDisplayName()
    
    return (
      <div className="cases-table-container">
        <Table responsive striped hover className="cases-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>Status</th>
              <th>Invoice ID</th>
              <th>Sender</th>
              <th>Product</th>
              <th>Account</th>
              <th>Description</th>
              <th>Predicted {targetDisplayName}</th>
              <th>Confidence</th>
              <th>Actual {targetDisplayName}</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((caseItem, index) => {
              const isCorrect = caseItem.accurate
              const testCase = caseItem.testCase
              const prediction = caseItem.top
              const correct = caseItem.correct
              
              return (
                <tr key={index} className={isCorrect ? 'correct-row' : 'error-row'}>
                  <td className="text-center">
                    {isCorrect ? (
                      <FaCheckCircle className="text-success" />
                    ) : (
                      <FaTimesCircle className="text-danger" />
                    )}
                  </td>
                  <td className="font-monospace small">{testCase.InvoiceID}</td>
                  <td className="text-truncate" style={{ maxWidth: '150px' }}>
                    {testCase.SenderName}
                  </td>
                  <td className="text-truncate" style={{ maxWidth: '150px' }}>
                    {testCase.ProductName}
                  </td>
                  <td className="font-monospace small">
                    {testCase.AccountNumber?.slice(-8) || '-'}
                  </td>
                  <td className="text-truncate" style={{ maxWidth: '200px' }}>
                    {testCase.Description}
                  </td>
                  <td className={!isCorrect ? 'text-danger font-weight-bold' : ''}>
                    {this.formatPredictedValue(prediction)}
                  </td>
                  <td>
                    {this.formatConfidence(prediction?.$p || 0)}
                  </td>
                  <td className={!isCorrect ? 'text-success font-weight-bold' : ''}>
                    {this.formatPredictedValue(correct)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      </div>
    )
  }
  
  render() {
    const { activeTab, error } = this.state
    
    return (
      <div className="QualityMonitoringPage">
        <Container fluid>
          <div className="page-header">
            <h1>Evaluation</h1>
            <p className="text-muted">
              Evaluate model performance with real-time accuracy metrics and case analysis
            </p>
          </div>
          
          <Nav tabs className="mb-4">
            <NavItem>
              <NavLink
                className={activeTab === 'invoices' ? 'active' : ''}
                onClick={() => this.setState({ activeTab: 'invoices' })}
              >
                Invoice Processing
              </NavLink>
            </NavItem>
            {/* Future tabs can be added here */}
          </Nav>
          
          <TabContent activeTab={activeTab}>
            <TabPane tabId="invoices">
              {error && (
                <Alert color="danger" className="mb-3">
                  {error}
                </Alert>
              )}
              
              <Row>
                <Col lg={3}>
                  {this.renderConfigurationPanel()}
                </Col>
                <Col lg={9}>
                  {this.renderMetricsCard()}
                  
                  <Card className="mt-3 cases-card">
                    <CardHeader>
                      <h5>Evaluation Cases</h5>
                    </CardHeader>
                    <CardBody className="p-0">
                      {this.renderCasesTable()}
                    </CardBody>
                  </Card>
                </Col>
              </Row>
            </TabPane>
          </TabContent>
        </Container>
      </div>
    )
  }
}

export default QualityMonitoringPage