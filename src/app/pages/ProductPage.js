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

import './ProductPage.css'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

class ProductPage extends Component {
  constructor(props) {
    super(props)

    this.state = {
      "product": 0,
      "allProducts": {},
      "details": {
        "id": "",
        "name": ""
      },
      "stats": {
        sum: 0,
        mean: 0
      },
      "analytics": null
    }
  }

  productDetails(id) {
    return this.state.allProducts.filter((x) => x.id === id)[0]
  }

  componentDidUpdate(prevProps) {
    if (this.props.selectedUserId !== prevProps.selectedUserId) {
      this.setState({
        recommendedProducts: []
      })

      this.fetchProductStats()
    }
  }

  componentDidMount() {
    this.fetchAllProducts()
  }

  fetchAllProducts() {
    return this.props.dataFetchers.getAllProducts()
      .then(result => {
        var allProducts = result.hits
        this.setState({
          allProducts,
          details: allProducts[this.state.product]
        })
        this.fetchProductStats()
      })
      .catch(err => this.props.actions.showError(err))
  }

  fetchProductStats() {
    return this.props.dataFetchers.getProductStats(this.state.details.id)
      .then(stats => {
        this.setState({ stats })
        this.fetchProductAnalytics()
      })
      .catch(err => this.props.actions.showError(err))
  }

  fetchProductAnalytics() {
    return this.props.dataFetchers.getProductAnalytics(this.state.details.id)
      .then(analytics => {
        this.setState({ analytics })
      })
      .catch(err => this.props.actions.showError(err))
  }
  prev = () => {
    const current = this.state.product
    if (current > 0) {
      const newDetails = this.state.allProducts[current - 1]
      this.setState({
        product: current - 1,
        details: newDetails
      }, () => {
        this.fetchProductStats()
      })
    }
  }
  next = () => {
    const current = this.state.product
    const newDetails = this.state.allProducts[current + 1]
    this.setState({
      product: current + 1,
      details: newDetails
    }, () => {
      this.fetchProductStats()
    })
  }

