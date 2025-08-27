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
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Tooltip
} from 'reactstrap'
import HelpButton from '../components/HelpButton'
import { HELP_CONTENT } from '../constants/helpContent'

import { invoiceEvaluationData } from '../data/data'

import './InvoicingPage.css'

const FIELD_LABELS = {
  'InvoiceID': 'Invoice ID',
  'SenderName': 'Sender Name',
  'ProductName': 'Product Name',
  'AccountNumber': 'Account Number',
  'Description': 'Description',
  'Processor': 'Processor',
  'Acceptor': 'Acceptor',
  'GLCode': 'GL Code'
}

class InvoicingPage extends Component {
  constructor(props) {
    super(props)

    this.state = {
      input: {
        "InvoiceID": "",
        "SenderName": "",
        "ProductName": "",
        "AccountNumber": "",
        "Description": ""
      },
      output: {
        "Processor": [],
        "Acceptor": [],
        "GLCode": []
      },
      dropDownOpen: {
        "Processor": false,
        "Acceptor": false,
        "GLCode": false
      },
      dropDownHelp: {
        "Processor": null,
        "Acceptor": null,
        "GLCode": null
      },
      highlightedInputs: new Set()
    }

    this.toggleTooltip = this.toggleTooltip.bind(this);
    this.debouncedFetchResults = _.debounce(this.fetchResults, 300).bind(this)
    this.debouncedFetchResults()
  }


  setOutput = (field, value) => {
    const output = this.state.output
    output[field] = [{
      $p: 1,
      feature: value
    }] 
    const dropDownOpen = this.state.dropDownOpen
    dropDownOpen[output] = false

    this.setState({
      output,
      dropDownOpen
    })
  }

  onInputChange = (field, e) => {
    const input = this.state.input
    input[field] = e.target.value 

    this.setState({input})

    this.debouncedFetchResults()
  }

  fetchResults() {
    const keys = Object.keys(this.state.output)
    return this.props.dataFetchers.predictInvoice(this.state.input, keys)
      .then(results => {
        var output = {}
        for (var i = 0; i < keys.length; i++) {
          output[keys[i]] = results[i]
        }

        this.setState({ output })
      })
      .catch(err => this.props.actions.showError(err))
  }

  next = () => {
    const selected = invoiceEvaluationData[Math.floor(Math.random() * invoiceEvaluationData.length)]
    const input = {}
    for (var key in this.state.input) {
      input[key] = selected[key]
    }

    this.setState({input})

    this.debouncedFetchResults()
  }

  toggleDropDown = (output) => {
    const dropDownOpen = this.state.dropDownOpen
    dropDownOpen[output] = !dropDownOpen[output]
    this.setState({dropDownOpen})
  }
  
  hitValueAndName = (hit) => {
    var value = hit["Name"]
    if (value == null) {
     value = hit.feature
    }
    var name = value
    if (hit["Role"] != null) {
      name += ` (${hit["Role"]})`
    }

    return [value, name]
  }

  toggleTooltip = (output) => {
    const dropDownHelp = { ...this.state.dropDownHelp }
    const isOpening = !dropDownHelp[output]
    dropDownHelp[output] = isOpening
    
    // Handle input highlighting - always start fresh
    let highlightedInputs = new Set()
    
    if (isOpening) {
      // Extract highlights from the prediction
      const hits = this.state.output[output]
      if (hits && hits.length > 0 && hits[0].$p >= 0.5 && hits[0].$why) {
        const factors = hits[0].$why.factors || []
        
        // Collect all fields that have highlights
        factors.forEach(factor => {
          if (factor.highlight && Array.isArray(factor.highlight) && factor.highlight.length > 0) {
            factor.highlight.forEach(h => {
              if (h.field) {
                // Extract field name from $context.FieldName format
                const fieldMatch = h.field.match(/\$context\.(\w+)/)
                if (fieldMatch && fieldMatch[1]) {
                  const fieldName = fieldMatch[1]
                  // Add this field to highlighted inputs
                  highlightedInputs.add(fieldName)
                }
              }
            })
          }
        })
      }
    }
    
    this.setState({ dropDownHelp, highlightedInputs })
  }

