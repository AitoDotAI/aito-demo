import axios from 'axios'
import config from './config'

const outputFields = {
  "Processor": ["Name", "Role", "Department", "Superior"],
  "Acceptor": ["Name", "Role", "Department", "Superior"],
  "GLCode": ["Name", "GLCode", "Department"]
}


export function predictInvoice(input, output) {
  return Promise.all(output.map(predicted => {
    var select = [
      "$p", 
      {
        "$why": {
          "highlight": {
            "posPreTag": "<b>", 
            "posPostTag": "</b>"
          }
        }
      }
    ]
    outputFields[predicted].forEach(field => {
      select.push(field)
    })

    return axios.post(`${config.aito.url}/api/v1/_predict`, {
      from: 'invoices',
      where: input,
      predict: predicted,
      select: select,
      limit: 10
    }, {
      headers: {
        'x-api-key': config.aito.apiKey
      },
    }).then(response => response.data.hits)
  }))
}
