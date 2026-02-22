import React, { Component } from 'react'
import _ from 'lodash'
import {
  Modal,
  ModalHeader,
  ModalBody,
} from 'reactstrap';
import { createBrowserHistory } from 'history';
import * as data from './data'
import { initAnalytics, trackPage, trackEvent, identifyUser } from '../analytics'
import NavBar from './components/NavBar'
import LandingPage from './pages/LandingPage'
import AdminPage from './pages/AdminPage'
import AnalyticsPage from './pages/AnalyticsPage'
import InvoicingPage from './pages/InvoicingPage'
import EvaluationPage from './pages/EvaluationPage'
import HelpPage from './pages/HelpPage'
import CartPage from './pages/CartPage'
import ProductPage from './pages/ProductPage'
import DataInspectPage from './pages/DataInspectPage'
import CustomerChatPage from './pages/CustomerChatPage'
import AdminChatPage from './pages/AdminChatPage'
import PricingPage from './pages/PricingPage'

import './App.css'

// Browser history instance for navigation
const history = createBrowserHistory();

/**
 * Normalizes pathname by removing trailing slashes
 * @param {string} pathname - URL pathname to normalize
 * @returns {string} - Normalized pathname
 */
function getPath(pathname) {
  return _.trimEnd(pathname, '/')
}

const PAGE_NAMES = {
  '/': 'Demo - Store',
  '/cart': 'Demo - Cart',
  '/admin': 'Demo - Admin',
  '/admin-chat': 'Demo - Employee Assistant',
  '/customer-chat': 'Demo - Customer Assistant',
  '/help': 'Demo - Help',
  '/data': 'Demo - Data Inspector',
  '/analytics': 'Demo - Analytics',
  '/invoicing': 'Demo - Invoicing',
  '/evaluation': 'Demo - Evaluation',
  '/pricing': 'Demo - Pricing',
}

function getPageName(urlPath) {
  if (urlPath.startsWith('/product/')) return 'Demo - Product Detail'
  return PAGE_NAMES[urlPath] || 'Demo - ' + urlPath
}

/**
 * Main application component for the Aito Grocery Store Demo
 * Manages routing, user selection, shopping cart, and data fetching
 * 
 * Features:
 * - User persona selection (Larry, Veronica, Alice)
 * - Intelligent product search and recommendations
 * - Shopping cart management
 * - Analytics and admin interfaces
 * - Real-time predictions and insights
 */
class App extends Component {
  constructor() {
    super()

    this.state = {
      cart: [],
      selectedUserId: 'larry',
      showError: null,
      urlPath: getPath(window.location.pathname),
    }
  }

  componentDidMount() {
    // Initialize analytics
    initAnalytics()

    // Track initial page view and set browser tab title
    document.title = getPageName(this.state.urlPath)
    trackPage(getPageName(this.state.urlPath), { path: this.state.urlPath })

    // Identify initial user persona
    identifyUser(`demo_${this.state.selectedUserId}`, {
      persona: this.state.selectedUserId,
      type: 'demo_user',
    })

    // Listen for changes to the current location (back/forward buttons, direct URL changes)
    this.historyUnlisten = history.listen(({ location, action }) => {
      window.scrollTo(0, 0);

      const urlPath = getPath(location.pathname)
      this.setState({
        urlPath,
      })

      // Update browser tab title and track page view on navigation
      document.title = getPageName(urlPath)
      trackPage(getPageName(urlPath), { path: urlPath })
    })
  }

  componentWillUnmount() {
    // Clean up history listener
    if (this.historyUnlisten) {
      this.historyUnlisten()
    }
  }

  /**
   * Adds a product to the shopping cart, ensuring no duplicates
   * @param {Object} product - Product object to add to cart
   * @param {Function} cb - Optional callback function
   */
  addItemToCart = (product, cb) => {
    const { state } = this
    const newCart = state.cart.concat([product])
    this.setState({
      cart: _.uniqBy(newCart, item => item.id),
    }, () => {
      // Track cart addition
      trackEvent('demo_product_added_to_cart', {
        product_id: product.id,
        product_name: product.name,
        cart_size: this.state.cart.length,
        user_persona: this.state.selectedUserId,
      })
      if (cb) cb()
    })
  }

  /**
   * Removes a product from the shopping cart by ID
   * @param {string|number} productId - ID of product to remove
   * @param {Function} cb - Optional callback function
   */
  removeItemFromCart = (productId, cb) => {
    const { state } = this
    this.setState({
      cart: _.filter(state.cart, item => item.id !== productId),
    }, cb)
  }

  /**
   * Navigates to a specific page by updating both history and component state
   * @param {string} urlPath - The path to navigate to
   */
  setPage = (urlPath) => {
    const normalizedPath = getPath(urlPath)
    
    // Update browser history
    history.push(urlPath)
    
    // Force immediate state update to ensure UI responds
    this.setState({
      urlPath: normalizedPath
    })
    
    // Scroll to top when navigating
    window.scrollTo(0, 0)
  }

