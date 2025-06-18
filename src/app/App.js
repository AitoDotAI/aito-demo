import React, { Component } from 'react'
import _ from 'lodash'
import {
  Modal,
  ModalHeader,
  ModalBody,
} from 'reactstrap';
import { createBrowserHistory } from 'history';
import * as data from './data'
import NavBar from './components/NavBar'
import LandingPage from './pages/LandingPage'
import AdminPage from './pages/AdminPage'
import AnalyticsPage from './pages/AnalyticsPage'
import InvoicingPage from './pages/InvoicingPage'
import HelpPage from './pages/HelpPage'
import CartPage from './pages/CartPage'
import ProductPage from './pages/ProductPage'
import DataInspectPage from './pages/DataInspectPage'

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
    // Listen for changes to the current location.
    history.listen((location, action) => {
      window.scrollTo(0, 0);

      const urlPath = getPath(location.pathname)
      this.setState({
        urlPath,
      })
    })
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
    }, cb)
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

  setPage(urlPath) {
    history.push(urlPath)
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
      case '/help':
        return HelpPage
      case '/data':
        return DataInspectPage
      case '/analytics':
        return AnalyticsPage
      case '/invoicing':
        return InvoicingPage
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
  }

  render() {
    const { state } = this
    const Page = this.getPage(state.urlPath)

    const dataFetchers = {
      getTagSuggestions: (productName) => Promise.resolve(data.getTagSuggestions(productName)),

      // Add user behavior
      getRecommendedProducts:
        (currentShoppingBasket, count) => Promise.resolve(
          data.getRecommendedProducts(state.selectedUserId, currentShoppingBasket, count)
        ),

      getProductSearchResults:
        (searchValue) => Promise.resolve(
          data.getProductSearchResults(state.selectedUserId, searchValue)
        ),

      getProductsByIds: 
        (ids) => Promise.resolve(data.getProductsByIds(ids)),

      getAutoComplete: 
        (query) => Promise.resolve(data.getAutoComplete(state.selectedUserId, query)),

      getAutoFill: 
        () => Promise.resolve(data.getAutoFill(state.selectedUserId)),

      prompt: 
        (question) => Promise.resolve(data.prompt(question)),

      relate: 
        (field, value) => Promise.resolve(data.relate(field, value)),

      predictInvoice: 
        (input, output) => Promise.resolve(data.predictInvoice(input, output)),

      getProductDetails: 
        (productId) => Promise.resolve(data.getProductDetails(productId)),
      
      getAllProducts:
        () => Promise.resolve(data.getAllProducts()),

      getProductStats:
        (productId) => Promise.resolve(data.getProductStats(productId)),

      getProductAnalytics:
        (productId) => Promise.resolve(data.getProductAnalytics(productId)),

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
