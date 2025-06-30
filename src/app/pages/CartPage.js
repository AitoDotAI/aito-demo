import React, { Component } from 'react'
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from 'reactstrap';
import { FaChevronLeft } from 'react-icons/fa'
import Cart from '../components/Cart'
import HelpButton from '../components/HelpButton'
import { HELP_CONTENT } from '../constants/helpContent'

import './CartPage.css'

class CartPage extends Component {
  constructor(props) {
    super(props)

    this.state = {
      modalOpen: false,
    }
  }

  addProducts = (products) => {
    products.forEach(product => {
      this.props.actions.addItemToCart(product)
    })
  }

  setAutoFill = (ids) => {
    console.log("ids: " + ids)
    return this.props.dataFetchers.getProductsByIds(ids)
      .then(products => this.addProducts(products))
      .catch(err => this.props.actions.showError(err))
}

  autoFill = () => {
    return this.props.dataFetchers.getAutoFill()
      .then(autoFill => this.setAutoFill(autoFill))
      .catch(err => this.props.actions.showError(err))
  }

  toggleModal = () => {
    this.setState({
      modalOpen: !this.state.modalOpen,
    })
  }

  toggleFill = () => {
    this.setState({
      modalOpen: !this.state.modalOpen,
    })
  }

  onBackClick = (e) => {
    e.preventDefault()

    this.props.actions.setPage('/')
  }

  render() {
    const { cart } = this.props.appState

    return (
      <div className="CartPage">
        <a className="CartPage__back-link" href="/" onClick={this.onBackClick}>
          <FaChevronLeft />
          Back to products
        </a>

        <Cart actions={this.props.actions} cart={cart} />

        <div className="CartPage__actions">
          <div className="d-flex align-items-center">
            <Button color="primary" onClick={this.autoFill}>Autofill</Button>
            <HelpButton 
              feature="Autofill"
              {...HELP_CONTENT['Autofill']}
              size="sm"
              className="ml-2"
            />
          </div>
          <Button onClick={this.toggleModal} disabled={cart.length === 0} color="primary">Purchase</Button>
        </div>

        <Modal isOpen={this.state.modalOpen} toggle={this.toggleModal}>
          <ModalHeader toggle={this.toggleModal}>This is a demo</ModalHeader>
          <ModalBody>
            The purchase isn't really happening, since it's is out of the demo's scope.
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={this.toggleModal}>Ok</Button>
          </ModalFooter>
        </Modal>
      </div>
    )
  }
}

export default CartPage
