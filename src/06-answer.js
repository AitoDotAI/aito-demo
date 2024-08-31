import axios from 'axios'
import { aitoApiKey, aitoUrl } from './config'

export function getAnswer(question) {
  var where = {}

  return axios.post(`${aitoUrl}/api/v1/_query`, {
    "from": "questions",
    "where" : {
      "$nn": [{"question": question}]
    },
    "orderBy": {"$sameness": {"question": question} },
    "limit": 1,
    "select": ["question", "answer.answer"]
  }, {
    headers: {
      'x-api-key': aitoApiKey
    },
  })
    .then(result => {
      var match = null

      if (result.data.hits.length > 0) {
        match = result.data.hits[0]
      }
      return match
    })
}
