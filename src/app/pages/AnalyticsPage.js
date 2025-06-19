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
    const hasResults = this.state.results.length > 0

    return (
      <div className="AnalyticsPage">
        <div className="AnalyticsPage__header">
          <h1 className="AnalyticsPage__title">Data Analytics</h1>
          <p className="AnalyticsPage__subtitle">
            Explore statistical relationships in your data using AI-powered correlation analysis. Select a field and value to discover related patterns and preferences.
          </p>
        </div>

        <div className="AnalyticsPage__info">
          <div className="AnalyticsPage__info-title">How it works</div>
          Choose a data field (like user tags, user ID, or weekday) and specify a value to analyze. The system will show you what other data points are statistically related to your selection, along with their correlation strength.
        </div>

        <div className="AnalyticsPage__controls">
          <h3 className="AnalyticsPage__controls-title">Analysis Parameters</h3>
          
          <div className="AnalyticsPage__control-row">
            <div className="AnalyticsPage__control-group">
              <label className="AnalyticsPage__control-label">Data Field</label>
              <Dropdown 
                isOpen={this.state.dropDownOpen} 
                toggle={this.toggleDropDown}
              >
                <DropdownToggle caret>
                  {this.getFieldName(this.state.field)}
                </DropdownToggle>
                <DropdownMenu>
                  <DropdownItem onClick={() => this.setField('user.tags')}>
                    User Tag
                  </DropdownItem>
                  <DropdownItem onClick={() => this.setField('user.id')}>
                    User ID
                  </DropdownItem>
                  <DropdownItem onClick={() => this.setField('weekday')}>
                    Weekday
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>

            <div className="AnalyticsPage__control-group">
              <label className="AnalyticsPage__control-label" htmlFor="value">
                Value to Analyze
              </label>
              <input
                className="AnalyticsPage__input"
                value={this.state.value}
                onChange={this.onValueChange}
                type="text"
                name="value"
                id="value"
                placeholder="Enter value to analyze"
              />
            </div>
          </div>
        </div>

        <div className="AnalyticsPage__results">
          <h3 className="AnalyticsPage__results-title">
            Statistical Relationships
          </h3>
          
          {hasResults ? (
            <ul className="AnalyticsPage__results-list">
              {_.map(this.state.results, (item, index) => {
                const lift = item["lift"]
                const value = item["value"]
                const isPositive = lift > 1
                const isNegative = lift < 1
                
                return (
                  <li key={index} className="AnalyticsPage__results-item">
                    <span className="AnalyticsPage__results-label">
                      {value}
                    </span>
                    <span className={`AnalyticsPage__results-value ${
                      isPositive ? 'AnalyticsPage__results-value--positive' : 
                      isNegative ? 'AnalyticsPage__results-value--negative' : ''
                    }`}>
                      {lift.toFixed(1)}x
                    </span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="AnalyticsPage__empty-state">
              Enter a field and value to see statistical relationships
            </div>
          )}
        </div>
      </div>
    )
  }
}

export default AnalyticsPage
