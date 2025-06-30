import React, { Component } from 'react'
import _ from 'lodash'
import ProductList from './ProductList'
import Autosuggest from 'react-autosuggest'
import { FaSearch } from 'react-icons/fa'
import HelpButton from './HelpButton'
import { HELP_CONTENT } from '../constants/helpContent'

import './ProductSearch.css'


class ProductSearch extends Component {
  constructor(props) {
    super(props)

    this.state = {
      suggestions: [],
      inputValue: '',
      searchResults: null
    }

    this.debouncedGetAutoComplete = _.debounce(this.getAutoComplete, 300).bind(this)
    this.debouncedGetSearchResults = _.debounce(this.getSearchResults, 300).bind(this)
  }

  onSuggestionsFetchRequested = ({ value }) => {
    this.debouncedGetAutoComplete(value)
  };

  onSuggestionsClearRequested = () => {
    this.setState({ suggestions: [] });
  };

  getSuggestionValue = suggestion => suggestion.$value;

  renderSuggestion = suggestion => <div>{suggestion.$value}</div>;
  
  componentDidUpdate(prevProps) {
    if (this.props.selectedUserId !== prevProps.selectedUserId) {
      this.setState({
        searchResults: null
      })

      this.getSearchResults(this.state.inputValue)
      this.debouncedGetAutoComplete(this.state.inputValue)
    }
  }

  onInputChange = (event, { newValue, method }) => {
    const inputVal = newValue
    
    if (!inputVal) {
      this.setState({ 
        inputValue: "", 
        searchResults: null 
      })
    } else {
      this.setState({ inputValue: newValue })
      this.debouncedGetSearchResults(newValue)
      this.debouncedGetAutoComplete(newValue)
    }
  }

  getSearchResults = (inputVal) => {
    if (!inputVal) {
      this.setState({
        searchResults: null
      })

      return
    }

    return this.props.dataFetchers.getProductSearchResults(inputVal)
      .then(searchResults => this.setState({ searchResults }))
      .catch(err => this.props.actions.showError(err))
  }

  setAutoComplete = (autoCompletions) => {
    console.log(`auto completions ${JSON.stringify(autoCompletions)}`)
    autoCompletions = autoCompletions.filter(v => v.$value !== "" && v.$p > 0.001).slice(0, 5)
    console.log(`auto completions ${JSON.stringify(autoCompletions)}`)

    this.setState( { suggestions: autoCompletions })
  }

  getAutoComplete = (inputVal) => {
    console.log(`get autocomplete for ${inputVal}`)
    return this.props.dataFetchers.getAutoComplete(inputVal)
      .then(autoCompletions => this.setAutoComplete(autoCompletions))
      .catch(err => this.props.actions.showError(err))
  }

  onItemAddedToCart = (itemIndex) => {
    const { searchResults } = this.state
    const product = searchResults[itemIndex]

    this.props.actions.addItemToCart(product)
  }

  onItemRemovedFromCart = (itemIndex) => {
    const product = this.state.searchResults[itemIndex]
    this.props.actions.removeItemFromCart(product.id)
  }

  render() {
    const { inputValue, searchResults } = this.state
    const { state, props} = this 

    console.log("input:" + inputValue)

    return (
      <div className="ProductSearch">
        <div className="ProductSearch__search-container">
          <div className="ProductSearch__search-inner">
            <span className="ProductSearch__search-label">
              Search:
              <HelpButton 
                feature="Smart Search"
                {...HELP_CONTENT['Smart Search']}
                size="sm"
                className="ml-1"
              />
            </span>
            <div className="ProductSearch__search-input-wrapper">
              <FaSearch className="ProductSearch__search-icon" />
              <Autosuggest
                suggestions={state.suggestions}
                onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
                onSuggestionsClearRequested={this.onSuggestionsClearRequested}
                getSuggestionValue={this.getSuggestionValue}
                renderSuggestion={this.renderSuggestion}
                inputProps={{
                  className:"ProductSearch__input",
                  type:"search",
                  placeholder:"Search products",
                  value: state.inputValue,
                  onChange:this.onInputChange,
                  onKeyPress:this.handleKeyPress
                }}
              />
            </div>
          </div>
        </div>

        {
          state.searchResults !== null
            ? (
              <ProductList
                currentCart={props.cart}
                emptyText="No products found"
                items={state.searchResults}
                onItemAddedToCart={this.onItemAddedToCart}
                onItemRemovedFromCart={this.onItemRemovedFromCart}
              />
            ) : (
              null
            )
        }
      </div>
    )
  }
}

export default ProductSearch
