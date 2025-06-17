import axios from 'axios'
import config from './config'

export function getTagSuggestions(productName) {
  return axios.post(`${config.aito.url}/api/v1/_predict`, {
    from: 'products',
    where: {
      name: productName
    },
    predict: 'tags',
    exclusiveness: false,
    limit: 10
  }, {
    headers: {
      'x-api-key': config.aito.apiKey
    },
  })
    .then(response => {
      return response.data.hits
        .filter(e => e.$p > 0.5)  // Filter out results which are not very strong
        .map(hit => hit.feature)
    })
}
