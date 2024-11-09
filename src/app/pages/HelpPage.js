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

import './HelpPage.css'

class HelpPage extends Component {
  constructor(props) {
    super(props)

    this.state = {
      modalOpen: false,
      question: '',
      answer: null
    }

    this.debouncedFetchAnswer = _.debounce(this.prompt, 300).bind(this)
  }

  onQuestionChange = (e) => {
    const val = e.target.value

    this.setState({
      question: val,
    })

    if (!val) {
      this.setState({ answer: null })
    } else {
      this.debouncedFetchAnswer(val)
    }
  }

  prompt(question) {
    return this.props.dataFetchers.prompt(question)
      .then(answer => {
        console.log("answer: " + answer)
        this.setState({ answer })
      })
      .catch(err => this.props.actions.showError(err))
  }

  render() {
    var match = this.state.answer
    var question = null
    var answer = ""

    var result = null

    if (match != null) {
      if (match.type == "question") {
        result = 
          <div>
            <h4>{match["prompt"]}</h4>
            {match["answer.answer"]}
          </div>
      } else if (match.type == "feedback") {
        result = 
          <div>
            <h4>Would you like to send feedback about this?</h4>
            <div>
              <h5 className="header">Text:</h5>
              {this.state.question}
              <h5 className="header">Sentiment:</h5>
              {match.sentiment}
              <h5 className="header">Category:</h5>
              {match.categories}
              { (match.tags != null) ? <div><h5 className="header">Tags:</h5>{match.tags}</div> : null }
            </div>
            <Button className="Button">Send feedback</Button>
          </div>
      } else if (match.type == "request") {
        result = 
          <div>
            <h3>Would you like to create a ticket about this?</h3>
            <div>
              <h5 className="header">Text:</h5>
              {this.state.question}
              <h5 className="header">Assignee</h5>
              {match.assignee}
              <h5 className="header">Category</h5>
              {match.categories}
              <h5 className="header">Urgency</h5>
              {match.urgency}
            </div>
            <Button className="Button">Create ticket</Button>
          </div>
      }
    }
    return (
      <div className="FaqPage">
        <h3>How can I help you?</h3>

        <Form>
          <FormGroup>
            <Input
              value={this.state.productNameInputValue}
              onChange={this.onQuestionChange}
              type="text"
              name="question"
              id="question"
              placeholder="Question"
            />
          </FormGroup>
        </Form>
        {result}
        </div>
    )
  }
}

export default HelpPage
