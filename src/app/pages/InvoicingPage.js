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
  DropdownItem
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
      }
    }

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
    
    const output = Object.entries(this.state.output).map(([field, hits]) => {
      var name = field
      if (hits.length > 0 && hits[0].$p >= 0.5) {
        name = this.hitValueAndName(hits[0])[1]
      }
      return <div>
        <h4>{field}:</h4>
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
