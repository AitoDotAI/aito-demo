import axios from 'axios'
import { aitoApiKey, aitoUrl } from './config'

export function getAutoComplete(userId, prefix) {
  return axios.post(`${aitoUrl}/api/v1/_recommend`, {
    from: 'contexts',
    where: {
      'user': String(userId),
      'queryPhrase': {
        "$startsWith": prefix
      }
    },
    predict: 'queryPhrase'
  }, {
    headers: {
      'x-api-key': aitoApiKey
    },
  })
    .then(result => {
      return result.data.hits
    })
}
