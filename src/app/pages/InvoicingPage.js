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
      }
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
    const dropDownHelp = this.state.dropDownHelp
    dropDownHelp[output] = !dropDownHelp[output]
    this.setState({dropDownHelp})
  }

  render() {
    const input = Object.entries(this.state.input).map(([field, value]) => 
      <div key={field} className="form-field">
        <Label className="form-field__label">{FIELD_LABELS[field] || field}</Label>
        <Input
          className="form-field__input"
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
      if (key == "$and") {
        value = proposition[key]
        return value.map(v => propositionString(v)).join(" and ")
      }
      if (key == "$not") {
        return `not ${propositionString(proposition[key])}`
      }
      var value = proposition[key]["$has"]
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
      var name = field
      var why = ""
      var topValue = field
      var p = undefined
      var factors = []
      if (hits.length > 0 && hits[0].$p >= 0.5) {
        [name, topValue] = this.hitValueAndName(hits[0])
        why = hits[0].$why
        p = hits[0].$p
        factors = why["factors"].map(factor => {
          const t = factor["type"]
          var value = factor["value"]
          var rv = null
          if (t == "baseP") {
            rv = <li>{(value*100).toFixed(0)}% for base probability</li>
          } else if (t == "product") {
            value = 1
            factor.factors.forEach(f => {
              value *= f.value
            })
            rv = <li>* {(value).toFixed(2)} for normalization</li>
          } else if (t == "relatedPropositionLift") {
            var prop = propositionString(factor["proposition"])
            var factors2 = factor["factors"]
            if (factors2) {
              prop = factors2.map(f => propositionString(f["proposition"])).join(" and ")
            }
            if (factor["highlight"]) {
              prop = factor["highlight"].map(h => h["field"].substring(9) + " is " + h["highlight"]).join(" and ")
            }

            rv = <li>* {(value).toFixed(2)} for <span dangerouslySetInnerHTML={{__html: prop}} /></li>
          } else {
            rv = <li>JSON.stringify(factor)</li>
          }
          return rv
        })
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
          >
            <b>Why {field} is {topValue} with {(100*p).toFixed(0)}% probability?</b>
            <ol>
            {factors}
            </ol>
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
