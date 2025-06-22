import React, { Component } from 'react'
import {
  CSSTransition,
  TransitionGroup,
} from 'react-transition-group';
import _ from 'lodash'
import { FaPlusCircle, FaTrashAlt, FaShoppingCart, FaPlus } from 'react-icons/fa'
import ProductListItem from './ProductListItem'

import './ProductList.css'

const CartPlusIcon = () => (
  <div style={{ position: 'relative', display: 'inline-block' }}>
    <FaShoppingCart style={{ color: '#FF6B35', fontSize: '1.2em' }} />
    <FaPlus style={{ 
      position: 'absolute', 
      top: '-2px', 
      right: '-2px', 
      color: '#FF6B35', 
      fontSize: '0.6em',
      backgroundColor: 'white',
      borderRadius: '50%',
      padding: '1px'
    }} />
  </div>
)

class ProductList extends Component {
  render() {
    const { props } = this

    const items = _.map(props.items, item => {
      const isItemInCart = _.findIndex(props.currentCart, cartItem => cartItem.id === item.id) !== -1
      const actionElement = isItemInCart ? <FaTrashAlt /> : <CartPlusIcon />
      const onActionClick = isItemInCart ? props.onItemRemovedFromCart : props.onItemAddedToCart
      const color = isItemInCart ? 'red' : 'green'
      return _.merge({}, item, { actionElement, onActionClick, color })
    })

    return (
      <ol className="ProductList">
        {
          items.length === 0 ? <span className="ProductList__empty">{this.props.emptyText}</span> : (
            items.map((item, index) => {
              return (
                <ProductListItem
                  key={item.reactId || item.id}
                  color={item.color}
                  item={item}
                  actionElement={item.actionElement}
                  onActionClick={() => item.onActionClick(index)}
                />
              )
            })
          )
        }
      </ol>
    )
  }
}

export default ProductList
