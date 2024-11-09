import axios from 'axios'
import { aitoApiKey, aitoUrl } from './config'


export function predictInvoice(input, output) {
  return Promise.all(output.map(predicted => {
    return axios.post(`${aitoUrl}/api/v1/_query`, {
      from: 'invoices',
      where: input,
      get: predicted,
      orderBy: "$p",
      limit: 10
    }, {
      headers: {
        'x-api-key': aitoApiKey
      },
    }).then(response => response.data.hits)
  }))
}
