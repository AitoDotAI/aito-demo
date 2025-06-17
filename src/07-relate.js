import axios from 'axios'
import config from './config'

export function relate(field, value) {
  var where = {}
  where[field] = value

  return axios.post(`${config.aito.url}/api/v1/_relate`, {
    "from": "visits",
    "where": where,
    "relate": "purchases"
  }, {
    headers: {
      'x-api-key': config.aito.apiKey
    },
  })
    .then(results => {
      const ids = results.data.hits.map(x => {
        return x["related"]["purchases"]["$has"]
      })

      return axios.post(`${config.aito.url}/api/v1/_query`, {
        "from": "products",
        "where": {
          "id": {
            "$or": ids
          }
        },
        limit: ids.length
      }, {
        headers: {
          'x-api-key': config.aito.apiKey
        },
      }).then(products => {
        var idsToProducts = {}
        console.log("hits: " + JSON.stringify(products.data.hits))
        products.data.hits.forEach(i => {
          idsToProducts[i.id] = i
        })
        var rv = results.data.hits.map(i => {
          const value = idsToProducts[i.related.purchases.$has].name 
          return {
            lift: i.lift, 
            value: value
          }
        })        

        return rv
      })
    })
}
