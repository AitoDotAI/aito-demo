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
} from 'reactstrap'

import './AnalyticsPage.css'

class AnalyticsPage extends Component {
  constructor(props) {
    super(props)

    this.state = {
      modalOpen: false,
      field: 'user.tags',
      value: 'female', 
      results: []
    }

    this.debouncedFetchResults = _.debounce(this.fetchResults, 300).bind(this)
    this.debouncedFetchResults()
  }

  onFieldChange = (e) => {
    const val = e.target.value

    this.setState({
      field: val,
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
      value: val,
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

  render() {
    const items = _.map(this.state.results, item => {
      const hit = item["value"]
      return <li>{item["lift"].toFixed(1)}x {hit}</li>
    })

    return (
      <div className="FaqPage">
        <h4>Field:</h4>
        <Form>
          <FormGroup>
            <Input
              value={this.state.field}
              onChange={this.onFieldChange}
              type="text"
              name="question"
              id="question"
              placeholder="Question"
            />
          </FormGroup>
        </Form>
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
        <h4>Relations:</h4>
        <ul>{items}</ul>
        </div>
    )
  }
}

export default AnalyticsPage
