import axios from 'axios'
import { aitoApiKey, aitoUrl } from './config'

export function getAutoComplete(userId, prefix) {
  var where = {}
  if (prefix) {
    where['queryPhrase'] = {
      "$startsWith": prefix
    }
  } 
  if (userId) {
    where['user'] = userId
  }
  return axios.post(`${aitoUrl}/api/v1/_query`, {
    from: 'contexts',
    where: where,
    get: 'queryPhrase',
    orderBy: '$p',
    select: ["$p", "$value"]
  }, {
    headers: {
      'x-api-key': aitoApiKey
    },
  })
    .then(result => {
      return result.data.hits
    })
}
