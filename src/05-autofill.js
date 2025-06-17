import axios from 'axios'
import config from './config'

export function getProductsByIds(ids) {
  return axios.post(`${config.aito.url}/api/v1/_query`, {
    "from": "products",
    "where" : {
      "id": {
        "$or": ids
      }
    }
  }, {
    headers: {
      'x-api-key': config.aito.apiKey
    },
  })
    .then(result => {
      return result.data.hits
    })
}

export function getAutoFill(userId) {
  var where = {}
  if (userId) {
    where['user'] = userId
  }



  return axios.post(`${config.aito.url}/api/v1/_predict`, {
    "from": "visits",
    "where" : where,
    "predict":"purchases",
    "exclusiveness" : false,
    "select": ["$p", "$value"]
  }, {
    headers: {
      'x-api-key': config.aito.apiKey
    },
  })
    .then(result => {
      var ids = []

      result.data.hits.forEach(hit => {
        if (hit.$p >= 0.4) {
          ids.push(hit.$value)
        }
      })
      return ids
    })
}
