import axios from 'axios'
import { aitoApiKey, aitoUrl } from './config'

const outputFields = {
  "Processor": ["Name", "Role", "Department", "Superior"],
  "Acceptor": ["Name", "Role", "Department", "Superior"],
  "GLCode": ["Name", "GLCode", "Department"]
}


export function predictInvoice(input, output) {
  return Promise.all(output.map(predicted => {
    var select = ["$p", "$why"]
    outputFields[predicted].forEach(field => {
      select.push(field)
    })

    return axios.post(`${aitoUrl}/api/v1/_query`, {
      from: 'invoices',
      where: input,
      get: predicted,
      orderBy: "$p",
      select: select, 
      limit: 10
    }, {
      headers: {
        'x-api-key': aitoApiKey
      },
    }).then(response => response.data.hits)
  }))
}
