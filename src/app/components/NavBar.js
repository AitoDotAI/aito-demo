import React, { Component } from 'react'
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap'
import logoImage from '../assets/acme-logo.svg'
import { FaShoppingCart, FaUserCircle, FaBars, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
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

const MENU_SECTIONS = [
  {
    header: 'Customer Experience',
    emoji: '\u{1F465}',
    items: [
      { label: 'Store', path: '/' },
      { label: 'Customer Assistant', path: '/customer-chat' },
      { label: 'Help', path: '/help' },
    ],
  },
  {
    header: 'Analytics',
    emoji: '\u{1F4CA}',
    items: [
      { label: 'Product Analytics', path: '/product' },
      { label: 'Preference Analytics', path: '/analytics' },
      { label: 'Price-Demand Analytics', path: '/pricing' },
    ],
  },
  {
    header: 'Assistance',
    emoji: '\u{1F91D}',
    items: [
      { label: 'Invoice Processing', path: '/invoicing' },
      { label: 'Product Catalog', path: '/admin' },
      { label: 'Employee Assistant', path: '/admin-chat' },
    ],
  },
  {
    header: 'Automation',
    emoji: '\u{2699}\u{FE0F}',
    items: [
      { label: 'Model Quality', path: '/evaluation' },
    ],
  },
]

class NavBar extends Component {
  constructor(props) {
    super(props)

    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true'

    this.state = {
      dropdownOpen: false,
      mobileMenuOpen: false,
      sidebarCollapsed,
    }
  }

  componentDidMount() {
    this.updateBodyClass()
  }

  componentDidUpdate(_, prevState) {
    if (prevState.sidebarCollapsed !== this.state.sidebarCollapsed) {
      this.updateBodyClass()
    }
  }

  updateBodyClass() {
    if (this.state.sidebarCollapsed) {
      document.body.classList.add('sidebar-collapsed')
    } else {
      document.body.classList.remove('sidebar-collapsed')
    }
  }

  toggle = () => {
    this.setState({ dropdownOpen: !this.state.dropdownOpen })
  }

  toggleMobileMenu = () => {
    this.setState({ mobileMenuOpen: !this.state.mobileMenuOpen })
  }

  toggleSidebar = () => {
    const collapsed = !this.state.sidebarCollapsed
    this.setState({ sidebarCollapsed: collapsed })
    localStorage.setItem('sidebarCollapsed', String(collapsed))
  }

  onUserSelected = (userId) => {
    this.props.onUserSelected(userId)
    this.props.actions.setPage('/')
  }

  onMenuItemClick = (page) => {
    this.props.actions.setPage(page)
    this.setState({ mobileMenuOpen: false })
  }

  isActive = (path) => {
    const current = this.props.state.urlPath || '/'
    if (path === '/') return current === '/' || current === ''
    return current === path || current.startsWith(path + '/')
  }

  renderMenuItems(forMobile) {
    return MENU_SECTIONS.map((section, sIdx) => (
      <div key={sIdx} className="NavBar__section">
        <div className="NavBar__sectionHeader">
          <span className="NavBar__sectionEmoji">{section.emoji}</span>
          {!this.state.sidebarCollapsed || forMobile ? (
            <span className="NavBar__sectionLabel">{section.header}</span>
          ) : null}
        </div>
        {section.items.map((item) => (
          <button
            key={item.path}
            className={`NavBar__menuItem ${this.isActive(item.path) ? 'NavBar__menuItem--active' : ''}`}
            onClick={() => this.onMenuItemClick(item.path)}
          >
            {!this.state.sidebarCollapsed || forMobile ? item.label : item.label.charAt(0)}
          </button>
        ))}
      </div>
    ))
  }

  render() {
    const { props } = this
    const { sidebarCollapsed } = this.state
    const urlPath = props.state.urlPath || '/'
    const showCartControls = urlPath === '/' || urlPath === '' || urlPath === '/customer-chat' || urlPath === '/cart'

    return (
      <>
        {/* Desktop sidebar */}
        <aside className={`NavBar__sidebar ${sidebarCollapsed ? 'NavBar__sidebar--collapsed' : ''}`}>
          <div className="NavBar__sidebarTop">
            <div className="NavBar__logoRow">
              {!sidebarCollapsed && (
                <img
                  className="NavBar__logo"
                  src={logoImage}
                  alt=""
                  onClick={() => props.actions.setPage('/')}
                />
              )}
              <button
                className="NavBar__collapseBtn"
                onClick={this.toggleSidebar}
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
              </button>
            </div>
            <nav className="NavBar__sidebarNav">
              {this.renderMenuItems(false)}
            </nav>
          </div>
        </aside>

        {/* Mobile top bar */}
        <nav className="NavBar__mobile">
          <div className="NavBar__mobileLeft">
            <button className="NavBar__hamburger" onClick={this.toggleMobileMenu}>
              <FaBars />
            </button>
            <img
              className="NavBar__logo"
              src={logoImage}
              alt=""
              onClick={() => props.actions.setPage('/')}
            />
          </div>
          {showCartControls && (
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
          )}
        </nav>

        {/* Mobile slide-out menu */}
        {this.state.mobileMenuOpen && (
          <div className="NavBar__mobileOverlay" onClick={this.toggleMobileMenu} />
        )}
        <div className={`NavBar__mobileDrawer ${this.state.mobileMenuOpen ? 'NavBar__mobileDrawer--open' : ''}`}>
          <div className="NavBar__mobileDrawerContent">
            {this.renderMenuItems(true)}
          </div>
        </div>

        {/* Desktop top bar (user/cart controls only) */}
        {showCartControls && (
          <div className="NavBar__desktopTopBar">
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
          </div>
        )}
      </>
    )
  }
}

export default NavBar
