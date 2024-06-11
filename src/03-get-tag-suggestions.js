import axios from 'axios'

export function getTagSuggestions(productName) {
  return axios.post('https://cloud-test.aito.app/api/v1/_predict', {
    from: 'products',
    where: {
      name: productName
    },
    predict: 'tags',
    exclusiveness: false,
    limit: 10
  }, {
    headers: {
      'x-api-key': 'TJrQLOCdxP5eT85X9osJo8cIInoaXL8w1D7enGCX'
    },
  })
    .then(response => {
      return response.data.hits
        .filter(e => e.$p > 0.5)  // Filter out results which are not very strong
        .map(hit => hit.feature)
    })
}
