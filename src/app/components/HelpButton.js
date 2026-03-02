import React, { useState } from 'react'
import { Modal, ModalBody, ModalFooter, Button } from 'reactstrap'
import { FaExternalLinkAlt } from 'react-icons/fa'
import aitoFavicon from '../assets/aito-favicon.svg'
import aitoLogo from '../assets/aito-logo-theme.svg'

import './HelpButton.css'

/**
 * Contextual help button component that shows feature descriptions and links to use cases
 */
const HelpButton = ({
  feature,
  title,
  description,
  useCaseLink,
  technicalDetails = null,
  size = 'sm',
  className = '',
  invertColors = false
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = () => setIsOpen(!isOpen)

  const openUseCase = () => {
    if (useCaseLink) {
      window.open(useCaseLink, '_blank')
    }
  }

  const iconSize = size === 'sm' ? '1.4rem' : '1.7rem'

  return (
    <>
      <button
        className={`HelpButton__trigger ${invertColors ? 'HelpButton__trigger--inverted' : ''} ${className}`}
        onClick={toggle}
        title={`Learn more about ${feature}`}
        style={{ width: iconSize, height: iconSize }}
      >
        <img src={aitoFavicon} alt="Help" className="HelpButton__icon" />
      </button>

      <Modal isOpen={isOpen} toggle={toggle} size="lg" className="HelpButton__modal">
        <div className="HelpButton__logoHeader">
          <img className="HelpButton__logo" src={aitoLogo} alt="Aito.ai" />
          <button className="HelpButton__close" onClick={toggle} aria-label="Close">&times;</button>
        </div>
        <div className="HelpButton__header">
          <h5 className="HelpButton__title">{title || `${feature} - How it works`}</h5>
        </div>
        <ModalBody className="HelpButton__body">
          <div className="HelpButton__section">
            <h6 className="HelpButton__sectionLabel">Overview</h6>
            <p className="HelpButton__text">{description}</p>
          </div>

          {technicalDetails && (
            <div className="HelpButton__section">
              <h6 className="HelpButton__sectionLabel">Technical Implementation</h6>
              <div className="HelpButton__codeBlock">
                <small>{technicalDetails}</small>
              </div>
            </div>
          )}

          <div className="HelpButton__section">
            <h6 className="HelpButton__sectionLabel">Key Benefits</h6>
            <ul className="HelpButton__list">
              {feature === 'Smart Search' && (
                <>
                  <li>Personalized results based on user behavior</li>
                  <li>Significantly higher user satisfaction on result quality</li>
                  <li>Substantial improvement over basic keyword search</li>
                </>
              )}
              {feature === 'Recommendations' && (
                <>
                  <li>Dynamic suggestions that exclude cart items</li>
                  <li>High click-through rate significantly above industry average</li>
                  <li>Meaningful increase in average order value</li>
                </>
              )}
              {feature === 'Tag Prediction' && (
                <>
                  <li>Automatic product categorization</li>
                  <li>Significantly faster than manual catalog management</li>
                  <li>Consistent and accurate tagging</li>
                </>
              )}
              {feature === 'Autocomplete' && (
                <>
                  <li>Context-aware search suggestions</li>
                  <li>Faster search completion</li>
                  <li>Improved product discovery</li>
                </>
              )}
              {feature === 'Autofill' && (
                <>
                  <li>Predictive cart filling based on user patterns</li>
                  <li>Faster checkout process</li>
                  <li>Personalized shopping experience</li>
                </>
              )}
              {feature === 'NLP Processing' && (
                <>
                  <li>Automatic sentiment analysis</li>
                  <li>Intelligent text classification</li>
                  <li>No complex preprocessing required</li>
                </>
              )}
              {feature === 'Shopping Assistant' && (
                <>
                  <li>Natural language product search</li>
                  <li>Cart management through conversation</li>
                  <li>Personalized shopping guidance</li>
                </>
              )}
              {feature === 'Admin Assistant' && (
                <>
                  <li>Real-time business analytics</li>
                  <li>Natural language queries for metrics</li>
                  <li>Automated report generation</li>
                </>
              )}
            </ul>
          </div>
        </ModalBody>
        <ModalFooter className="HelpButton__footer">
          {useCaseLink && (
            <button className="HelpButton__ctaLink" onClick={openUseCase}>
              <FaExternalLinkAlt /> View Detailed Use Case
            </button>
          )}
          <Button color="secondary" onClick={toggle} size="sm">
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}

export default HelpButton
