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

import './AnalyticsPage.css'

class AnalyticsPage extends Component {
  constructor(props) {
    super(props)

    this.state = {
      modalOpen: false,
      field: 'user.tags',
      value: 'female', 
      results: [],
      dropDownOpen: false
    }

    this.debouncedFetchResults = _.debounce(this.fetchResults, 300).bind(this)
    this.debouncedFetchResults()
  }

  setField = (val) => {
    this.setState({
      field: val,
      dropDownOpen: false,
      value: this.getDefaultFieldValue(val)
    })

    if (!val) {
      this.setState({ field: null })
    } else {
      this.debouncedFetchResults()
    }
  }

  onValueChange = (e) => {
    const val = e.target.value

    this.setState({
      value: val
    })

    if (!val) {
      this.setState({ value: null })
    } else {
      this.debouncedFetchResults()
    }
  }

  fetchResults() {
    return this.props.dataFetchers.relate(this.state.field, this.state.value)
      .then(results => {
        console.log("results: " + results)
        this.setState({ results })
      })
      .catch(err => this.props.actions.showError(err))
  }

  toggleDropDown = () => {
    this.setState({dropDownOpen: !this.state.dropDownOpen})
  }

  getFieldName = (fieldName) => {
    switch (fieldName) {
      case 'user.id':
        return 'User id'
      case 'user.tags':
        return 'User tag'
      case 'weekday':
        return 'Weekday'
      default:
        throw new Error(`Unknown field id: ${fieldName}`)
    }
  }

  getDefaultFieldValue = (fieldName) => {
    switch (fieldName) {
      case 'user.id':
        return 'veronica'
      case 'user.tags':
        return 'club-member'
      case 'weekday':
        return 'Saturday'
      default:
        throw new Error(`Unknown field id: ${fieldName}`)
    }
  }

  render() {
    const items = _.map(this.state.results, item => {
      const hit = item["value"]
      return <li>{item["lift"].toFixed(1)}x {hit}</li>
    })

    return (
      <div className="FaqPage">
        <h4>Field:</h4>
        <Dropdown className="DropDown" isOpen={this.state.dropDownOpen} toggle={this.toggleDropDown}>
          <DropdownToggle caret>{this.getFieldName(this.state.field)}</DropdownToggle>
          <DropdownMenu>
            <DropdownItem onClick={() => this.setField('user.tags')}>User tag</DropdownItem>
            <DropdownItem onClick={() => this.setField('user.id')}>User id</DropdownItem>
            <DropdownItem onClick={() => this.setField('weekday')}>Weekday</DropdownItem>
          </DropdownMenu>
        </Dropdown>
        <h4>Value:</h4>
        <Form>
          <FormGroup>
            <Input
              value={this.state.value}
              onChange={this.onValueChange}
              type="text"
              name="value"
              id="value"
              placeholder="Value"
            />
          </FormGroup>
        </Form>
        <h4>Preference:</h4>
        <ul>{items}</ul>
        </div>
    )
  }
}

export default AnalyticsPage
