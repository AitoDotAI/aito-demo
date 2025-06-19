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
          <div className="HelpPage__result">
            <h3 className="HelpPage__result-title">Question & Answer</h3>
            <div className="HelpPage__question-title">{match["prompt"]}</div>
            <div className="HelpPage__answer-content">
              {match["answer.answer"]}
            </div>
          </div>
      } else if (match.type == "feedback") {
        result = 
          <div className="HelpPage__result">
            <h3 className="HelpPage__result-title">Send Feedback</h3>
            <div className="HelpPage__result-content">
              We've analyzed your feedback and can help you submit it to the appropriate team.
            </div>
            <div className="HelpPage__metadata">
              <div className="HelpPage__metadata-item">
                <div className="HelpPage__metadata-label">Your Message</div>
                <div className="HelpPage__metadata-value">{this.state.question}</div>
              </div>
              <div className="HelpPage__metadata-item">
                <div className="HelpPage__metadata-label">Detected Sentiment</div>
                <div className="HelpPage__metadata-value">{match.sentiment}</div>
              </div>
              <div className="HelpPage__metadata-item">
                <div className="HelpPage__metadata-label">Category</div>
                <div className="HelpPage__metadata-value">{match.categories}</div>
              </div>
              {match.tags && (
                <div className="HelpPage__metadata-item">
                  <div className="HelpPage__metadata-label">Tags</div>
                  <div className="HelpPage__tags">
                    {match.tags.split(',').map((tag, index) => (
                      <span key={index} className="HelpPage__tag">{tag.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button className="HelpPage__button">Send Feedback</button>
          </div>
      } else if (match.type == "request") {
        result = 
          <div className="HelpPage__result">
            <h3 className="HelpPage__result-title">Create Support Ticket</h3>
            <div className="HelpPage__result-content">
              We've analyzed your request and prepared a support ticket with the appropriate routing and priority.
            </div>
            <div className="HelpPage__metadata">
              <div className="HelpPage__metadata-item">
                <div className="HelpPage__metadata-label">Request Details</div>
                <div className="HelpPage__metadata-value">{this.state.question}</div>
              </div>
              <div className="HelpPage__metadata-item">
                <div className="HelpPage__metadata-label">Suggested Assignee</div>
                <div className="HelpPage__metadata-value">{match.assignee}</div>
              </div>
              <div className="HelpPage__metadata-item">
                <div className="HelpPage__metadata-label">Category</div>
                <div className="HelpPage__metadata-value">{match.categories}</div>
              </div>
              <div className="HelpPage__metadata-item">
                <div className="HelpPage__metadata-label">Priority Level</div>
                <div className="HelpPage__metadata-value">{match.urgency}</div>
              </div>
            </div>
            <button className="HelpPage__button">Create Ticket</button>
          </div>
      }
    }
    return (
      <div className="HelpPage">
        <div className="HelpPage__header">
          <h1 className="HelpPage__title">Help & Support</h1>
          <p className="HelpPage__subtitle">
            Ask questions about the grocery store or get help with AI-powered assistance. Our intelligent system can answer questions, process feedback, and create support tickets.
          </p>
        </div>

        <div className="HelpPage__input-section">
          <label className="HelpPage__input-label">How can I help you?</label>
          <input
            className="HelpPage__input"
            value={this.state.question}
            onChange={this.onQuestionChange}
            type="text"
            name="question"
            id="question"
            placeholder="Type your question or feedback here..."
          />
        </div>
        
        {result}
      </div>
    )
  }
}

export default HelpPage
