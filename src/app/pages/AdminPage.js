import React, { Component } from 'react'
import _ from 'lodash'
import {
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from 'reactstrap'
import './AdminPage.css'

class AdminPage extends Component {
  constructor(props) {
    super(props)

    this.state = {
      modalOpen: false,
      tagsInputValue: '',
      productNameInputValue: '',
      categoryInputValue: '',
      priceInputValue: '',
      tagSuggestions: [],
      categoryPrediction: null,
      pricePrediction: null
    }

    this.debouncedFetchNewSuggestions = _.debounce(this.fetchNewSuggestions, 300).bind(this)
  }

  toggleModal = () => {
    this.setState({
      modalOpen: !this.state.modalOpen,
    })
  }

  onProductNameChange = (e) => {
    const val = e.target.value

    this.setState({
      productNameInputValue: val,
    })

    if (!val) {
      this.setState({
        tagSuggestions: [],
        categoryPrediction: null,
        pricePrediction: null
      })
    } else {
      this.debouncedFetchNewSuggestions(val)
    }
  }

  onTagsInputChange = (e) => {
    this.setState({
      tagsInputValue: e.target.value,
    })
  }

  onTagClick = (index) => {
    const tag = this.state.tagSuggestions[index]

    this.setState({
      tagsInputValue: `${this.state.tagsInputValue} ${tag}`
    })
  }

  fetchNewSuggestions(productName) {
    // Fetch tags, category, and price predictions in parallel
    return Promise.all([
      this.props.dataFetchers.getTagSuggestions(productName),
      this.props.dataFetchers.predictCategory(productName),
      this.props.dataFetchers.predictPrice(productName)
    ])
      .then(([tagSuggestions, categoryPrediction, pricePrediction]) => {
        this.setState({
          tagSuggestions,
          categoryPrediction,
          pricePrediction,
          // Auto-fill the input fields with predictions
          categoryInputValue: categoryPrediction ? categoryPrediction.value : '',
          priceInputValue: pricePrediction ? pricePrediction.value.toFixed(2) : ''
        })
      })
      .catch(err => this.props.actions.showError(err))
  }

  onCategoryChange = (e) => {
    this.setState({
      categoryInputValue: e.target.value
    })
  }

  onPriceChange = (e) => {
    this.setState({
      priceInputValue: e.target.value
    })
  }

  render() {
    const hasTagSuggestions = this.state.tagSuggestions.length > 0
    const isFormValid = this.state.productNameInputValue.trim() && this.state.tagsInputValue.trim()

    return (
      <div className="AdminPage">
        <div className="AdminPage__header">
          <h1 className="AdminPage__title">Product Catalog</h1>
          <p className="AdminPage__subtitle">
            Manage products with AI-powered assistance. Enter a product name to automatically predict tags, category, and price based on similar products.
          </p>
        </div>

        <div className="AdminPage__form-section">
          <h3 className="AdminPage__form-title">Add New Product</h3>
          
          <div className="form-field">
            <label className="form-field__label" htmlFor="productName">Product Name</label>
            <input
              className="form-field__input"
              value={this.state.productNameInputValue}
              onChange={this.onProductNameChange}
              type="text"
              name="productName"
              id="productName"
              placeholder="Enter product name (e.g., Organic Milk, Fresh Bananas)"
            />
          </div>

          <div className="form-field">
            <label className="form-field__label" htmlFor="tags">
              Product Tags
            </label>
            <div className="TagsInput">
              {this.state.productNameInputValue && (
                <div className="TagsInput__help-text">
                  {hasTagSuggestions 
                    ? "Click on suggested tags below to add them:" 
                    : "AI tag suggestions will appear as you type..."}
                </div>
              )}
              
              <div className={`TagsInput__suggestions ${!hasTagSuggestions ? 'TagsInput__suggestions--empty' : ''}`}>
                {hasTagSuggestions ? (
                  _.map(this.state.tagSuggestions, (suggestion, index) => (
                    <span 
                      className="TagsInput__tag" 
                      onClick={() => this.onTagClick(index)} 
                      key={index}
                    >
                      {suggestion}
                    </span>
                  ))
                ) : this.state.productNameInputValue ? (
                  "No suggestions yet..."
                ) : (
                  "Type a product name to see AI tag suggestions"
                )}
              </div>

              <input
                className="form-field__input"
                value={this.state.tagsInputValue}
                onChange={this.onTagsInputChange}
                type="text"
                name="tags"
                id="tags"
                placeholder="Enter custom tags or click suggestions above"
              />
            </div>
          </div>

          <div className="form-field">
            <label className="form-field__label" htmlFor="category">
              Category
              {this.state.categoryPrediction && (
                <span className="prediction-badge">
                  AI Predicted ({(this.state.categoryPrediction.confidence * 100).toFixed(0)}% confidence)
                </span>
              )}
            </label>
            <input
              className={`form-field__input ${this.state.categoryPrediction ? 'form-field__input--highlighted' : ''}`}
              value={this.state.categoryInputValue}
              onChange={this.onCategoryChange}
              type="text"
              name="category"
              id="category"
              placeholder="Category will be predicted automatically"
            />
          </div>

          <div className="form-field">
            <label className="form-field__label" htmlFor="price">
              Price (€)
              {this.state.pricePrediction && (
                <span className="prediction-badge">
                  AI Predicted ({(this.state.pricePrediction.confidence * 100).toFixed(0)}% confidence)
                </span>
              )}
            </label>
            <input
              className={`form-field__input ${this.state.pricePrediction ? 'form-field__input--highlighted' : ''}`}
              value={this.state.priceInputValue}
              onChange={this.onPriceChange}
              type="number"
              step="0.01"
              name="price"
              id="price"
              placeholder="Price will be predicted automatically"
            />
          </div>

          <button 
            className="AdminPage__button" 
            onClick={this.toggleModal}
            disabled={!isFormValid}
          >
            Add Product
          </button>

          {!isFormValid && (
            <div className="AdminPage__demo-info">
              <div className="AdminPage__demo-info-title">Required Fields</div>
              Please enter both a product name and tags to add the product.
            </div>
          )}
        </div>

        <Modal isOpen={this.state.modalOpen} toggle={this.toggleModal}>
          <ModalHeader toggle={this.toggleModal}>This is a demo</ModalHeader>
          <ModalBody>
            Product was not really added anywhere, since this is out of the demo's scope.
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={this.toggleModal}>Ok</Button>
          </ModalFooter>
        </Modal>
      </div>
    )
  }
}

export default AdminPage
