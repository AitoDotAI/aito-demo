import axios from 'axios'

import { aitoApiKey, aitoUrl } from './config'

export function getProductSearchResults(userId, inputValue) {
  var where = {
    'product' : {
      '$or': [
        {'tags': { "$match": inputValue }},
        {'name': { "$match": inputValue }}
      ]
    },
    'context.query': inputValue
  }
  if (userId) {
    where['context.user'] = userId
  }

  return axios.post(`${aitoUrl}/api/v1/_recommend`, {
    from: 'impressions',
    where: where,
    recommend: 'product',
    goal: { 'purchase': true },
    limit: 5
  }, {
    headers: { 'x-api-key': aitoApiKey },
  })
    .then(response => {
      return response.data.hits
    })
}
