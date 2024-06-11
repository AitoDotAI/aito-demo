import axios from 'axios'

export function getRecommendedProducts(userId, currentShoppingBasket, count) {
  return axios.post('https://cloud-test.aito.app/api/v1/_recommend', {
    from: 'impressions',
    where: {
      'session.user': String(userId),
      'product.id': {
        $and: currentShoppingBasket.map(item => ({ $not: item.id })),
      }
    },
    recommend: 'product',
    goal: { 'purchase': true },
    limit: count
  }, {
    headers: {
      'x-api-key': 'TJrQLOCdxP5eT85X9osJo8cIInoaXL8w1D7enGCX'
    },
  })
    .then(result => {
      return result.data.hits
    })
}
