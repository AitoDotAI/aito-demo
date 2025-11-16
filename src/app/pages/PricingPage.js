import React, { Component } from 'react'
import _ from 'lodash'
import {
  Label,
  Input,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap'
import { ScatterChart, Scatter, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { FaToggleOn, FaToggleOff, FaSync, FaCheckCircle } from 'react-icons/fa'
import HelpButton from '../components/HelpButton'
import { HELP_CONTENT } from '../constants/helpContent'

import './PricingPage.css'

// Field configuration with labels and types
const FIELD_CONFIG = {
  // Product fields
  product_id: { label: 'Product', group: 'Product', type: 'string', priority: 1 },
  category: { label: 'Category', group: 'Product', type: 'string', priority: 2 },
  category_name: { label: 'Category Name', group: 'Product', type: 'string', priority: 3 },
  brand: { label: 'Brand', group: 'Product', type: 'string', priority: 4 },

  // Temporal fields
  day_of_week: { label: 'Day of Week', group: 'Temporal', type: 'string', priority: 5 },
  is_weekend: { label: 'Weekend', group: 'Temporal', type: 'boolean', priority: 6 },
  is_holiday_week: { label: 'Holiday Week', group: 'Temporal', type: 'boolean', priority: 7 },

  // Competitive & placement
  competitor_avg_price: { label: 'Competitor Price', group: 'Competitive', type: 'number', priority: 8 },
  promotional_placement: { label: 'Placement', group: 'Competitive', type: 'string', priority: 9 },

  // Contextual
  weather_temp: { label: 'Temperature (°C)', group: 'Contextual', type: 'number', priority: 10 },
  days_until_expiry: { label: 'Days to Expiry', group: 'Contextual', type: 'number', priority: 11 },
}

// Default active fields (5 most important)
const DEFAULT_ACTIVE_FIELDS = ['product_id', 'category', 'day_of_week', 'is_weekend', 'competitor_avg_price']

class PricingPage extends Component {
  constructor(props) {
    super(props)

    // Initialize state
    const activeFields = {}
    const fieldValues = {}
    const fieldOptions = {}
    const dropdownOpen = {}

    Object.keys(FIELD_CONFIG).forEach(field => {
      activeFields[field] = DEFAULT_ACTIVE_FIELDS.includes(field)
      fieldValues[field] = null
      fieldOptions[field] = []
      dropdownOpen[field] = false
    })

    this.state = {
      // Field selection
      activeFields,
      fieldValues,
      fieldOptions,
      dropdownOpen,

      // Estimation mode
      estimationMode: 'both', // 'both' | 'set_price' | 'set_demand'
      manualPrice: null,
      manualDemand: null,

      // Results
      estimatedPrice: null,
      estimatedDemand: null,
      purchaseCost: 0.10, // Default, updated from product data

      // Neighbors
      priceEstimation: null,
      demandEstimation: null,
      neighbors: [],

      // UI state
      selectedNeighborIndex: null,
      loading: false,
      productStats: null,
      priceHistory: [],
      showAdjustedValues: false, // Toggle between original and adjusted values

      // Price-demand curve points
      curvePoints: [], // Additional points to show the price-demand relationship
    }

    // Debounce estimation calls
    this.debouncedEstimate = _.debounce(this.performEstimation, 500).bind(this)
  }

  componentDidMount() {
    // Load initial field options
    this.loadFieldOptions()
  }

  /**
   * Load dropdown options for all fields
   */
  loadFieldOptions = async () => {
    const { dataFetchers } = this.props

    try {
      // Load products first
      const products = await dataFetchers.getPriceProducts()
      this.setState(prevState => ({
        fieldOptions: {
          ...prevState.fieldOptions,
          product_id: products
        }
      }))

      // Load options for other fields
      const fieldsToLoad = ['category', 'category_name', 'brand', 'day_of_week', 'promotional_placement']

      for (const field of fieldsToLoad) {
        const values = await dataFetchers.getPriceFieldValues(field)
        this.setState(prevState => ({
          fieldOptions: {
            ...prevState.fieldOptions,
            [field]: values
          }
        }))
      }

      // For boolean fields, set predefined options
      this.setState(prevState => ({
        fieldOptions: {
          ...prevState.fieldOptions,
          is_weekend: [{ $value: true, $f: 50 }, { $value: false, $f: 50 }],
          is_holiday_week: [{ $value: true, $f: 10 }, { $value: false, $f: 90 }]
        }
      }))

    } catch (err) {
      console.error('Error loading field options:', err)
      this.props.actions.showError(err)
    }
  }

  /**
   * Toggle a field on/off
   */
  toggleField = (fieldName) => {
    this.setState(prevState => ({
      activeFields: {
        ...prevState.activeFields,
        [fieldName]: !prevState.activeFields[fieldName]
      }
    }), () => {
      // Re-estimate if field was deactivated
      if (!this.state.activeFields[fieldName]) {
        this.debouncedEstimate()
      }
    })
  }

  /**
   * Set value for a field
   */
  setFieldValue = (fieldName, value) => {
    this.setState(prevState => ({
      fieldValues: {
        ...prevState.fieldValues,
        [fieldName]: value
      },
      dropdownOpen: {
        ...prevState.dropdownOpen,
        [fieldName]: false
      }
    }), () => {
      // Special handling for product selection
      if (fieldName === 'product_id' && value) {
        this.loadProductContext(value)
      }

      // Trigger estimation
      this.debouncedEstimate()
    })
  }

  /**
   * Load product context and populate related fields
   */
  loadProductContext = async (productId) => {
    const { dataFetchers } = this.props

    try {
      const context = await dataFetchers.getProductPriceContext(productId)
      const stats = await dataFetchers.getPriceStats(productId)
      const history = await dataFetchers.getPriceHistory(productId, 100)

      if (context) {
        // Update purchase cost
        this.setState({
          purchaseCost: context.purchase_cost || 0.10,
          productStats: stats,
          priceHistory: history
        })
      }
    } catch (err) {
      console.error('Error loading product context:', err)
    }
  }

  /**
   * Populate all active fields from current product
   */
  populateFromProduct = async () => {
    const productId = this.state.fieldValues.product_id
    if (!productId) {
      alert('Please select a product first')
      return
    }

    const { dataFetchers } = this.props

    try {
      const context = await dataFetchers.getProductPriceContext(productId)

      if (context) {
        const newFieldValues = { ...this.state.fieldValues }

        // Populate fields from context
        Object.keys(FIELD_CONFIG).forEach(field => {
          if (this.state.activeFields[field] && context[field] !== undefined) {
            newFieldValues[field] = context[field]
          }
        })

        this.setState({ fieldValues: newFieldValues }, () => {
          this.debouncedEstimate()
        })
      }
    } catch (err) {
      console.error('Error populating from product:', err)
      this.props.actions.showError(err)
    }
  }

  /**
   * Reset all field values
   */
  resetFields = () => {
    const fieldValues = {}
    Object.keys(FIELD_CONFIG).forEach(field => {
      fieldValues[field] = null
    })

    this.setState({
      fieldValues,
      estimatedPrice: null,
      estimatedDemand: null,
      manualPrice: null,
      manualDemand: null,
      estimationMode: 'both',
      neighbors: [],
      priceEstimation: null,
      demandEstimation: null
    })
  }

  /**
   * Build where conditions from active fields
   */
  buildWhereConditions = () => {
    const where = {}

    Object.keys(this.state.activeFields).forEach(field => {
      if (this.state.activeFields[field] && this.state.fieldValues[field] !== null) {
        where[field] = this.state.fieldValues[field]
      }
    })

    return where
  }

  /**
   * Estimate demand at different price points to show price-demand curve
   */
  estimateCurvePoints = async (basePrice, where) => {
    const { dataFetchers } = this.props
    const priceAdjustments = [-0.15, -0.10, -0.05, 0.05, 0.10, 0.15]

    try {
      // Estimate demand at each price point (without $why for performance)
      const promises = priceAdjustments.map(async (adjustment) => {
        const adjustedPrice = basePrice * (1 + adjustment)
        const demandWhere = { ...where, sale_price: adjustedPrice }

        try {
          const result = await dataFetchers.estimateDemand(demandWhere)
          return {
            price: adjustedPrice,
            demand: result.estimate,
            adjustment: adjustment
          }
        } catch (err) {
          console.warn(`Failed to estimate at ${adjustment * 100}% price adjustment:`, err)
          return null
        }
      })

      const results = await Promise.all(promises)
      return results.filter(r => r !== null)
    } catch (err) {
      console.error('Error estimating curve points:', err)
      return []
    }
  }

  /**
   * Main estimation logic
   */
  performEstimation = async () => {
    const { dataFetchers } = this.props
    const { estimationMode, manualPrice, manualDemand } = this.state

    const where = this.buildWhereConditions()

    // Need at least product selected
    if (!where.product_id) {
      return
    }

    this.setState({ loading: true })

    try {
      if (estimationMode === 'both') {
        // Estimate both price and demand
        const priceResult = await dataFetchers.estimatePrice(where)
        const demandWhere = { ...where, sale_price: priceResult.estimate }
        const demandResult = await dataFetchers.estimateDemand(demandWhere)

        // Estimate curve points around the estimated price
        const curvePoints = await this.estimateCurvePoints(priceResult.estimate, where)

        this.setState({
          estimatedPrice: priceResult.estimate,
          estimatedDemand: demandResult.estimate,
          priceEstimation: priceResult,
          demandEstimation: demandResult,
          neighbors: this.extractNeighbors(priceResult, demandResult),
          curvePoints,
          loading: false
        })

      } else if (estimationMode === 'set_price') {
        // User set price manually, estimate demand
        const demandWhere = { ...where, sale_price: manualPrice }
        const demandResult = await dataFetchers.estimateDemand(demandWhere)

        // Estimate curve points around the manual price
        const curvePoints = await this.estimateCurvePoints(manualPrice, where)

        this.setState({
          estimatedPrice: manualPrice,
          estimatedDemand: demandResult.estimate,
          demandEstimation: demandResult,
          neighbors: this.extractNeighbors(null, demandResult),
          curvePoints,
          loading: false
        })

      } else if (estimationMode === 'set_demand') {
        // User set demand manually, estimate price
        const priceWhere = { ...where, units_sold: manualDemand }
        const priceResult = await dataFetchers.estimatePrice(priceWhere)

        // Estimate curve points around the estimated price
        const curvePoints = await this.estimateCurvePoints(priceResult.estimate, where)

        this.setState({
          estimatedPrice: priceResult.estimate,
          estimatedDemand: manualDemand,
          priceEstimation: priceResult,
          neighbors: this.extractNeighbors(priceResult, null),
          curvePoints,
          loading: false
        })
      }

    } catch (err) {
      console.error('Estimation error:', err)
      this.setState({ loading: false })
      this.props.actions.showError(err)
    }
  }

  /**
   * Extract and combine neighbors from estimation results
   */
  extractNeighbors = (priceResult, demandResult) => {
    const neighbors = []

    // Use whichever result has $why data
    const result = priceResult || demandResult

    if (result && result.$why && result.$why.components) {
      result.$why.components.forEach((component, index) => {
        if (component.value && component.value.instance) {
          neighbors.push({
            index,
            hitScore: component.value.hitScore || 0,
            adjustedValue: component.value.value,
            originalValue: component.value.original,
            instance: component.value.instance,
            adjustments: component.value.adjustments,
            weight: component.weight || 1.0
          })
        }
      })
    }

    // Sort by hit score (highest first)
    return neighbors.sort((a, b) => b.hitScore - a.hitScore)
  }

  /**
   * Set manual price (clears manual demand)
   */
  setManualPrice = (price) => {
    this.setState({
      manualPrice: parseFloat(price),
      manualDemand: null,
      estimationMode: 'set_price'
    }, () => {
      this.debouncedEstimate()
    })
  }

  /**
   * Set manual demand (clears manual price)
   */
  setManualDemand = (demand) => {
    this.setState({
      manualDemand: parseInt(demand),
      manualPrice: null,
      estimationMode: 'set_demand'
    }, () => {
      this.debouncedEstimate()
    })
  }

  /**
   * Switch to both estimation mode
   */
  switchToBothMode = () => {
    this.setState({
      estimationMode: 'both',
      manualPrice: null,
      manualDemand: null
    }, () => {
      this.debouncedEstimate()
    })
  }

  /**
   * Toggle dropdown for a field
   */
  toggleDropdown = (fieldName) => {
    this.setState(prevState => ({
      dropdownOpen: {
        ...prevState.dropdownOpen,
        [fieldName]: !prevState.dropdownOpen[fieldName]
      }
    }))
  }

  /**
   * Select a neighbor to view or use as target
   */
  selectNeighbor = (index) => {
    this.setState({ selectedNeighborIndex: index })
  }

  /**
   * Calculate total profit
   */
  calculateProfit = () => {
    const { estimatedPrice, estimatedDemand, purchaseCost } = this.state

    if (!estimatedPrice || !estimatedDemand) return 0

    const margin = estimatedPrice - purchaseCost
    return margin * estimatedDemand
  }

  /**
   * Render a field control (toggle + dropdown)
   */
  renderFieldControl = (fieldName) => {
    const config = FIELD_CONFIG[fieldName]
    const isActive = this.state.activeFields[fieldName]
    const value = this.state.fieldValues[fieldName]
    const options = this.state.fieldOptions[fieldName] || []
    const isOpen = this.state.dropdownOpen[fieldName]

    return (
      <div key={fieldName} className={`PricingPage__field ${isActive ? 'PricingPage__field--active' : ''}`}>
        <div className="PricingPage__field-header">
          <button
            className="PricingPage__toggle"
            onClick={() => this.toggleField(fieldName)}
            title={isActive ? 'Disable field' : 'Enable field'}
          >
            {isActive ? (
              <FaToggleOn className="PricingPage__toggle-icon PricingPage__toggle-icon--on" />
            ) : (
              <FaToggleOff className="PricingPage__toggle-icon" />
            )}
          </button>
          <Label className="PricingPage__field-label">{config.label}</Label>
        </div>

        {isActive && (
          <div className="PricingPage__field-control">
            {config.type === 'boolean' ? (
              <Dropdown isOpen={isOpen} toggle={() => this.toggleDropdown(fieldName)}>
                <DropdownToggle caret className="PricingPage__dropdown-toggle">
                  {value !== null ? (value ? 'Yes' : 'No') : 'Select...'}
                </DropdownToggle>
                <DropdownMenu>
                  <DropdownItem onClick={() => this.setFieldValue(fieldName, true)}>
                    Yes
                  </DropdownItem>
                  <DropdownItem onClick={() => this.setFieldValue(fieldName, false)}>
                    No
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            ) : config.type === 'number' ? (
              <Input
                type="number"
                step="0.01"
                value={value || ''}
                onChange={(e) => this.setFieldValue(fieldName, parseFloat(e.target.value))}
                placeholder={`Enter ${config.label.toLowerCase()}`}
                className="PricingPage__number-input"
              />
            ) : (
              <Dropdown isOpen={isOpen} toggle={() => this.toggleDropdown(fieldName)}>
                <DropdownToggle caret className="PricingPage__dropdown-toggle">
                  {value || 'Select...'}
                </DropdownToggle>
                <DropdownMenu className="PricingPage__dropdown-menu">
                  {options.map((option, idx) => (
                    <DropdownItem
                      key={idx}
                      onClick={() => this.setFieldValue(fieldName, option.$value)}
                    >
                      {option.$value}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            )}
          </div>
        )}
      </div>
    )
  }

  /**
   * Render fields grouped by category
   */
  renderFieldGroups = () => {
    const groups = {}

    Object.keys(FIELD_CONFIG).forEach(field => {
      const group = FIELD_CONFIG[field].group
      if (!groups[group]) groups[group] = []
      groups[group].push(field)
    })

    return Object.keys(groups).map(groupName => (
      <div key={groupName} className="PricingPage__field-group">
        <h3 className="PricingPage__field-group-title">{groupName}</h3>
        {groups[groupName].map(field => this.renderFieldControl(field))}
      </div>
    ))
  }

  /**
   * Custom tooltip for scatter plot
   */
  renderCustomTooltip = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null

    const data = payload[0].payload
    const { showAdjustedValues } = this.state

    // Use the price and demand fields directly (they're already adjusted based on toggle)
    const displayPrice = data.price
    const displayDemand = data.demand
    const hasAdjustments = data.adjustedPrice !== undefined || data.adjustedDemand !== undefined

    return (
      <div className="PricingPage__chart-tooltip">
        <div className="PricingPage__chart-tooltip-header">
          <strong>{data.name}</strong>
          {data.type === 'neighbor' && data.hitScore && (
            <span className="PricingPage__chart-tooltip-badge">
              Score: {data.hitScore.toFixed(2)}
            </span>
          )}
        </div>

        {data.date && (
          <div className="PricingPage__chart-tooltip-date">
            {data.dayOfWeek}, {data.date}
            {data.isWeekend && <span className="PricingPage__chart-tooltip-tag">Weekend</span>}
          </div>
        )}

        {hasAdjustments && showAdjustedValues && (
          <div className="PricingPage__chart-tooltip-info" style={{ marginBottom: '0.5rem', fontStyle: 'italic', fontSize: '0.75rem', color: '#FF6B35' }}>
            Showing adjusted values
          </div>
        )}

        <div className="PricingPage__chart-tooltip-metrics">
          <div className="PricingPage__chart-tooltip-metric">
            <span className="PricingPage__chart-tooltip-label">Price:</span>
            <span className="PricingPage__chart-tooltip-value">
              €{displayPrice?.toFixed(3)}
              {hasAdjustments && showAdjustedValues && data.adjustedPrice !== undefined && (
                <span style={{ fontSize: '0.7rem', color: '#888', marginLeft: '0.25rem' }}>
                  (was €{data.originalPrice?.toFixed(3)})
                </span>
              )}
            </span>
          </div>
          <div className="PricingPage__chart-tooltip-metric">
            <span className="PricingPage__chart-tooltip-label">Demand:</span>
            <span className="PricingPage__chart-tooltip-value">
              {Math.round(displayDemand)} units
              {hasAdjustments && showAdjustedValues && data.adjustedDemand !== undefined && (
                <span style={{ fontSize: '0.7rem', color: '#888', marginLeft: '0.25rem' }}>
                  (was {Math.round(data.originalDemand)})
                </span>
              )}
            </span>
          </div>
          {data.margin !== undefined && (
            <div className="PricingPage__chart-tooltip-metric">
              <span className="PricingPage__chart-tooltip-label">Margin:</span>
              <span className="PricingPage__chart-tooltip-value">{data.margin.toFixed(1)}%</span>
            </div>
          )}
        </div>

        {hasAdjustments && !showAdjustedValues && (
          <div className="PricingPage__chart-tooltip-info" style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#888' }}>
            Click "Adjusted" to see what-if values
          </div>
        )}

        {(data.placement || data.competitorPrice) && (
          <div className="PricingPage__chart-tooltip-context">
            {data.placement && data.placement !== 'normal' && (
              <div className="PricingPage__chart-tooltip-tag">{data.placement}</div>
            )}
            {data.competitorPrice && (
              <div className="PricingPage__chart-tooltip-info">
                Competitor: €{data.competitorPrice.toFixed(3)}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  /**
   * Render scatter plot
   */
  renderScatterPlot = () => {
    const { priceHistory, estimatedPrice, estimatedDemand, neighbors, purchaseCost, estimationMode, showAdjustedValues, curvePoints } = this.state

    // Prepare data points
    const historicalPoints = priceHistory.map(point => ({
      price: point.sale_price,
      demand: point.units_sold,
      type: 'historical',
      name: point.name || 'Historical Data',
      date: point.date,
      dayOfWeek: point.day_of_week,
      isWeekend: point.is_weekend,
      placement: point.promotional_placement,
      margin: point.margin_percentage
    }))

    // Prepare curve points (sorted by price for proper line connection)
    const curveData = [...curvePoints]
      .sort((a, b) => a.price - b.price)
      .map(point => ({
        price: point.price,
        demand: point.demand,
        type: 'curve',
        name: `Price: €${point.price.toFixed(3)} (${point.adjustment > 0 ? '+' : ''}${(point.adjustment * 100).toFixed(0)}%)`
      }))

    // Prepare neighbor points with correct adjusted values based on what was estimated
    const neighborPoints = neighbors.slice(0, 20).map(neighbor => {
      // Determine display values based on toggle
      let displayPrice = neighbor.instance.sale_price
      let displayDemand = neighbor.instance.units_sold

      if (showAdjustedValues && neighbor.adjustedValue !== undefined) {
        // If we estimated price (set_demand or both modes), use adjusted price
        if (estimationMode === 'set_demand' || estimationMode === 'both') {
          displayPrice = neighbor.adjustedValue
        }
        // If we estimated demand (set_price mode), use adjusted demand
        if (estimationMode === 'set_price') {
          displayDemand = neighbor.adjustedValue
        }
      }

      const point = {
        price: displayPrice,  // Display price (original or adjusted)
        demand: displayDemand, // Display demand (original or adjusted)
        originalPrice: neighbor.instance.sale_price,
        originalDemand: neighbor.instance.units_sold,
        type: 'neighbor',
        hitScore: neighbor.hitScore,
        name: neighbor.instance.name || neighbor.instance.product_id,
        date: neighbor.instance.date,
        dayOfWeek: neighbor.instance.day_of_week,
        isWeekend: neighbor.instance.is_weekend,
        placement: neighbor.instance.promotional_placement,
        margin: neighbor.instance.margin_percentage,
        competitorPrice: neighbor.instance.competitor_avg_price
      }

      // Also store adjusted values for tooltip display
      if (estimationMode === 'set_demand' || estimationMode === 'both') {
        point.adjustedPrice = neighbor.adjustedValue
      }
      if (estimationMode === 'set_price') {
        point.adjustedDemand = neighbor.adjustedValue
      }

      return point
    })

    // Current estimate point
    const currentPoint = estimatedPrice && estimatedDemand ? [{
      price: estimatedPrice,
      demand: estimatedDemand,
      type: 'current',
      name: 'Current Estimate',
      margin: estimatedPrice ? ((estimatedPrice - purchaseCost) / estimatedPrice * 100) : 0
    }] : []

    return (
      <ResponsiveContainer width="100%" height={450}>
        <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            type="number"
            dataKey="price"
            name="Price"
            unit="€"
            domain={['auto', 'auto']}
            label={{
              value: 'Sale Price (€)',
              position: 'insideBottom',
              offset: -15,
              style: { fontSize: '14px', fontWeight: 600, fill: '#2c3e50' }
            }}
            tick={{ fontSize: 12, fill: '#6c757d' }}
            stroke="#6c757d"
          />
          <YAxis
            type="number"
            dataKey="demand"
            name="Demand"
            unit=" units"
            label={{
              value: 'Units Sold',
              angle: -90,
              position: 'insideLeft',
              offset: -45,
              style: { fontSize: '14px', fontWeight: 600, fill: '#2c3e50' }
            }}
            tick={{ fontSize: 12, fill: '#6c757d' }}
            stroke="#6c757d"
          />
          <Tooltip
            content={this.renderCustomTooltip}
            cursor={{ strokeDasharray: '3 3' }}
          />
          <Legend
            verticalAlign="top"
            height={50}
            iconType="circle"
            wrapperStyle={{
              paddingTop: '10px',
              fontSize: '13px',
              fontWeight: 500
            }}
          />

          {/* Historical data (light blue, small) */}
          <Scatter
            name="Historical Data"
            data={historicalPoints}
            fill="#8dd1e1"
            opacity={0.3}
          />

          {/* Neighbors (blue, medium) */}
          <Scatter
            name="Similar Cases"
            data={neighborPoints}
            fill="#4A90E2"
            opacity={0.6}
          />

          {/* Price-Demand Curve (transparent orange line with points) */}
          {curveData.length > 0 && (
            <>
              <Line
                name="Price-Demand Curve"
                data={curveData}
                type="monotone"
                dataKey="demand"
                stroke="#FF6B35"
                strokeWidth={2}
                dot={{ fill: '#FF6B35', fillOpacity: 0.4, r: 4 }}
                opacity={0.6}
                connectNulls={true}
              />
            </>
          )}

          {/* Current estimate (orange, large) */}
          <Scatter
            name="Current Estimate"
            data={currentPoint}
            fill="#FF6B35"
            shape="star"
          />
        </ScatterChart>
      </ResponsiveContainer>
    )
  }

  /**
   * Render KPI section
   */
  renderKPIs = () => {
    const { estimatedPrice, estimatedDemand, purchaseCost, estimationMode, manualPrice, manualDemand, loading } = this.state
    const profit = this.calculateProfit()
    const margin = estimatedPrice ? ((estimatedPrice - purchaseCost) / estimatedPrice * 100) : 0

    return (
      <>
        <div className="PricingPage__kpis">
          {/* Price KPI */}
          <div className="PricingPage__kpi">
            <div className="PricingPage__kpi-header">
              <h4 className="PricingPage__kpi-label">Price</h4>
              {estimationMode !== 'set_price' && (
                <button
                  className="PricingPage__kpi-mode-btn"
                  onClick={() => this.setState({ estimationMode: 'set_price', manualPrice: estimatedPrice || 0.5 })}
                  title="Set price manually"
                >
                  Set Manual
                </button>
              )}
            </div>

            {estimationMode === 'set_price' ? (
              <Input
                type="number"
                step="0.01"
                value={manualPrice || ''}
                onChange={(e) => this.setManualPrice(e.target.value)}
                className="PricingPage__kpi-input"
              />
            ) : (
              <div className="PricingPage__kpi-value">
                {loading ? '...' : estimatedPrice ? `€${estimatedPrice.toFixed(3)}` : '—'}
              </div>
            )}

            <div className="PricingPage__kpi-meta">
              Margin: {margin.toFixed(1)}%
            </div>
          </div>

          {/* Demand KPI */}
          <div className="PricingPage__kpi">
            <div className="PricingPage__kpi-header">
              <h4 className="PricingPage__kpi-label">Demand</h4>
              {estimationMode !== 'set_demand' && (
                <button
                  className="PricingPage__kpi-mode-btn"
                  onClick={() => this.setState({ estimationMode: 'set_demand', manualDemand: Math.round(estimatedDemand) || 100 })}
                  title="Set demand manually"
                >
                  Set Manual
                </button>
              )}
            </div>

            {estimationMode === 'set_demand' ? (
              <Input
                type="number"
                step="1"
                value={manualDemand || ''}
                onChange={(e) => this.setManualDemand(e.target.value)}
                className="PricingPage__kpi-input"
              />
            ) : (
              <div className="PricingPage__kpi-value">
                {loading ? '...' : estimatedDemand ? `${Math.round(estimatedDemand)} units` : '—'}
              </div>
            )}

            <div className="PricingPage__kpi-meta">
              Volume per day
            </div>
          </div>

          {/* Profit KPI */}
          <div className="PricingPage__kpi PricingPage__kpi--highlight">
            <h4 className="PricingPage__kpi-label">Total Profit</h4>
            <div className="PricingPage__kpi-value PricingPage__kpi-value--large">
              {loading ? '...' : profit > 0 ? `€${profit.toFixed(2)}` : '—'}
            </div>
            <div className="PricingPage__kpi-meta">
              Per day revenue
            </div>
          </div>
        </div>

        {/* Mode switcher */}
        {estimationMode !== 'both' && (
          <div className="PricingPage__mode-reset">
            <button
              className="PricingPage__reset-btn"
              onClick={this.switchToBothMode}
            >
              <FaSync /> Estimate Both
            </button>
          </div>
        )}
      </>
    )
  }

  /**
   * Render neighbor list
   */
  renderNeighbors = () => {
    const { neighbors, selectedNeighborIndex, showAdjustedValues, estimationMode } = this.state

    if (neighbors.length === 0) {
      return (
        <div className="PricingPage__no-neighbors">
          <p>No similar cases found yet.</p>
          <p>Select product and conditions to see historical data.</p>
        </div>
      )
    }

    return (
      <div className="PricingPage__neighbor-list">
        {neighbors.slice(0, 10).map((neighbor, idx) => {
          // Determine which values to show based on toggle and estimation mode
          let displayPrice = neighbor.instance.sale_price
          let displayDemand = neighbor.instance.units_sold

          if (showAdjustedValues) {
            // If we estimated price (set_demand or both modes), show adjusted price
            if ((estimationMode === 'set_demand' || estimationMode === 'both') && neighbor.adjustedValue !== undefined) {
              displayPrice = neighbor.adjustedValue
            }
            // If we estimated demand (set_price mode), show adjusted demand
            if (estimationMode === 'set_price' && neighbor.adjustedValue !== undefined) {
              displayDemand = neighbor.adjustedValue
            }
          }

          return (
            <div
              key={idx}
              className={`PricingPage__neighbor-card ${selectedNeighborIndex === idx ? 'PricingPage__neighbor-card--selected' : ''}`}
              onClick={() => this.selectNeighbor(idx)}
            >
              {/* Similarity score */}
              <div className="PricingPage__neighbor-score">
                <div className="PricingPage__neighbor-score-bar">
                  <div
                    className="PricingPage__neighbor-score-fill"
                    style={{ width: `${Math.min(100, neighbor.hitScore * 10)}%` }}
                  />
                </div>
                <span className="PricingPage__neighbor-score-value">
                  {neighbor.hitScore.toFixed(2)}
                </span>
              </div>

              {/* Product info */}
              <div className="PricingPage__neighbor-product">
                <strong>{neighbor.instance.name || neighbor.instance.product_id}</strong>
                <span className="PricingPage__neighbor-date">
                  {neighbor.instance.day_of_week}, {neighbor.instance.date}
                </span>
              </div>

              {/* Price & demand */}
              <div className="PricingPage__neighbor-metrics">
                <div className="PricingPage__neighbor-metric">
                  <span className="PricingPage__neighbor-metric-label">Price:</span>
                  <span className="PricingPage__neighbor-metric-value">
                    €{displayPrice?.toFixed(3)}
                    {showAdjustedValues && neighbor.adjustedValue !== undefined &&
                     (estimationMode === 'set_demand' || estimationMode === 'both') && (
                      <span className="PricingPage__neighbor-adjusted-badge">adj</span>
                    )}
                  </span>
                </div>
                <div className="PricingPage__neighbor-metric">
                  <span className="PricingPage__neighbor-metric-label">Demand:</span>
                  <span className="PricingPage__neighbor-metric-value">
                    {Math.round(displayDemand)} units
                    {showAdjustedValues && neighbor.adjustedValue !== undefined &&
                     estimationMode === 'set_price' && (
                      <span className="PricingPage__neighbor-adjusted-badge">adj</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Key conditions */}
              <div className="PricingPage__neighbor-conditions">
                {neighbor.instance.is_weekend && <span className="PricingPage__neighbor-tag">Weekend</span>}
                {neighbor.instance.is_holiday_week && <span className="PricingPage__neighbor-tag">Holiday</span>}
                {neighbor.instance.promotional_placement !== 'normal' && (
                  <span className="PricingPage__neighbor-tag">{neighbor.instance.promotional_placement}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  render() {
    const { neighbors, productStats, loading } = this.state

    return (
      <div className="PricingPage">
        {/* Header */}
        <div className="PricingPage__header">
          <h1 className="PricingPage__title">
            Price Optimization
            <HelpButton
              feature="Price Optimization"
              {...HELP_CONTENT['Price Optimization']}
              size="md"
              className="ml-3"
            />
          </h1>
          <p className="PricingPage__subtitle">
            Data-driven pricing decisions to maximize profitability. Estimate optimal prices and forecast demand using historical patterns.
          </p>
        </div>

        {/* Main content */}
        <div className="PricingPage__content">
          {/* KPI SECTION - Full Width at Top */}
          <div className="PricingPage__kpi-section-wrapper">
            <div className="PricingPage__kpi-section">
              {this.renderKPIs()}
            </div>
          </div>

          {/* Two-Panel Layout */}
          <div className="PricingPage__main-section">
            {/* LEFT PANEL: Field Selection */}
            <div className="PricingPage__panel PricingPage__panel--left">
              <div className="PricingPage__panel-header">
                <h2 className="PricingPage__panel-title">Field Selection</h2>
              </div>

              <div className="PricingPage__fields">
                {this.renderFieldGroups()}
              </div>

              {/* Action buttons at bottom */}
              <div className="PricingPage__field-actions">
                <button
                  className="PricingPage__action-btn PricingPage__action-btn--primary"
                  onClick={this.populateFromProduct}
                  disabled={!this.state.fieldValues.product_id}
                  title="Populate fields from selected product"
                >
                  <FaCheckCircle /> Populate from Product
                </button>
                <button
                  className="PricingPage__action-btn PricingPage__action-btn--secondary"
                  onClick={this.resetFields}
                  title="Reset all fields"
                >
                  <FaSync /> Reset All
                </button>
              </div>
            </div>

            {/* RIGHT PANEL: Visualization & Evidence */}
            <div className="PricingPage__panel--right">
              {/* Scatter plot */}
              <div className="PricingPage__visualization">
                <div className="PricingPage__viz-header">
                  <h3 className="PricingPage__viz-title">Price-Demand Relationship</h3>
                  <div className="PricingPage__viz-toggle-group">
                    <button
                      className={`PricingPage__viz-toggle-btn ${!this.state.showAdjustedValues ? 'active' : ''}`}
                      onClick={() => this.setState({ showAdjustedValues: false })}
                      title="Show original historical values"
                    >
                      Original
                    </button>
                    <button
                      className={`PricingPage__viz-toggle-btn ${this.state.showAdjustedValues ? 'active' : ''}`}
                      onClick={() => this.setState({ showAdjustedValues: true })}
                      title="Show adjusted what-if values"
                    >
                      Adjusted
                    </button>
                  </div>
                </div>
                {this.renderScatterPlot()}
              </div>

              {/* Evidence Section */}
              <div className="PricingPage__evidence-section">
                <div className="PricingPage__panel-header">
                  <h2 className="PricingPage__panel-title">Evidence</h2>
                </div>

                {/* Overview stats */}
                {neighbors.length > 0 && (
                  <div className="PricingPage__evidence-overview">
                    <div className="PricingPage__evidence-stat">
                      <span className="PricingPage__evidence-stat-value">{neighbors.length}</span>
                      <span className="PricingPage__evidence-stat-label">Similar Cases Found</span>
                    </div>
                    {productStats && (
                      <div className="PricingPage__evidence-meta">
                        <div>Avg Price: €{productStats['sale_price.$mean']?.toFixed(3)}</div>
                        <div>Avg Demand: {Math.round(productStats['units_sold.$mean'])} units</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Neighbor list */}
                {this.renderNeighbors()}

                {loading && (
                  <div className="PricingPage__loading">
                    <FaSync className="PricingPage__loading-icon" />
                    <span>Analyzing historical data...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default PricingPage
