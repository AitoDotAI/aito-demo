import axios from 'axios'

export function getProductSearchResults(userId, inputValue) {
  return axios.post('https://cloud-test.aito.app/api/v1/_recommend', {
    from: 'impressions',
    where: {
      'product.name': { "$match": inputValue },
      'session.user': userId
    },
    recommend: 'product',
    goal: { 'purchase': true },
    limit: 5
  }, {
    headers: { 'x-api-key': 'TJrQLOCdxP5eT85X9osJo8cIInoaXL8w1D7enGCX' },
  })
    .then(response => {
      return response.data.hits
    })
}
