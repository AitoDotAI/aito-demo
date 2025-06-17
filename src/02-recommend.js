import axios from 'axios'
import config from './config'

export function getRecommendedProducts(userId, currentShoppingBasket, count) {
  return axios.post(`${config.aito.url}/api/v1/_recommend`, {
    from: 'impressions',
    where: {
      'context.user': String(userId),
      'product.id': {
        $and: currentShoppingBasket.map(item => ({ $not: item.id })),
      }
    },
    recommend: 'product',
    goal: { 'purchase': true },
    select: ["name", "id", "tags", "price"],
    limit: count
  }, {
    headers: {
      'x-api-key': config.aito.apiKey
    },
  })
    .then(result => {
      return result.data.hits
    })
}
