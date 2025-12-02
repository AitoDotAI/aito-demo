import React, { Component } from 'react'
import _ from 'lodash'
import {
  Label,
  Input,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Tooltip as TooltipComponent,
} from 'reactstrap'
import { ComposedChart, Scatter, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { FaToggleOn, FaToggleOff, FaSync } from 'react-icons/fa'
import HelpButton from '../components/HelpButton'
import { HELP_CONTENT } from '../constants/helpContent'

import './PricingPage.css'

// Field configuration with labels and types
const FIELD_CONFIG = {
  // Product fields
  product_id: { label: 'Product', group: 'Product', type: 'string', priority: 1 },
  purchase_cost: { label: 'Product Cost', group: 'Product', type: 'number', priority: 2 },
  category: { label: 'Category', group: 'Product', type: 'string', priority: 3 },
  category_name: { label: 'Category Name', group: 'Product', type: 'string', priority: 4 },
  brand: { label: 'Brand', group: 'Product', type: 'string', priority: 5 },

  // Temporal fields
  day_of_week: { label: 'Day of Week', group: 'Temporal', type: 'string', priority: 6 },
  is_weekend: { label: 'Weekend', group: 'Temporal', type: 'boolean', priority: 7 },
  is_holiday_week: { label: 'Holiday Week', group: 'Temporal', type: 'boolean', priority: 8 },

  // Competitive & placement
  competitor_avg_price: { label: 'Competitor Price', group: 'Competitive', type: 'number', priority: 9 },
  promotional_placement: { label: 'Placement', group: 'Competitive', type: 'string', priority: 10 },

  // Contextual
  weather_temp: { label: 'Temperature (°C)', group: 'Contextual', type: 'number', priority: 11 },
  days_until_expiry: { label: 'Days to Expiry', group: 'Contextual', type: 'number', priority: 12 },
}

// Default active fields (most important)
const DEFAULT_ACTIVE_FIELDS = ['product_id', 'purchase_cost', 'category', 'day_of_week', 'is_weekend', 'competitor_avg_price']

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
      // Set default cost value, others start as null
      fieldValues[field] = field === 'purchase_cost' ? 0.10 : null
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

      // Regression explanations
      priceRegressionExplanation: null,
      demandRegressionExplanation: null,

      // UI state
      selectedNeighborIndex: null,
      loading: false,
      productStats: null,
      priceHistory: [],
      showAdjustedValues: true, // Toggle between original and adjusted values (default: adjusted)
      yAxisMode: 'demand', // 'demand' | 'profit' - what to show on Y-axis

      // Tooltip visibility
      tooltipOpen: {
        price: false,
        demand: false,
        profit: false,
      },

      // Price-demand curve points
      curvePoints: [], // Additional points to show the price-demand relationship
    }

    // Debounce estimation calls
    this.debouncedEstimate = _.debounce(this.performEstimation, 500).bind(this)
  }

  /**
   * Toggle tooltip visibility
   */
  toggleTooltip = (tooltipName) => {
    this.setState(prevState => ({
      tooltipOpen: {
        ...prevState.tooltipOpen,
        [tooltipName]: !prevState.tooltipOpen[tooltipName]
      }
    }))
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
      },
      // Update purchaseCost state when cost field changes
      ...(fieldName === 'purchase_cost' && value !== null && value !== undefined ? { purchaseCost: parseFloat(value) || 0.10 } : {})
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

    console.log('=== loadProductContext called ===')
    console.log('Product ID:', productId)

    try {
      // Fetch critical data in parallel
      const [context, history, productDetails] = await Promise.all([
        dataFetchers.getProductPriceContext(productId),
        dataFetchers.getPriceHistory(productId, 100),
        dataFetchers.getProductDetails(productId)
      ])

      console.log('Product Details Response:', productDetails)
      console.log('Price Context:', context)

      // Fetch stats separately (non-critical, can fail)
      let stats = null
      try {
        stats = await dataFetchers.getPriceStats(productId)
      } catch (statsErr) {
        console.warn('Could not fetch product stats (non-critical):', statsErr)
      }

      const product = productDetails?.hits?.[0]
      console.log('Extracted product:', product)

      if (product) {
        // Use cost from products table
        const productCost = product.cost || 0.10
        console.log('Product cost:', productCost)

        // Auto-populate fields from product table
        const newFieldValues = { ...this.state.fieldValues }
        console.log('Current fieldValues before update:', this.state.fieldValues)

        // Keep product_id as is (already selected)
        newFieldValues.product_id = productId

        // Populate from products table
        if (product.category !== undefined) {
          newFieldValues.category = product.category
          console.log('Set category to:', product.category)
        }

        // Set the cost field from product table
        newFieldValues.purchase_cost = productCost
        console.log('Set purchase_cost to:', productCost)

        // Populate remaining fields from price_history context if available
        if (context) {
          Object.keys(FIELD_CONFIG).forEach(field => {
            // Skip product_id, category, and purchase_cost as they're from products table
            if (field !== 'product_id' && field !== 'category' && field !== 'purchase_cost') {
              if (this.state.activeFields[field] && context[field] !== undefined) {
                newFieldValues[field] = context[field]
                console.log(`Set ${field} to:`, context[field])
              }
            }
          })
        }

        console.log('New fieldValues:', newFieldValues)
        console.log('Active fields:', this.state.activeFields)

        this.setState({
          purchaseCost: productCost,
          productStats: stats,
          priceHistory: history,
          fieldValues: newFieldValues
        }, () => {
          console.log('State updated! New fieldValues:', this.state.fieldValues)
          console.log('New purchaseCost:', this.state.purchaseCost)
          // Trigger estimation after populating fields
          this.debouncedEstimate()
        })
      } else {
        console.warn('No product found in productDetails')
      }
    } catch (err) {
      console.error('Error loading product context:', err)
    }
  }

  /**
   * Reset all active fields to defaults from current product
   */
  populateFromProduct = async () => {
    const productId = this.state.fieldValues.product_id
    if (!productId) {
      alert('Please select a product first')
      return
    }

    const { dataFetchers } = this.props

    try {
      // Fetch both price context and product details
      const [context, productDetails] = await Promise.all([
        dataFetchers.getProductPriceContext(productId),
        dataFetchers.getProductDetails(productId)
      ])

      if (context) {
        const newFieldValues = { ...this.state.fieldValues }

        // Populate fields from context
        Object.keys(FIELD_CONFIG).forEach(field => {
          if (this.state.activeFields[field] && context[field] !== undefined) {
            newFieldValues[field] = context[field]
          }
        })

        // Get cost from products table
        const productCost = productDetails?.hits?.[0]?.cost || context.purchase_cost || 0.10
        newFieldValues.purchase_cost = productCost

        this.setState({
          fieldValues: newFieldValues,
          purchaseCost: productCost
        }, () => {
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
      // Keep default cost value when resetting
      fieldValues[field] = field === 'purchase_cost' ? 0.10 : null
    })

    this.setState({
      fieldValues,
      purchaseCost: 0.10, // Reset to default cost
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
   * Only includes fields that are active AND have non-empty values
   */
  buildWhereConditions = () => {
    const where = {}

    Object.keys(this.state.activeFields).forEach(field => {
      const value = this.state.fieldValues[field]
      // Only include if field is active and has a non-null, non-empty value
      if (this.state.activeFields[field] && value !== null && value !== '' && value !== undefined) {
        where[field] = value
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
      // Estimate demand at each price point (without why for performance)
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
   * Parse regression explanation from why data
   * Converts log-scale effects to display format
   *
   * Response structure: e^(sum of terms)
   * - why.type = 'exponent'
   * - why.power.type = 'sum'
   * - why.power.terms[] contains:
   *   - input: residual (usually 0)
   *   - mean centering: global mean
   *   - regression: field effects with proposition object { "field": "value" }
   */
  parseRegressionExplanation = (regressionResult, knnEstimate) => {
    if (!regressionResult || !regressionResult.why) {
      return null
    }

    const why = regressionResult.why
    const components = []

    // Parse the nested exponent structure: e^(sum of terms)
    if (why.type === 'exponent' && why.power && why.power.type === 'sum' && why.power.terms) {
      const terms = why.power.terms

      terms.forEach(term => {
        if (term.type === 'input' && term.name === 'residual') {
          // Skip residual (usually 0)
          if (term.value !== 0) {
            const baseValue = Math.exp(term.value)
            components.push({
              label: 'Residual',
              value: baseValue,
              effect: null,
              isBase: true,
              logValue: term.value
            })
          }
        } else if (term.type === 'mean centering') {
          // Global mean/base - this is the starting point
          const baseValue = Math.exp(term.value)
          components.push({
            label: 'Base (mean)',
            value: baseValue,
            effect: null,
            isBase: true,
            logValue: term.value
          })
        } else if (term.type === 'regression' && term.proposition) {
          // Field effects with proposition object
          const multiplier = Math.exp(term.value)
          const percentageChange = (multiplier - 1) * 100

          // Extract field and value from proposition
          const fieldName = Object.keys(term.proposition)[0]
          const fieldValue = term.proposition[fieldName]

          // Get user-friendly field label from FIELD_CONFIG
          const fieldConfig = FIELD_CONFIG[fieldName]
          const fieldLabel = fieldConfig ? fieldConfig.label : fieldName

          // Format the label nicely
          let displayLabel = `${fieldLabel}: ${fieldValue}`

          // Special formatting for boolean values
          if (fieldConfig && fieldConfig.type === 'boolean') {
            displayLabel = `${fieldLabel}: ${fieldValue ? 'Yes' : 'No'}`
          }

          // Special formatting for price/cost fields
          if (fieldName.includes('price') || fieldName.includes('cost')) {
            displayLabel = `${fieldLabel}: €${parseFloat(fieldValue).toFixed(2)}`
          }

          components.push({
            label: displayLabel,
            value: fieldValue,
            field: fieldName,
            effect: percentageChange,
            isBase: false,
            logValue: term.value,
            regressionType: term.regressionType
          })
        }
      })
    }

    // Sort components: categorical fields (product_id, category) first, then others
    const sortedComponents = components.sort((a, b) => {
      if (a.isBase) return -1  // Base always first
      if (b.isBase) return 1

      // Define priority order for fields
      const priorityFields = ['product_id', 'category', 'category_name', 'brand']

      const aField = a.field || ''
      const bField = b.field || ''

      const aPriority = priorityFields.indexOf(aField)
      const bPriority = priorityFields.indexOf(bField)

      // If both are priority fields, sort by their order in priorityFields
      if (aPriority !== -1 && bPriority !== -1) {
        return aPriority - bPriority
      }

      // If only a is priority, it comes first
      if (aPriority !== -1) return -1

      // If only b is priority, it comes first
      if (bPriority !== -1) return 1

      // Otherwise maintain original order
      return 0
    })

    // Calculate adjustment (KNN estimate - regression estimate)
    const regressionEstimate = regressionResult.estimate
    const adjustment = knnEstimate && regressionEstimate
      ? ((knnEstimate / regressionEstimate) - 1) * 100
      : null

    return {
      components: sortedComponents,
      regressionEstimate,
      knnEstimate,
      adjustment
    }
  }

  /**
   * Main estimation logic
   */
  performEstimation = async () => {
    const { dataFetchers } = this.props
    const { estimationMode, manualPrice, manualDemand } = this.state

    const where = this.buildWhereConditions()

    // Need at least one condition for estimation
    if (Object.keys(where).length === 0) {
      return
    }

    this.setState({ loading: true })

    try {
      if (estimationMode === 'both') {
        // Estimate both price and demand (both KNN and regression)
        const [priceResult, priceRegression] = await Promise.all([
          dataFetchers.estimatePrice(where),
          dataFetchers.estimatePriceRegression(where).catch(err => {
            console.warn('Regression estimation failed:', err)
            return null
          })
        ])

        const demandWhere = { ...where, sale_price: priceResult.estimate }
        const [demandResult, demandRegression] = await Promise.all([
          dataFetchers.estimateDemand(demandWhere),
          dataFetchers.estimateDemandRegression(demandWhere).catch(err => {
            console.warn('Demand regression estimation failed:', err)
            return null
          })
        ])

        // Estimate curve points around the estimated price
        const curvePoints = await this.estimateCurvePoints(priceResult.estimate, where)

        // Parse regression explanations
        const priceExplanation = this.parseRegressionExplanation(priceRegression, priceResult.estimate)
        const demandExplanation = this.parseRegressionExplanation(demandRegression, demandResult.estimate)

        this.setState({
          estimatedPrice: priceResult.estimate,
          estimatedDemand: demandResult.estimate,
          priceEstimation: priceResult,
          demandEstimation: demandResult,
          priceRegressionExplanation: priceExplanation,
          demandRegressionExplanation: demandExplanation,
          neighbors: this.extractNeighbors(priceResult, demandResult),
          curvePoints,
          loading: false
        })

      } else if (estimationMode === 'set_price') {
        // User set price manually, estimate demand
        const demandWhere = { ...where, sale_price: manualPrice }
        const [demandResult, demandRegression] = await Promise.all([
          dataFetchers.estimateDemand(demandWhere),
          dataFetchers.estimateDemandRegression(demandWhere).catch(err => {
            console.warn('Demand regression estimation failed:', err)
            return null
          })
        ])

        // Estimate curve points around the manual price
        const curvePoints = await this.estimateCurvePoints(manualPrice, where)

        // Parse regression explanation
        const demandExplanation = this.parseRegressionExplanation(demandRegression, demandResult.estimate)

        this.setState({
          estimatedPrice: manualPrice,
          estimatedDemand: demandResult.estimate,
          demandEstimation: demandResult,
          demandRegressionExplanation: demandExplanation,
          priceRegressionExplanation: null,
          neighbors: this.extractNeighbors(null, demandResult),
          curvePoints,
          loading: false
        })

      } else if (estimationMode === 'set_demand') {
        // User set demand manually, estimate price
        const priceWhere = { ...where, units_sold: manualDemand }
        const [priceResult, priceRegression] = await Promise.all([
          dataFetchers.estimatePrice(priceWhere),
          dataFetchers.estimatePriceRegression(priceWhere).catch(err => {
            console.warn('Regression estimation failed:', err)
            return null
          })
        ])

        // Estimate curve points around the estimated price
        const curvePoints = await this.estimateCurvePoints(priceResult.estimate, where)

        // Parse regression explanation
        const priceExplanation = this.parseRegressionExplanation(priceRegression, priceResult.estimate)

        this.setState({
          estimatedPrice: priceResult.estimate,
          estimatedDemand: manualDemand,
          priceEstimation: priceResult,
          priceRegressionExplanation: priceExplanation,
          demandRegressionExplanation: null,
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

    // Extract neighbors from price result
    const priceNeighbors = new Map()
    if (priceResult && priceResult.why && priceResult.why.components) {
      priceResult.why.components.forEach((component, index) => {
        if (component.value && component.value.instance) {
          const instanceKey = JSON.stringify(component.value.instance)
          priceNeighbors.set(instanceKey, {
            index,
            hitScore: component.value.hitScore || 0,
            adjustedPrice: component.value.value,
            originalPrice: component.value.original,
            instance: component.value.instance,
            adjustments: component.value.adjustments,
            weight: component.weight || 1.0
          })
        }
      })
    }

    // Extract neighbors from demand result and merge with price neighbors
    if (demandResult && demandResult.why && demandResult.why.components) {
      demandResult.why.components.forEach((component, index) => {
        if (component.value && component.value.instance) {
          const instanceKey = JSON.stringify(component.value.instance)
          const existing = priceNeighbors.get(instanceKey)

          if (existing) {
            // Merge demand data with existing price neighbor
            existing.adjustedDemand = component.value.value
            existing.originalDemand = component.value.original
          } else {
            // Create new neighbor with demand data only
            priceNeighbors.set(instanceKey, {
              index,
              hitScore: component.value.hitScore || 0,
              adjustedDemand: component.value.value,
              originalDemand: component.value.original,
              instance: component.value.instance,
              adjustments: component.value.adjustments,
              weight: component.weight || 1.0
            })
          }
        }
      })
    }

    // Convert map to array
    neighbors.push(...priceNeighbors.values())

    // For backward compatibility, if only one result exists, use adjustedValue
    if (neighbors.length > 0 && neighbors[0].adjustedPrice === undefined && neighbors[0].adjustedDemand === undefined) {
      const result = priceResult || demandResult
      if (result && result.why && result.why.components) {
        result.why.components.forEach((component, index) => {
          if (component.value && component.value.instance && index < neighbors.length) {
            neighbors[index].adjustedValue = component.value.value
            neighbors[index].originalValue = component.value.original
          }
        })
      }
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
                  {value ? (
                    // Show display name if available, otherwise show value
                    options.find(opt => opt.$value === value)?.$displayName || value
                  ) : 'Select...'}
                </DropdownToggle>
                <DropdownMenu className="PricingPage__dropdown-menu">
                  {options.map((option, idx) => (
                    <DropdownItem
                      key={idx}
                      onClick={() => this.setFieldValue(fieldName, option.$value)}
                    >
                      {option.$displayName || option.$value}
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

    // Calculate profit: (price - cost) × demand
    const purchaseCost = data.purchaseCost || 0
    const displayProfit = (displayPrice - purchaseCost) * displayDemand

    // Calculate original profit if showing adjusted values
    let originalProfit = null
    if (hasAdjustments && showAdjustedValues) {
      const origPrice = data.originalPrice || displayPrice
      const origDemand = data.originalDemand || displayDemand
      originalProfit = (origPrice - purchaseCost) * origDemand
    }

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
          <div className="PricingPage__chart-tooltip-metric">
            <span className="PricingPage__chart-tooltip-label">Est. Profit:</span>
            <span className="PricingPage__chart-tooltip-value">
              €{displayProfit.toFixed(2)}
              {originalProfit !== null && (
                <span style={{ fontSize: '0.7rem', color: '#888', marginLeft: '0.25rem' }}>
                  (was €{originalProfit.toFixed(2)})
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
    const { priceHistory, estimatedPrice, estimatedDemand, neighbors, purchaseCost, estimationMode, showAdjustedValues, curvePoints, yAxisMode } = this.state

    // Prepare data points with x/y coordinates based on mode
    const historicalPoints = priceHistory.map(point => {
      const cost = point.purchase_cost || purchaseCost
      const profit = (point.sale_price - cost) * point.units_sold
      return {
        x: point.sale_price,
        y: yAxisMode === 'demand' ? point.units_sold : profit,
        price: point.sale_price,
        demand: point.units_sold,
        profit: profit,
        type: 'historical',
        name: point.name || 'Historical Data',
        date: point.date,
        dayOfWeek: point.day_of_week,
        isWeekend: point.is_weekend,
        placement: point.promotional_placement,
        margin: point.margin_percentage,  // Use original margin from database
        purchaseCost: cost
      }
    })

    // Prepare curve points (sorted by price for proper line connection)
    const curveData = [...curvePoints]
      .sort((a, b) => a.price - b.price)
      .map(point => {
        const profit = (point.price - purchaseCost) * point.demand
        const margin = point.price > 0 ? ((point.price - purchaseCost) / point.price * 100) : 0
        return {
          x: point.price,
          y: yAxisMode === 'demand' ? point.demand : profit,
          price: point.price,
          demand: point.demand,
          profit: profit,
          margin: margin,
          type: 'curve',
          name: `Price: €${point.price.toFixed(3)} (${point.adjustment > 0 ? '+' : ''}${(point.adjustment * 100).toFixed(0)}%)`,
          purchaseCost: purchaseCost
        }
      })

    // Prepare neighbor points with correct adjusted values based on what was estimated
    const neighborPoints = neighbors.slice(0, 20).map(neighbor => {
      // Determine display values based on toggle
      let displayPrice = neighbor.instance.sale_price
      let displayDemand = neighbor.instance.units_sold

      if (showAdjustedValues) {
        // Use adjusted price if available
        if (neighbor.adjustedPrice !== undefined) {
          displayPrice = neighbor.adjustedPrice
        } else if (neighbor.adjustedValue !== undefined && (estimationMode === 'set_demand' || estimationMode === 'both')) {
          displayPrice = neighbor.adjustedValue
        }

        // Use adjusted demand if available
        if (neighbor.adjustedDemand !== undefined) {
          displayDemand = neighbor.adjustedDemand
        } else if (neighbor.adjustedValue !== undefined && estimationMode === 'set_price') {
          displayDemand = neighbor.adjustedValue
        }
      }

      const cost = neighbor.instance.purchase_cost || purchaseCost
      const displayProfit = (displayPrice - cost) * displayDemand
      const originalProfit = (neighbor.instance.sale_price - cost) * neighbor.instance.units_sold

      const point = {
        x: displayPrice,
        y: yAxisMode === 'demand' ? displayDemand : displayProfit,
        price: displayPrice,  // Display price (original or adjusted)
        demand: displayDemand, // Display demand (original or adjusted)
        profit: displayProfit, // Display profit (original or adjusted)
        originalPrice: neighbor.instance.sale_price,
        originalDemand: neighbor.instance.units_sold,
        originalProfit: originalProfit,
        type: 'neighbor',
        hitScore: neighbor.hitScore,
        name: neighbor.instance.name || neighbor.instance.product_id,
        date: neighbor.instance.date,
        dayOfWeek: neighbor.instance.day_of_week,
        isWeekend: neighbor.instance.is_weekend,
        placement: neighbor.instance.promotional_placement,
        margin: neighbor.instance.margin_percentage,  // Use original margin from database
        competitorPrice: neighbor.instance.competitor_avg_price,
        purchaseCost: cost
      }

      // Store adjusted values for tooltip display
      if (neighbor.adjustedPrice !== undefined) {
        point.adjustedPrice = neighbor.adjustedPrice
      }
      if (neighbor.adjustedDemand !== undefined) {
        point.adjustedDemand = neighbor.adjustedDemand
      }

      return point
    })

    // Current estimate point
    const currentEstimateProfit = estimatedPrice && estimatedDemand ? (estimatedPrice - purchaseCost) * estimatedDemand : 0
    const currentPoint = estimatedPrice && estimatedDemand ? [{
      x: estimatedPrice,
      y: yAxisMode === 'demand' ? estimatedDemand : currentEstimateProfit,
      price: estimatedPrice,
      demand: estimatedDemand,
      profit: currentEstimateProfit,
      type: 'current',
      name: 'Current Estimate',
      margin: estimatedPrice ? ((estimatedPrice - purchaseCost) / estimatedPrice * 100) : 0,
      purchaseCost: purchaseCost
    }] : []

    return (
      <ResponsiveContainer width="100%" height={450}>
        <ComposedChart margin={{ top: 20, right: 30, bottom: 40, left: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            type="number"
            dataKey="x"
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
            dataKey="y"
            name={yAxisMode === 'demand' ? 'Demand' : 'Profit'}
            unit={yAxisMode === 'demand' ? ' units' : '€'}
            label={{
              value: yAxisMode === 'demand' ? 'Units Sold' : 'Estimated Profit (€)',
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

          {/* Price-Demand/Profit Curve (transparent orange line with points) */}
          {curveData.length > 0 && (
            <Line
              name={yAxisMode === 'demand' ? 'Price-Demand Curve' : 'Price-Profit Curve'}
              data={curveData}
              type="monotone"
              dataKey="y"
              stroke="#FF6B35"
              strokeWidth={2}
              dot={{ fill: '#FF6B35', fillOpacity: 0.4, r: 4 }}
              strokeOpacity={0.6}
              connectNulls={true}
            />
          )}

          {/* Current estimate (orange, large) */}
          <Scatter
            name="Current Estimate"
            data={currentPoint}
            fill="#FF6B35"
            shape="star"
          />
        </ComposedChart>
      </ResponsiveContainer>
    )
  }

  /**
   * Render explanation tooltip content
   */
  renderExplanationTooltip = (explanation, type, title) => {
    if (!explanation || !explanation.components) {
      return <div>No explanation available</div>
    }

    const estimate = type === 'price' ? this.state.estimatedPrice : this.state.estimatedDemand
    const formatValue = (val) => type === 'price' ? `€${val.toFixed(2)}` : val.toFixed(1)

    // Separate base components from effect components
    const baseComponents = explanation.components.filter(comp => comp.isBase)
    const effectComponents = explanation.components.filter(comp => !comp.isBase)

    // Calculate running totals
    let runningTotal = baseComponents.length > 0 ? baseComponents[0].value : estimate
    const rows = []

    // Add base row
    if (baseComponents.length > 0) {
      rows.push({
        type: 'base',
        label: baseComponents[0].label,
        value: null,
        effect: null,
        runningTotal: runningTotal,
        isBase: true
      })
    }

    // Add effect rows with running calculations
    effectComponents.forEach(comp => {
      const multiplier = 1 + (comp.effect / 100)
      const previousTotal = runningTotal
      runningTotal = previousTotal * multiplier

      rows.push({
        type: comp.effect >= 0 ? 'positive' : 'negative',
        label: comp.label,
        value: comp.value,
        effect: comp.effect,
        runningTotal: runningTotal,
        isBase: false
      })
    })

    // Add adjustment row
    if (explanation.adjustment !== null) {
      const adjustmentMultiplier = 1 + (explanation.adjustment / 100)
      const previousTotal = runningTotal
      runningTotal = previousTotal * adjustmentMultiplier

      rows.push({
        type: 'adjustment',
        label: 'History-based adjustment',
        value: null,
        effect: explanation.adjustment,
        runningTotal: runningTotal,
        isBase: false,
        isFinal: true
      })
    }

    return (
      <div className="aito-tooltip-content">
        <div className="aito-tooltip-header">
          <h4>{title}</h4>
          {estimate && (
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#FF6B35' }}>
              {type === 'price' ? `€${estimate.toFixed(3)}` : `${Math.round(estimate)} units`}
            </span>
          )}
        </div>
        <div className="aito-tooltip-body">
          <table className="aito-explanation-table">
            <tbody>
              {rows.map((row, idx) => (
                <tr
                  key={idx}
                  className={`aito-explanation-row ${row.type}-row ${row.isFinal ? 'aito-explanation-final' : ''}`}
                >
                  <td className="aito-explanation-cell">
                    <div className="aito-explanation-factor">
                      <span className="aito-explanation-factor-label">
                        {row.isBase ? row.label : row.label.split(':')[0]}
                      </span>
                      {row.value && (
                        <span className="aito-explanation-factor-value">
                          {row.label.includes(':') ? row.label.split(':')[1].trim() : ''}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="aito-explanation-cell">
                    {row.effect !== null ? (
                      <div className={`aito-explanation-effect ${row.type}`}>
                        {row.effect >= 0 ? '↑' : '↓'} {row.effect >= 0 ? '+' : ''}{row.effect.toFixed(1)}%
                      </div>
                    ) : (
                      <div className="aito-explanation-effect neutral">—</div>
                    )}
                  </td>
                  <td className="aito-explanation-cell">
                    <div className="aito-explanation-running-total">
                      {formatValue(row.runningTotal)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  /**
   * Render profit explanation tooltip
   */
  renderProfitExplanation = () => {
    const { estimatedPrice, estimatedDemand, purchaseCost } = this.state
    const profit = this.calculateProfit()
    const margin = estimatedPrice - purchaseCost
    const marginPercent = estimatedPrice > 0 ? ((margin / estimatedPrice) * 100) : 0

    const rows = [
      {
        type: 'base',
        label: 'Sale Price',
        value: null,
        effect: null,
        runningTotal: estimatedPrice,
        isBase: true
      },
      {
        type: 'negative',
        label: 'Product Cost',
        value: `€${purchaseCost?.toFixed(2)}`,
        effect: null,
        runningTotal: margin,
        operation: '−'
      },
      {
        type: 'positive',
        label: 'Units Sold',
        value: `${Math.round(estimatedDemand)} units`,
        effect: null,
        runningTotal: profit,
        operation: '×',
        isFinal: true
      }
    ]

    return (
      <div className="aito-tooltip-content">
        <div className="aito-tooltip-header">
          <h4>Profit Calculation</h4>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#FF6B35' }}>
            €{profit.toFixed(2)}
          </span>
        </div>
        <div className="aito-tooltip-body">
          <table className="aito-explanation-table">
            <tbody>
              {rows.map((row, idx) => (
                <tr
                  key={idx}
                  className={`aito-explanation-row ${row.type}-row ${row.isFinal ? 'aito-explanation-final' : ''}`}
                >
                  <td className="aito-explanation-cell">
                    <div className="aito-explanation-factor">
                      <span className="aito-explanation-factor-label">
                        {row.label}
                      </span>
                      {row.value && (
                        <span className="aito-explanation-factor-value">
                          {row.value}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="aito-explanation-cell">
                    {row.operation ? (
                      <div className="aito-explanation-effect neutral" style={{ fontSize: '18px' }}>
                        {row.operation}
                      </div>
                    ) : (
                      <div className="aito-explanation-effect neutral">—</div>
                    )}
                  </td>
                  <td className="aito-explanation-cell">
                    <div className="aito-explanation-running-total">
                      €{row.runningTotal.toFixed(2)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
            Margin: {marginPercent.toFixed(1)}% • Daily revenue
          </div>
        </div>
      </div>
    )
  }

  /**
   * Render KPI section
   */
  renderKPIs = () => {
    const { estimatedPrice, estimatedDemand, purchaseCost, estimationMode, manualPrice, manualDemand, loading, priceRegressionExplanation, demandRegressionExplanation } = this.state
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
              <>
                <div
                  className="PricingPage__kpi-value"
                  id="price-kpi-value"
                  onClick={() => priceRegressionExplanation && estimatedPrice && this.toggleTooltip('price')}
                  style={{ cursor: priceRegressionExplanation && estimatedPrice ? 'pointer' : 'default' }}
                >
                  {loading ? '...' : estimatedPrice ? `€${estimatedPrice.toFixed(3)}` : '—'}
                </div>
                {priceRegressionExplanation && estimatedPrice && (
                  <TooltipComponent
                    autohide={false}
                    flip={false}
                    fade={false}
                    transition={{ timeout: 0 }}
                    isOpen={this.state.tooltipOpen.price}
                    target="price-kpi-value"
                    toggle={() => this.toggleTooltip('price')}
                    placement="bottom-end"
                    className="aito-explanation-tooltip"
                  >
                    {this.renderExplanationTooltip(priceRegressionExplanation, 'price', 'Price Estimate')}
                  </TooltipComponent>
                )}
              </>
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
              <>
                <div
                  className="PricingPage__kpi-value"
                  id="demand-kpi-value"
                  onClick={() => demandRegressionExplanation && estimatedDemand && this.toggleTooltip('demand')}
                  style={{ cursor: demandRegressionExplanation && estimatedDemand ? 'pointer' : 'default' }}
                >
                  {loading ? '...' : estimatedDemand ? `${Math.round(estimatedDemand)} units` : '—'}
                </div>
                {demandRegressionExplanation && estimatedDemand && (
                  <TooltipComponent
                    autohide={false}
                    flip={false}
                    fade={false}
                    transition={{ timeout: 0 }}
                    isOpen={this.state.tooltipOpen.demand}
                    target="demand-kpi-value"
                    toggle={() => this.toggleTooltip('demand')}
                    placement="bottom-end"
                    className="aito-explanation-tooltip"
                  >
                    {this.renderExplanationTooltip(demandRegressionExplanation, 'demand', 'Demand Estimate')}
                  </TooltipComponent>
                )}
              </>
            )}

            <div className="PricingPage__kpi-meta">
              Volume per day
            </div>
          </div>

          {/* Profit KPI */}
          <div className="PricingPage__kpi PricingPage__kpi--highlight">
            <h4 className="PricingPage__kpi-label">Total Profit</h4>
            <div
              className="PricingPage__kpi-value PricingPage__kpi-value--large"
              id="profit-kpi-value"
              onClick={() => estimatedPrice && estimatedDemand && profit > 0 && this.toggleTooltip('profit')}
              style={{ cursor: estimatedPrice && estimatedDemand && profit > 0 ? 'pointer' : 'default' }}
            >
              {loading ? '...' : profit > 0 ? `€${profit.toFixed(2)}` : '—'}
            </div>
            {estimatedPrice && estimatedDemand && profit > 0 && (
              <TooltipComponent
                autohide={false}
                flip={false}
                fade={false}
                transition={{ timeout: 0 }}
                isOpen={this.state.tooltipOpen.profit}
                target="profit-kpi-value"
                toggle={() => this.toggleTooltip('profit')}
                placement="bottom-end"
                className="aito-explanation-tooltip"
              >
                {this.renderProfitExplanation()}
              </TooltipComponent>
            )}
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
            // Use adjusted price if available
            if (neighbor.adjustedPrice !== undefined) {
              displayPrice = neighbor.adjustedPrice
            } else if (neighbor.adjustedValue !== undefined && (estimationMode === 'set_demand' || estimationMode === 'both')) {
              displayPrice = neighbor.adjustedValue
            }

            // Use adjusted demand if available
            if (neighbor.adjustedDemand !== undefined) {
              displayDemand = neighbor.adjustedDemand
            } else if (neighbor.adjustedValue !== undefined && estimationMode === 'set_price') {
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
            Price-Demand Analytics
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

          {/* Beta Disclaimer */}
          <div className="PricingPage__beta-disclaimer">
            <div className="beta-badge">BETA</div>
            <div className="beta-message">
              <strong>Beta Feature:</strong> The <code>_estimate</code> endpoint is currently in beta testing.
              We're actively improving this feature based on user feedback.
            </div>
          </div>
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
                  title="Reset fields to product defaults"
                >
                  <FaSync /> Reset from Product
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
                  <div className="PricingPage__viz-controls">
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
                    <div className="PricingPage__viz-toggle-group">
                      <button
                        className={`PricingPage__viz-toggle-btn ${this.state.yAxisMode === 'demand' ? 'active' : ''}`}
                        onClick={() => this.setState({ yAxisMode: 'demand' })}
                        title="Show demand (units sold) on Y-axis"
                      >
                        Demand
                      </button>
                      <button
                        className={`PricingPage__viz-toggle-btn ${this.state.yAxisMode === 'profit' ? 'active' : ''}`}
                        onClick={() => this.setState({ yAxisMode: 'profit' })}
                        title="Show profit on Y-axis"
                      >
                        Profit
                      </button>
                    </div>
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
