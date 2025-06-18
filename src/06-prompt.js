import axios from 'axios'
import config from './config'

/**
 * Analyzes a user prompt to determine its type and extract relevant information
 * Uses Aito.ai's predictive capabilities to classify prompts as questions, feedback, or requests
 * and extract structured data accordingly
 * 
 * @param {string} question - The user's input prompt to analyze
 * @returns {Promise<Object>} - Structured analysis result with type and extracted data
 */
export function prompt(question) {
  // First, predict the type of prompt (question, feedback, or request)
  return axios.post(`${config.aito.url}/api/v1/_predict`, {
    "from": "prompts",
    "where" : {
      "prompt": question
    },
    "predict": "type",
    "limit": 1
  }, {
    headers: {
      'x-api-key': config.aito.apiKey
    },
  }).then(result => {
      const top = result.data.hits[0]
      if (top.$p > 0.5) {
        if (top.feature === "question") {
          return axios.post(`${config.aito.url}/api/v1/_query`, {
            "from": "prompts",
            "where" : {
              "$nn": [{"prompt": question}]
            },
            "orderBy": {"$sameness": {"prompt": question} },
            "limit": 1,
            "select": ["prompt", "type", "answer.answer"]
          }, {
            headers: {
              'x-api-key': config.aito.apiKey
            },
          }).then(result => {
            var match = null
      
            if (result.data.hits.length > 0) {
              match = result.data.hits[0]
            }
            return match
          })
        } else if (top.feature === "feedback") {
          const fields = ["sentiment", "categories.$feature", "tags"]

          return Promise.all(fields.map(predicted => {
            return axios.post(`${config.aito.url}/api/v1/_predict`, {
              from: 'prompts',
              where: {
                "prompt": question,
                "type": "feedback"
              },
              predict: predicted,
              limit: 1
            }, {
              headers: {
                'x-api-key': config.aito.apiKey
              },
            }).then(response => response.data.hits[0])
          })).then(responses => {
            var rv = {
              "type": "feedback"
            }
            console.log(JSON.stringify(responses))
            for (var i = 0; i < fields.length; i++) {
              if (responses[i].$p >= 0.5) {
                const key = fields[i].split(".")[0]
                rv[key] = responses[i].feature
              }
            }
            console.log(JSON.stringify(rv))
            return rv
          })
        } else if (top.feature === "request") {
          const assignee = axios.post(`${config.aito.url}/api/v1/_query`, {
            from: 'prompts',
            where: {
              "prompt": question,
              "type": "request"
            },
            get: "assignee",
            orderBy: "$p",
            limit: 1
          }, {
            headers: {
              'x-api-key': config.aito.apiKey
            },
          }).then(response => {
            const top = response.data.hits[0]
            return [top.$p, `${top.Name} (${top.Role})`]
          }) 

          const categories = axios.post(`${config.aito.url}/api/v1/_predict`, {
            from: {
              "from": 'prompts',
              "where": {
                "type": "request"
              }
            },
            where: {
              "prompt": question
            },
            predict: "categories",
            exclusiveness: false,
            limit: 1
          }, {
            headers: {
              'x-api-key': config.aito.apiKey
            },
          }).then(response => {
            const top = response.data.hits[0]
            return [top.$p, top.feature]
          }) 

          const urgency = axios.post(`${config.aito.url}/api/v1/_predict`, {
            from: 'prompts',
            where: {
              "prompt": question,
              "type": "request"
            },
            predict: "urgency",
            limit: 1
          }, {
            headers: {
              'x-api-key': config.aito.apiKey
            },
          }).then(response => {
            const top = response.data.hits[0]
            return [top.$p, top.feature]
          }) 

          const fields = ["assignee", "categories", "urgency"]

          return Promise.all([assignee, categories, urgency]).then(responses => {
            var rv = {
              "type": "request"
            }
            console.log(JSON.stringify(responses))
            for (var i = 0; i < fields.length; i++) {
              if (responses[i][0] >= 0.25) {
                rv[fields[i]] = responses[i][1]
              }
            }
            console.log(JSON.stringify(rv))
            return rv
          })
        }
      }
      return {
        "type": null
      }
    })
}
