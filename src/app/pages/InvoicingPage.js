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


import { invoiceEvaluationData } from '../data/data'

import './InvoicingPage.css'

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
      <div>
        <h4>{field}</h4>
        <Form>
          <FormGroup>
            <Input
              value={value}
              onChange={(value) => this.onInputChange(field, value)}
              type="text"
              name="value"
              id="value"
              placeholder="Value"
            />
          </FormGroup>
        </Form>

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
      var p = undefined
      var factors = []
      if (hits.length > 0 && hits[0].$p >= 0.5) {
        name = this.hitValueAndName(hits[0])[1]
        why = hits[0].$why
        p = hits[0].$p
        factors = why["factors"].map(factor => {
          const t = factor["type"]
          const value = factor["value"]
          var content = ""
          if (t == "baseP") {
            content = `Base probability ${(value*100).toFixed(0)}%`
          } else if (t == "hitPropositionLift") {
            const prop = propositionString(factor["proposition"])
            var factors2 = factor["factors"]
            var because = ""
            if (factors2) {
              because = factors2.map(f => propositionString(f["proposition"])).join(" and ")
            }
            content = `${(value).toFixed(2)}x for ${prop}, because ${because}`
          } else {
            content = JSON.stringify(factor)
          }
          return <li>{content}</li>
        })
      }
      var tooltipName = "tooltip_" + field
      return <div>
        <h4>{field}:</h4>
        <div className="dropdown-container">
          <Dropdown className="DropDown" isOpen={this.state.dropDownOpen[field]} toggle={(x) => this.toggleDropDown(field, x)}>
            <DropdownToggle caret>{name}</DropdownToggle>
            <DropdownMenu>
              {
                hits.filter(hit => hit.$p >= 0.1).map(hit => {
                  var [value, name] = this.hitValueAndName(hit)
                  return <DropdownItem onClick={() => this.setOutput(field, value)}>{(100*hit.$p).toFixed(1)}% {name}</DropdownItem>
                })
              }
            </DropdownMenu>
          </Dropdown>
          <Button id={tooltipName} onClick={() => this.toggleTooltip(field)} >?</Button>
          <Tooltip
            autohide={false}
            flip={false}
            isOpen={this.state.dropDownHelp[field]}
            target={tooltipName}
            toggle={() => this.toggleTooltip(field)}
          >
            <b>Why {(100*p).toFixed(0)}%?</b>
            <ul>
            {factors}
            </ul>
          </Tooltip>

        </div>
      </div>
    })

    return (
      <div className="InvoicingPage">
        <Button className="Button" onClick={this.next}>Next invoice</Button>
        {input}
        {output}
      </div>
    )
  }
}

export default InvoicingPage
