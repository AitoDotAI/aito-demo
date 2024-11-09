import axios from 'axios'
import { aitoApiKey, aitoUrl } from './config'

export function getRecommendedProducts(userId, currentShoppingBasket, count) {
  return axios.post(`${aitoUrl}/api/v1/_recommend`, {
    from: 'impressions',
    where: {
      'context.user': String(userId),
      'product.id': {
        $and: currentShoppingBasket.map(item => ({ $not: item.id })),
      }
    },
    recommend: 'product',
    goal: { 'purchase': true },
    limit: count
  }, {
    headers: {
      'x-api-key': aitoApiKey
    },
  })
    .then(result => {
      return result.data.hits
    })
}
