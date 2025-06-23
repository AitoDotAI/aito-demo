import React, { Component } from 'react'
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap'
import logoImage from '../assets/acme-logo.svg'
import { FaShoppingCart, FaUserCircle, FaBars } from 'react-icons/fa'

import './NavBar.css'

// XXX: Hard-coded to UI-side
function getUserName(userId) {
  switch (userId) {
    case 'veronica':
      return 'Vegetarian Veronica'
    case 'larry':
      return 'Lactose-free Larry'
    case 'alice':
      return 'All-goes Alice'
    case null:
        return 'Unknown user'
    default:
      throw new Error(`Unknown user id: ${userId}`)
  }
}

class NavBar extends Component {
  constructor(props) {
    super(props)

    this.state = {
      dropdownOpen: false,
      menuOpen: false,
    }
  }

  toggle = () => {
    this.setState({ dropdownOpen: !this.state.dropdownOpen })
  }

  toggleMenu = () => {
    this.setState({ menuOpen: !this.state.menuOpen })
  }

  onUserSelected = (userId) => {
    this.props.onUserSelected(userId)
    this.props.actions.setPage('/')
  }

  onMenuItemClick = (page) => {
    this.props.actions.setPage(page)
    this.setState({ menuOpen: false })
  }

  render() {
    const { props } = this

    return (
      <nav className="NavBar">
        <div className="NavBar__left">
          <Dropdown isOpen={this.state.menuOpen} toggle={this.toggleMenu}>
            <DropdownToggle className="NavBar__hamburger" tag="button">
              <FaBars />
            </DropdownToggle>
            <DropdownMenu>
              <DropdownItem onClick={() => this.onMenuItemClick('/')}>Grocery Store</DropdownItem>
              <DropdownItem onClick={() => this.onMenuItemClick('/customer-chat')}>Shopping Assistant</DropdownItem>
              <DropdownItem onClick={() => this.onMenuItemClick('/help')}>Help</DropdownItem>
              <DropdownItem divider />
              <DropdownItem onClick={() => this.onMenuItemClick('/admin')}>Admin View</DropdownItem>
              <DropdownItem onClick={() => this.onMenuItemClick('/admin-chat')}>Admin Assistant</DropdownItem>
              <DropdownItem onClick={() => this.onMenuItemClick('/product')}>Products</DropdownItem>
              <DropdownItem onClick={() => this.onMenuItemClick('/analytics')}>Analytics</DropdownItem>
              <DropdownItem onClick={() => this.onMenuItemClick('/invoicing')}>Invoicing</DropdownItem>
            </DropdownMenu>
          </Dropdown>
          
          <img
            className="NavBar__logo"
            src={logoImage}
            alt=""
            onClick={() => props.actions.setPage('/')}
          />
        </div>

        <ol className="NavBar__links">
          <li className="NavBar__profile-link">
            <Dropdown isOpen={this.state.dropdownOpen} toggle={this.toggle}>
              <DropdownToggle tag="a">
                <FaUserCircle />
                <span className="NavBar__profile-link-name">
                  {getUserName(this.props.selectedUserId).split(' ')[1]}
                </span>
              </DropdownToggle>
              <DropdownMenu right>
                <DropdownItem onClick={() => this.onUserSelected('larry')}>{getUserName('larry')}</DropdownItem>
                <DropdownItem onClick={() => this.onUserSelected('veronica')}>{getUserName('veronica')}</DropdownItem>
                <DropdownItem onClick={() => this.onUserSelected('alice')}>{getUserName('alice')}</DropdownItem>
                <DropdownItem onClick={() => this.onUserSelected(null)}>Unknown user</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </li>
          <li className="NavBar__cart-link" onClick={() => props.actions.setPage('/cart')}>
            <FaShoppingCart />
            <span className="NavBar__cart-link-text">
              {props.cart.length}
              {' '}
              ITEMS
            </span>
          </li>
      </ol>
      </nav>
    )
  }
}

export default NavBar
