import React, { Component } from 'react'
import _ from 'lodash'
import { FaTrashAlt } from 'react-icons/fa'
import ProductList from './ProductList'

import './Cart.css'

/**
 * Shopping cart component that displays items added to cart
 * Allows users to view their selected products and remove items
 */
class Cart extends Component {
  /**
   * Handles removal of items from shopping cart
   * @param {number} itemIndex - Index of the item to remove from cart
   */
  onItemRemovedFromCart = (itemIndex) => {
    const product = this.props.cart[itemIndex]
    this.props.actions.removeItemFromCart(product.id)
  }

  render() {
    const { props } = this

    // Transform cart items to include delete action button
    const items = _.map(props.cart, item => _.merge({}, item, {
      actionElement: <FaTrashAlt />,
      onActionClick: this.onItemRemovedFromCart,
    }))

    return (
      <div className="Cart">
        <h4>Shopping cart</h4>

        <ProductList
          currentCart={props.cart}
          emptyText="No products in cart"
          items={items}
          onItemActionClick={this.onItemRemovedFromCart}
        />
      </div>
    )
  }
}

export default Cart
