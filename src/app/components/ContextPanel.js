import React, { Component } from 'react'
import { FaChevronRight, FaBook, FaExternalLinkAlt, FaGithub, FaTimes } from 'react-icons/fa'
import { trackEvent } from '../../analytics'
import { CONTEXT_PANEL_CONTENT, DEFAULT_CONTEXT } from '../constants/contextPanelContent'
import aitoLogo from '../assets/aito-logo-theme.svg'
import aitoFavicon from '../assets/aito-favicon.svg'

import './ContextPanel.css'

const STATS = [
  { value: '0.92', label: 'Confidence' },
  { value: '20-50ms', label: 'Response' },
  { value: '90K+', label: 'Records' },
  { value: 'Zero', label: 'Training' },
]

class ContextPanel extends Component {
  constructor(props) {
    super(props)
    const stored = localStorage.getItem('contextPanelExpanded')
    this.state = {
      expanded: stored === null ? true : stored === 'true',
      mobileSheetOpen: false,
    }
  }

  componentDidMount() {
    this.updateBodyClass()
  }

  componentDidUpdate(_, prevState) {
    if (prevState.expanded !== this.state.expanded) {
      this.updateBodyClass()
    }
  }

  updateBodyClass() {
    if (this.state.expanded) {
      document.body.classList.add('contextpanel-expanded')
    } else {
      document.body.classList.remove('contextpanel-expanded')
    }
  }

  togglePanel = () => {
    const expanded = !this.state.expanded
    this.setState({ expanded })
    localStorage.setItem('contextPanelExpanded', String(expanded))
    trackEvent('demo_context_panel_toggled', {
      expanded,
      page: this.props.urlPath,
    })
  }

  toggleMobileSheet = () => {
    const open = !this.state.mobileSheetOpen
    this.setState({ mobileSheetOpen: open })
    trackEvent('demo_context_panel_toggled', {
      expanded: open,
      page: this.props.urlPath,
      device: 'mobile',
    })
  }

  getContent() {
    const urlPath = this.props.urlPath || '/'
    // Normalize empty string to '/' (App.js trims trailing slashes)
    const key = urlPath === '' ? '/' : urlPath
    if (CONTEXT_PANEL_CONTENT[key]) {
      return CONTEXT_PANEL_CONTENT[key]
    }
    // Handle dynamic routes like /product/milk
    const segments = key.split('/').filter(Boolean)
    if (segments.length > 0) {
      const prefix = '/' + segments[0]
      if (CONTEXT_PANEL_CONTENT[prefix]) {
        return CONTEXT_PANEL_CONTENT[prefix]
      }
    }
    return DEFAULT_CONTEXT
  }

  onSignupClick = () => {
    trackEvent('demo_signup_cta_clicked', {
      location: 'context_panel',
      page: this.props.urlPath,
    })
  }

  renderPanelContent(content) {
    return (
      <>
        <div className="ContextPanel__logoHeader">
          <img className="ContextPanel__logo" src={aitoLogo} alt="Aito.ai" />
          <span className="ContextPanel__logoTagline">The Predictive DB</span>
        </div>

        <div className="ContextPanel__stats">
          {STATS.map((stat) => (
            <div key={stat.label} className="ContextPanel__stat">
              <span className="ContextPanel__statValue">{stat.value}</span>
              <span className="ContextPanel__statLabel">{stat.label}</span>
            </div>
          ))}
        </div>

        <div className="ContextPanel__content">
          <h3 className="ContextPanel__title">{content.title}</h3>
          <p className="ContextPanel__description">{content.description}</p>

          {content.endpoints.length > 0 && (
            <div className="ContextPanel__endpoints">
              {content.endpoints.map((ep) => (
                <span key={ep} className="ContextPanel__badge">{ep}</span>
              ))}
            </div>
          )}

          {content.exampleQuery && (
            <div className="ContextPanel__querySection">
              <h4 className="ContextPanel__sectionLabel">Example Query</h4>
              <pre className="ContextPanel__codeBlock">
                <code>{content.exampleQuery}</code>
              </pre>
            </div>
          )}

          {content.links.useCases && content.links.useCases.length > 0 && (
            <div className="ContextPanel__links">
              <h4 className="ContextPanel__sectionLabel">Learn More</h4>
              {content.links.useCases.map((uc, i) => (
                <a
                  key={i}
                  href={uc.url}
                  className="ContextPanel__link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaExternalLinkAlt /> {uc.name}
                </a>
              ))}
            </div>
          )}

          <div className="ContextPanel__links">
            <h4 className="ContextPanel__sectionLabel">Resources</h4>
            {content.links.workbook && (
              <a
                href={content.links.workbook}
                className="ContextPanel__link"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaBook /> Workbook
              </a>
            )}
            {content.links.apiDocs && (
              <a
                href={content.links.apiDocs}
                className="ContextPanel__link"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaExternalLinkAlt /> API Docs
              </a>
            )}
            {content.links.sourceFiles && content.links.sourceFiles.map((file, i) => (
              <a
                key={i}
                href={file.url}
                className="ContextPanel__link"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaGithub /> {file.name}
              </a>
            ))}
          </div>
        </div>

        <div className="ContextPanel__cta">
          <a
            href="https://console.aito.ai/account/authentication/?signUp=true"
            className="ContextPanel__ctaLink"
            target="_blank"
            rel="noopener noreferrer"
            onClick={this.onSignupClick}
          >
            Start free trial <span>&rarr;</span>
          </a>
        </div>
      </>
    )
  }

  render() {
    const { expanded, mobileSheetOpen } = this.state
    const content = this.getContent()

    return (
      <>
        {/* Desktop: side toggle tab */}
        <button
          className="ContextPanel__toggle"
          onClick={this.togglePanel}
          aria-label={expanded ? 'Close info panel' : 'Open info panel'}
          title={expanded ? 'Close info panel' : 'Open info panel'}
        >
          {expanded ? <FaChevronRight /> : <img className="ContextPanel__toggleIcon" src={aitoFavicon} alt="Aito.ai" />}
        </button>

        {/* Desktop: right panel */}
        <aside className={`ContextPanel ${expanded ? 'ContextPanel--expanded' : ''}`}>
          {this.renderPanelContent(content)}
        </aside>

        {/* Mobile: floating info button */}
        <button
          className="ContextPanel__mobileToggle"
          onClick={this.toggleMobileSheet}
          aria-label="View page info"
          title="View page info"
        >
          <img className="ContextPanel__mobileToggleIcon" src={aitoFavicon} alt="Aito.ai" />
        </button>

        {/* Mobile: bottom sheet overlay */}
        {mobileSheetOpen && (
          <div className="ContextPanel__mobileOverlay" onClick={this.toggleMobileSheet} />
        )}

        {/* Mobile: bottom sheet */}
        <div className={`ContextPanel__mobileSheet ${mobileSheetOpen ? 'ContextPanel__mobileSheet--open' : ''}`}>
          <div className="ContextPanel__mobileSheetHeader">
            <h3 className="ContextPanel__mobileSheetTitle">{content.title}</h3>
            <button
              className="ContextPanel__mobileSheetClose"
              onClick={this.toggleMobileSheet}
              aria-label="Close"
            >
              <FaTimes />
            </button>
          </div>
          <div className="ContextPanel__mobileSheetBody">
            {this.renderPanelContent(content)}
          </div>
        </div>
      </>
    )
  }
}

export default ContextPanel
