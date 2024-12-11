import axios from 'axios'

import { aitoApiKey, aitoUrl } from './config'

export function getProductSearchResults(userId, inputValue) {
  var where = {
    'product' : {
      '$or': [
        {'tags': { "$match": inputValue }},
        {'name': { "$match": inputValue }}
      ]
    }
  }
  if (userId) {
    where['context.user'] = String(userId)
  }

  return axios.post(`${aitoUrl}/api/v1/_query`, {
    from: 'impressions',
    where: where,
    get: 'product',
    orderBy: { 
      '$multiply': [
        "$similarity",
        {
          "$p": {
            "$context": {
              "purchase": true 
            }
          }
        }
      ]
    },
    select: ["name", "id", "tags", "price", "$matches"],
    limit: 5
  }, {
    headers: { 'x-api-key': aitoApiKey },
  })
    .then(response => {
      return response.data.hits
    })
}
