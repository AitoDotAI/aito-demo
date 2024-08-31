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

import './FaqPage.css'

class FaqPage extends Component {
  constructor(props) {
    super(props)

    this.state = {
      modalOpen: false,
      question: '',
      answer: null
    }

    this.debouncedFetchAnswer = _.debounce(this.fetchAnswer, 300).bind(this)
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

  fetchAnswer(question) {
    return this.props.dataFetchers.getAnswer(question)
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
    if (match != null) {
      question = <h4>{match["question"]}</h4>
      answer = match["answer.answer"]
    }
    return (
      <div className="FaqPage">
        <h3>Ask a question:</h3>

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
        {question}
        <p>{answer}</p>
        </div>
    )
  }
}

export default FaqPage
