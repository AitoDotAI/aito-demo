import axios from 'axios'
import { aitoApiKey, aitoUrl } from './config'

export function getProductsByIds(ids) {
  return axios.post(`${aitoUrl}/api/v1/_query`, {
    "from": "products",
    "where" : {
      "id": {
        "$or": ids
      }
    }
  }, {
    headers: {
      'x-api-key': aitoApiKey
    },
  })
    .then(result => {
      return result.data.hits
    })
}

export function getAutoFill(userId) {
  return axios.post(`${aitoUrl}/api/v1/_predict`, {
    "from": "visits",
    "where" : {
      "user": userId
    },
    "predict":"purchases",
    "exclusiveness" : false,
    "select": ["$p", "$value"]
  }, {
    headers: {
      'x-api-key': aitoApiKey
    },
  })
    .then(result => {
      var ids = []

      result.data.hits.forEach(hit => {
        if (hit.$p >= 0.5) {
          ids.push(hit.$value)
        }
      })
      return ids
    })
}
