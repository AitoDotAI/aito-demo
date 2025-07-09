import React, { Component } from 'react'
import ProductSearch from '../components/ProductSearch'
import RecommendedProducts from '../components/RecommendedProducts'
import ChatWidget from '../components/ChatWidget'
import HeroSection from '../components/HeroSection'

import './LandingPage.css'

class LandingPage extends Component {
  handleCartOperation = async (toolName, parameters) => {
    const { actions, dataFetchers, selectedUserId, appState } = this.props;
    const currentCart = appState.cart || [];
    
    try {
      if (toolName === 'add_to_cart') {
        const { productId, productName } = parameters;
        
        if (!productId && !productName) {
          return {
            success: false,
            message: 'Please provide either a product ID or product name.'
          };
        }
        
        let product = null;
        if (productId) {
          const products = await dataFetchers.getProductsByIds([productId]);
          product = products[0];
        } else if (productName) {
          const searchResults = await dataFetchers.getProductSearchResults(productName);
          product = searchResults.find(p => 
            p.name.toLowerCase().includes(productName.toLowerCase())
          );
        }
        
        if (!product) {
          return {
            success: false,
            message: `Sorry, I couldn't find ${productId ? `product ID ${productId}` : `"${productName}"`}.`
          };
        }
        
        const isInCart = currentCart.some(item => item.id === product.id);
        if (isInCart) {
          return {
            success: false,
            message: `${product.name} is already in your cart.`
          };
        }
        
        actions.addItemToCart(product);
        
        return {
          success: true,
          product: product,
          message: `Added ${product.name} ($${product.price}) to your cart!`
        };
        
      } else if (toolName === 'remove_from_cart') {
        const { productId, productName } = parameters;
        
        if (!productId && !productName) {
          return {
            success: false,
            message: 'Please provide either a product ID or product name.'
          };
        }
        
        let productToRemove = null;
        if (productId) {
          productToRemove = currentCart.find(item => item.id === productId);
        } else if (productName) {
          productToRemove = currentCart.find(item => 
            item.name.toLowerCase().includes(productName.toLowerCase())
          );
        }
        
        if (!productToRemove) {
          return {
            success: false,
            message: `Sorry, I couldn't find ${productId ? `product ID ${productId}` : `"${productName}"`} in your cart.`
          };
        }
        
        actions.removeItemFromCart(productToRemove.id);
        
        return {
          success: true,
          product: productToRemove,
          message: `Removed ${productToRemove.name} from your cart.`
        };
      }
    } catch (error) {
      console.error('Cart operation error:', error);
      return {
        success: false,
        message: `Sorry, I couldn't ${toolName === 'add_to_cart' ? 'add the item to' : 'remove the item from'} your cart right now.`
      };
    }
  };

  render() {
    return (
      <div className="LandingPage">
        <HeroSection />
        
        <ProductSearch
          selectedUserId={this.props.selectedUserId}
          cart={this.props.appState.cart}
          actions={this.props.actions}
          dataFetchers={this.props.dataFetchers}
        />

        <RecommendedProducts
          selectedUserId={this.props.selectedUserId}
          cart={this.props.appState.cart}
          actions={this.props.actions}
          dataFetchers={this.props.dataFetchers}
        />

        <ChatWidget
          userId={this.props.selectedUserId}
          currentCart={this.props.appState.cart || []}
          dataFetchers={this.props.dataFetchers}
          onCartOperation={this.handleCartOperation}
        />
      </div>
    )
  }
}

export default LandingPage