  render() {
    const input = Object.entries(this.state.input).map(([field, value]) => 
      <div key={field} className="form-field">
        <Label className="form-field__label">{FIELD_LABELS[field] || field}</Label>
        <Input
          className={`form-field__input ${this.state.highlightedInputs.has(field) ? 'form-field__input--highlighted' : ''}`}
          value={value}
          onChange={(e) => this.onInputChange(field, e)}
          type="text"
          name={field}
          id={field}
          placeholder={`Enter ${(FIELD_LABELS[field] || field).toLowerCase()}`}
        />
      </div>
    )

    const propositionString = (proposition) => {
      const key = Object.keys(proposition)[0]
      if (key === "$and") {
        var value = proposition[key]
        return value.map(v => propositionString(v)).join(" and ")
      }
      if (key === "$not") {
        return `not ${propositionString(proposition[key])}`
      }
      value = proposition[key]["$has"]
      if (value !== undefined) {
        return `${key} has ${value}`
      }
      value = proposition[key]["$is"]
      if (value !== undefined) {
        return `${key} is ${value}`
      }
      return JSON.stringify(proposition)
    }
    
    const output = Object.entries(this.state.output).map(([field, hits]) => {
      var why = ""
      var topValue = field
      var p = undefined
      var factors = []
      if (hits.length > 0 && hits[0].$p >= 0.5) {
        var [, newTopValue] = this.hitValueAndName(hits[0])
        topValue = newTopValue
        why = hits[0].$why
        p = hits[0].$p
        factors = why["factors"].map((factor, index) => {
          const t = factor["type"]
          var value = factor["value"]
          var rv = null
          
          if (t === "baseP") {
            rv = (
              <div key={index} className="aito-factor base-probability">
                <div className="factor-header">
                  <span className="factor-label">Base Probability</span>
                  <span className="factor-value">{(value*100).toFixed(0)}%</span>
                </div>
                <div className="factor-description">
                  Historical rate for {topValue}
                </div>
              </div>
            )
          } else if (t === "product") {
            // Skip normalization - internal calculation
            return null
          } else if (t === "relatedPropositionLift") {
            var highlightElements = []
            
            if (factor["highlight"] && factor["highlight"].length > 0) {
              // Build the highlighted text with proper HTML rendering
              const highlightTexts = factor["highlight"].map((h, i) => {
                const fieldName = h["field"].substring(9) // Remove 'invoices.'
                return `${i > 0 ? ' and ' : ''}<span class="field-name">${fieldName}</span> is <mark>${h["highlight"]}</mark>`
              }).join('')
              
              highlightElements = <span dangerouslySetInnerHTML={{__html: highlightTexts}} />
            } else {
              // Fallback to proposition string if no highlights
              highlightElements = <span dangerouslySetInnerHTML={{__html: propositionString(factor["proposition"])}} />
            }
            
            rv = (
              <div key={index} className="aito-factor pattern-match">
                <div className="factor-header">
                  <span className="factor-label">Pattern Match</span>
                  <span className="factor-multiplier">× {value.toFixed(1)}</span>
                </div>
                <div className="factor-description">
                  When {highlightElements}
                </div>
              </div>
            )
          }
          return rv
        }).filter(Boolean)
        
        // Add calculation summary if we have factors
        if (factors.length > 0) {
          const baseP = why["factors"].find(f => f.type === "baseP")?.value || 0
          const lifts = why["factors"]
            .filter(f => f.type === "relatedPropositionLift")
            .map(f => f.value)
          
          factors.push(
            <div key="calculation" className="aito-calculation-summary">
              <span>{(baseP * 100).toFixed(0)}%</span>
              {lifts.map((lift, i) => (
                <span key={i}> × {lift.toFixed(1)}</span>
              ))}
              <span className="equals"> = </span>
              <span className="final-probability">{(p * 100).toFixed(0)}%</span>
            </div>
          )
        }
      }
      var tooltipName = "tooltip_" + field
      return <div key={field} className="prediction-item">
        <h4 className="prediction-item__title">{FIELD_LABELS[field] || field}</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--aito-spacing-md)' }}>
          <Dropdown isOpen={this.state.dropDownOpen[field]} toggle={(x) => this.toggleDropDown(field, x)}>
            <DropdownToggle caret>{topValue}</DropdownToggle>
            <DropdownMenu>
              {
                hits.filter(hit => hit.$p >= 0.1).map((hit, index) => {
                  var [value, name] = this.hitValueAndName(hit)
                  return <DropdownItem key={index} onClick={() => this.setOutput(field, value)}>{(100*hit.$p).toFixed(1)}% {name}</DropdownItem>
                })
              }
            </DropdownMenu>
          </Dropdown>
          <div 
            id={tooltipName} 
            onClick={() => this.toggleTooltip(field)}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#FF6B35',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            ?
          </div>
          <Tooltip
            autohide={false}
            flip={false}
            isOpen={this.state.dropDownHelp[field]}
            target={tooltipName}
            toggle={() => this.toggleTooltip(field)}
            placement="bottom-end"
            className="aito-explanation-tooltip"
          >
            <div className="aito-tooltip-content">
              <div className="aito-tooltip-header">
                <h4>Why {topValue}?</h4>
                <span className="confidence-badge">{(100*p).toFixed(0)}%</span>
              </div>
              
              <div className="aito-factors">
                {factors}
              </div>
            </div>
          </Tooltip>
        </div>
      </div>
    })

    return (
      <div className="InvoicingPage">
        <div className="InvoicingPage__header">
          <h1 className="InvoicingPage__title">
            Invoice Processing
            <HelpButton 
              feature="Invoice Processing"
              {...HELP_CONTENT['Invoice Processing']}
              size="md"
              className="ml-3"
            />
          </h1>
          <p className="InvoicingPage__subtitle">
            Automatically classify and route invoices using AI-powered predictions. Enter invoice details to see intelligent suggestions for processor assignment, approval routing, and GL code classification.
          </p>
        </div>
        
        <div className="InvoicingPage__actions">
          <button className="Button" onClick={this.next}>Load Sample Invoice</button>
        </div>

        <div className="InvoicingPage__content">
          <div className="InvoicingPage__input-section">
            <h3 className="InvoicingPage__section-title">Invoice Details</h3>
            {input}
          </div>
          
          <div className="InvoicingPage__output-section">
            <h3 className="InvoicingPage__section-title">AI Predictions</h3>
            {output}
          </div>
        </div>
      </div>
    )
  }
}

export default InvoicingPage