  getPage(urlPath) {
    if (urlPath.startsWith('/product/')) {
      return ProductPage
    }
    switch (urlPath) {
      case '/cart':
        return CartPage
      case '/admin':
        return AdminPage
      case '/admin-chat':
        return AdminChatPage
      case '/customer-chat':
        return CustomerChatPage
      case '/help':
        return HelpPage
      case '/data':
        return DataInspectPage
      case '/analytics':
        return AnalyticsPage
      case '/invoicing':
        return InvoicingPage
      case '/evaluation':
        return EvaluationPage
      case '/pricing':
        return PricingPage
      case '/product':
        return ProductPage
      case '/':
      default:
        return LandingPage
    }
  }

  showError = (err) => {
    this.setState({ showError: err })
  }

  onUserSelected = (userId) => {
    this.setState({ selectedUserId: userId, cart: [] })

    // Track persona change and identify
    identifyUser(`demo_${userId}`, {
      persona: userId,
      type: 'demo_user',
    })
    trackEvent('demo_persona_selected', {
      persona: userId,
    })
  }

  render() {
    const { state } = this
    const Page = this.getPage(state.urlPath)

    const dataFetchers = {
      // Call async API functions directly (they already return promises)
      getTagSuggestions: (productName) => data.getTagSuggestions(productName),
      predictCategory: (productName) => data.predictCategory(productName),
      predictPrice: (productName) => data.predictPrice(productName),
      predictProductAttributes: (productName) => data.predictProductAttributes(productName),

      // Add user behavior for personalized recommendations
      getRecommendedProducts:
        (currentShoppingBasket, count) => 
          data.getRecommendedProducts(state.selectedUserId, currentShoppingBasket, count),

      // Personalized product search with user context
      getProductSearchResults:
        (searchValue) => 
          data.getProductSearchResults(state.selectedUserId, searchValue),

      // Fetch multiple products by ID
      getProductsByIds: 
        (ids) => data.getProductsByIds(ids),

      // Personalized autocomplete suggestions
      getAutoComplete: 
        (query) => data.getAutoComplete(state.selectedUserId, query),

      // Smart cart pre-filling based on user patterns
      getAutoFill: 
        () => data.getAutoFill(state.selectedUserId),

      // AI-powered prompt analysis
      prompt: 
        (question) => data.prompt(question),

      // Statistical relationship analysis
      relate: 
        (field, value) => data.relate(field, value),

      // Invoice classification and routing
      predictInvoice: 
        (input, output) => data.predictInvoice(input, output),
      
      // Model evaluation using Aito's _evaluate endpoint
      evaluateModel:
        (query) => data.evaluateModel(query),

      // Product information retrieval
      getProductDetails: 
        (productId) => data.getProductDetails(productId),
      
      getAllProducts:
        () => data.getAllProducts(),

      // Product analytics and statistics
      getProductStats:
        (productId) => data.getProductStats(productId),

      // Comprehensive product analytics
      getProductAnalytics:
        (productId) => data.getProductAnalytics(productId),

      // Get distinct values for a field
      getDistinctValues:
        (field) => data.getDistinctValues(field),

      // Price estimation and optimization
      getPriceProducts:
        () => data.getPriceProducts(),

      estimatePrice:
        (where) => data.estimatePrice(where),

      estimateDemand:
        (where) => data.estimateDemand(where),

      estimatePriceRegression:
        (where) => data.estimatePriceRegression(where),

      estimateDemandRegression:
        (where) => data.estimateDemandRegression(where),

      getPriceFieldValues:
        (field) => data.getPriceFieldValues(field),

      getProductPriceContext:
        (productId) => data.getProductPriceContext(productId),

      getPriceHistory:
        (productId, limit) => data.getPriceHistory(productId, limit),

      getPriceStats:
        (productId) => data.getPriceStats(productId),

    }

    const actions = {
      goBack: history.goBack,
      setPage: this.setPage,
      addItemToCart: this.addItemToCart,
      removeItemFromCart: this.removeItemFromCart,
      showError: this.showError,
    }

    const modalOpen = state.showError !== null
    return (
      <div className="App">
        <NavBar
          cart={state.cart}
          selectedUserId={state.selectedUserId}
          onUserSelected={this.onUserSelected}
          actions={actions}
          state={state}
        />

        <div className="App__page">
          <Page
            selectedUserId={state.selectedUserId}
            actions={actions}
            dataFetchers={dataFetchers}
            appState={state}
          />
        </div>

        <Modal color="danger" isOpen={modalOpen} toggle={() => this.showError(null)}>
          <ModalHeader toggle={() => this.showError(null)}>Error</ModalHeader>
          <ModalBody>
            {_.get(this.state.showError, 'message')}
          </ModalBody>
        </Modal>
      </div>
    )
  }
}

export default App