  render() {
    var imageUrl = ""
    if (this.state.details) {
      imageUrl = `https://public.keskofiles.com/f/k-ruoka/product/${this.state.details.id}?w=128&h=128&fm=jpg&q=90&fit=fill&bg=ffffff&dpr=2`
    }

    const currentProduct = this.state.product + 1
    const totalProducts = this.state.allProducts.length || 0

    return (
      <div className="ProductPage">
        <div className="ProductPage__header">
          <h1 className="ProductPage__title">Product Analytics</h1>
          <p className="ProductPage__subtitle">
            AI-powered insights and performance metrics for individual products. Navigate through products to see detailed analytics and trends.
          </p>
          <div className="ProductPage__navigation">
            <button className="Button Button--secondary" onClick={this.prev} disabled={this.state.product === 0}>
              ← Previous
            </button>
            <span className="ProductPage__counter">
              {currentProduct} of {totalProducts}
            </span>
            <button className="Button" onClick={this.next} disabled={this.state.product >= totalProducts - 1}>
              Next →
            </button>
          </div>
        </div>

        <div className="ProductCard">
          <div className="ProductCard__content">
            <h2 className="ProductCard__name">{this.state.details["name"] || "Loading..."}</h2>
            {this.state.details["tags"] && (
              <div className="ProductCard__tags">
                {this.state.details["tags"].split(',').map((tag, index) => (
                  <span key={index} className="Tag">{tag.trim()}</span>
                ))}
              </div>
            )}
            <div className="ProductCard__meta">
              <span className="ProductCard__category">
                <strong>Category:</strong> {this.state.details["category"] || "N/A"}
              </span>
            </div>
          </div>
          <div className="ProductCard__image">
            <img src={imageUrl} alt={this.state.details["name"] || "Product"} />
          </div>
        </div>
        <div className="MetricsRow">
          <div className="MetricCard">
            <div className="MetricCard__value">{this.state.stats["sum.samples"] || 0}</div>
            <div className="MetricCard__label">Impressions</div>
          </div>
          <div className="MetricCard MetricCard--highlight">
            <div className="MetricCard__value">{this.state.stats.sum || 0}</div>
            <div className="MetricCard__label">Purchases</div>
          </div>
          <div className="MetricCard">
            <div className="MetricCard__value">{(100 * (this.state.stats.mean || 0)).toFixed(1)}%</div>
            <div className="MetricCard__label">CTR</div>
          </div>
        </div>

        <div className="AnalyticsGrid">
          <div className="AnalyticsCard AnalyticsCard--full-width">
            <h3 className="AnalyticsCard__title">Performance Trends</h3>
            <LineChart width={800} height={300} data={this.state.analytics ? this.state.analytics[4].hits : []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="$value" tick={{ fill: '#6c757d' }} />
              <YAxis tick={{ fill: '#6c757d' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #dee2e6',
                  borderRadius: '8px'
                }} 
              />
              <Legend />
              <Line 
                name="Purchases" 
                type="monotone" 
                dataKey="$sum" 
                stroke="#FF6B35" 
                strokeWidth={3}
                activeDot={{ r: 6, fill: '#FF6B35' }} 
              />
            </LineChart>
          </div>

          <div className="AnalyticsCard">
            <h3 className="AnalyticsCard__title">CTR by Product Property</h3>
            <ul className="InsightsList">
              {this.state.analytics && this.state.analytics[0].hits
                .filter(x => x.lift.toFixed(2) != 1 && (x.related["product.name"] || x.related["product.tags"] || x.related["product.category"]))
                .map((a, index) => {
                  let label = "";
                  if (a.related["product.name"]) {
                    label = `Title: ${a.related["product.name"]["$has"]}`;
                  } else if (a.related["product.category"]) {
                    label = `Category: ${a.related["product.category"]["$has"]}`;
                  } else {
                    label = `Tag: ${a.related["product.tags"]["$has"]}`;
                  }
                  return (
                    <li key={index} className="InsightsList__item">
                      <span className="InsightsList__label">{label}</span>
                      <span className={`InsightsList__value ${a.lift > 1 ? 'InsightsList__value--positive' : 'InsightsList__value--negative'}`}>
                        {a.lift.toFixed(2)}x
                      </span>
                    </li>
                  );
                })}
            </ul>
          </div>

          <div className="AnalyticsCard">
            <h3 className="AnalyticsCard__title">Purchase % by Customer Segment</h3>
            <ul className="InsightsList">
              {this.state.analytics && this.state.analytics[1].hits.map((a, index) => (
                <li key={index} className="InsightsList__item">
                  <span className="InsightsList__label">{a.related["user.tags"]["$has"]}</span>
                  <span className={`InsightsList__value ${a.lift > 1 ? 'InsightsList__value--positive' : 'InsightsList__value--negative'}`}>
                    {a.lift.toFixed(2)}x
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="AnalyticsCard">
            <h3 className="AnalyticsCard__title">Shopping Basket</h3>
            <ul className="InsightsList">
              {this.state.analytics && this.state.analytics[2].hits
                .filter(x => x.related["purchases"]["$has"] != this.state.details.id)
                .map((a, index) => {
                  const productDetails = this.productDetails(a.related["purchases"]["$has"]);
                  return (
                    <li key={index} className="InsightsList__item">
                      <span className="InsightsList__label">{productDetails ? productDetails["name"] : "Unknown Product"}</span>
                      <span className={`InsightsList__value ${a.lift > 1 ? 'InsightsList__value--positive' : 'InsightsList__value--negative'}`}>
                        {a.lift.toFixed(2)}x
                      </span>
                    </li>
                  );
                })}
            </ul>
          </div>

          <div className="AnalyticsCard">
            <h3 className="AnalyticsCard__title">Query Word Frequencies</h3>
            <ul className="InsightsList">
              {this.state.analytics && this.state.analytics[3].hits
                .filter((x) => x.$score > 0 && x.$value)
                .map((a, index) => (
                  <li key={index} className="InsightsList__item">
                    <span className="InsightsList__label">{a.$value}</span>
                    <span className="InsightsList__value">{a.$score}x</span>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    )
  }
}

export default ProductPage
