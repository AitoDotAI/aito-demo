import React, { useState } from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap'
import { FaQuestionCircle, FaExternalLinkAlt } from 'react-icons/fa'

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
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = () => setIsOpen(!isOpen)

  const openUseCase = () => {
    if (useCaseLink) {
      window.open(useCaseLink, '_blank')
    }
  }

  return (
    <>
      <Button
        color="link"
        size={size}
        className={`p-0 ml-2 ${className}`}
        onClick={toggle}
        title={`Learn more about ${feature}`}
        style={{ 
          fontSize: size === 'sm' ? '1.1rem' : '1.3rem',
          verticalAlign: 'middle',
          lineHeight: 1,
          color: '#FF6B35',
          position: 'relative',
          top: '-0.1rem'
        }}
      >
        <FaQuestionCircle />
      </Button>

      <Modal isOpen={isOpen} toggle={toggle} size="lg">
        <ModalHeader toggle={toggle}>
          {title || `${feature} - How it works`}
        </ModalHeader>
        <ModalBody>
          <div className="mb-3">
            <h6 className="text-primary">Overview</h6>
            <p>{description}</p>
          </div>
          
          {technicalDetails && (
            <div className="mb-3">
              <h6 className="text-primary">Technical Implementation</h6>
              <div className="bg-light p-3 rounded">
                <small className="text-muted">{technicalDetails}</small>
              </div>
            </div>
          )}
          
          <div className="mb-3">
            <h6 className="text-primary">Key Benefits</h6>
            <ul className="small">
              {feature === 'Smart Search' && (
                <>
                  <li>Personalized results based on user behavior</li>
                  <li>85% user satisfaction on result quality</li>
                  <li>40% improvement over basic search</li>
                </>
              )}
              {feature === 'Recommendations' && (
                <>
                  <li>Dynamic suggestions that exclude cart items</li>
                  <li>35% click-through rate vs 12% industry average</li>
                  <li>22% increase in average order value</li>
                </>
              )}
              {feature === 'Tag Prediction' && (
                <>
                  <li>Automatic product categorization</li>
                  <li>80% faster than manual catalog management</li>
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
        <ModalFooter>
          {useCaseLink && (
            <Button color="primary" onClick={openUseCase}>
              <FaExternalLinkAlt className="mr-2" />
              View Detailed Use Case
            </Button>
          )}
          <Button color="secondary" onClick={toggle}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}

export default HelpButton