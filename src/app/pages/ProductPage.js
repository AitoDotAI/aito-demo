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
      this.setState({ 
        product: current -1,
        details: this.state.allProducts[current - 1]
      })
    }
    this.fetchProductStats()
  }
  next = () => {
    const current = this.state.product
    this.setState({ 
      product: current + 1,
      details: this.state.allProducts[current + 1]
    })
    this.fetchProductStats()
  }

  render() {
    var imageUrl = ""
    if (this.state.details) {
      imageUrl = `https://public.keskofiles.com/f/k-ruoka/product/${this.state.details.id}?w=64&h=64&fm=jpg&q=90&fit=fill&bg=ffffff&dpr=2`
    }

    return (
      <div className="ProductPage">
        <Button className="Button" style={{ marginRight: 10 }} onClick={this.prev}>Prev</Button>
        <Button className="Button" style={{ marginRight: 10 }} onClick={this.next}>Next</Button>
        <div style={{ display: "flex", alignItems: "center" }}>
          <h3>{this.state.details["name"]}</h3>
          <img src={imageUrl} alt="" style={{ marginLeft: "auto" }} />
        </div>
        <p><b>Tags:</b> {this.state.details["tags"]}</p>
        <p><b>Impressions:</b> {this.state.stats.count}</p>
        <p><b>Purchases:</b> {this.state.stats.sum}</p>
        <p><b>Ctr:</b> {(100*this.state.stats.mean).toFixed(1)}%</p>
        <h4>CTR by product property</h4>
        <ol>
        {this.state.analytics && this.state.analytics[0].hits.filter(x => x.lift.toFixed(2) != 1 && (x.related["product.name"] || x.related["product.tags"])).map(a => {
          if (a.related["product.name"]) {
            return <li>{a.lift.toFixed(2)}x title:{a.related["product.name"]["$has"]}</li>
          } else {
            return <li>{a.lift.toFixed(2)}x tag:{a.related["product.tags"]["$has"]}</li>
          }
        })}
        </ol>
        <h4>Puchase % by Customer Segment </h4>
        <ol>
        {this.state.analytics && this.state.analytics[1].hits.map(a => {
          return <li>{a.lift.toFixed(2)}x {a.related["user.tags"]["$has"]}</li>
        })}
        </ol>
        <h4>Shopping basket</h4>
        <ol>
        {this.state.analytics && this.state.analytics[2].hits.filter(x => x.related["purchases"]["$has"] != this.state.details.id).map(a => {
          return <li>{a.lift.toFixed(2)}x {this.productDetails(a.related["purchases"]["$has"])["name"]}</li>
        })}
        </ol>
        <h4>Query word frequencies</h4>
        <ol>
        {this.state.analytics && this.state.analytics[3].hits.filter((x) => x.$score > 0 && x.$value).map(a => {
          return <li>{a.$score}x {a.$value}</li>
        })}
        </ol>
      </div>
    )
  }
}

export default ProductPage
