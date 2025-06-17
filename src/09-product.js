import axios from 'axios'
import config from './config'


export function getProductDetails(id){
  return axios.post(`${config.aito.url}/api/v1/_query`,
    {
      from: 'products',
      limit:1,
      offset: id
    }, {
    headers: { 'x-api-key': config.aito.apiKey },
  })
    .then(response => {
      return response.data    
  })
}

export function getAllProducts(){
  return axios.post(`${config.aito.url}/api/v1/_query`,
    {
      from: 'products',
      limit: 100
    }, {
    headers: { 'x-api-key': config.aito.apiKey },
  })
    .then(response => {
      return response.data    
  })
}

export function getProductStats(id){
  var where = {
    'id': id
  }

  return axios.post(`${config.aito.url}/api/v1/_aggregate`, 
    {
      "from": "impressions",
      "where": {
        "product.id": id
      },
      "aggregate": ["purchase.$sum", "purchase.$mean"]
    }, {
    headers: { 'x-api-key': config.aito.apiKey },
  })
    .then(response => {
      return response.data    
  })
}

export function getProductAnalytics(id){
  var where = {
    'id': id
  }

  return axios.post(`${config.aito.url}/api/v1/_batch`,
    [
      { // product properties
        "from": "impressions",
        "where": {"purchase": true},
        "relate": {
          "product": id
        },
        "select": ["lift", "related"]
      },
      { // relation to user tags
        "from": "visits",
        "where": {
          "purchases": {"$has": id}
        },
        "relate": "user.tags",
        "select": ["lift", "related"]
      },
      { // shopping basket analysis
        "from": "visits",
        "where": {
          "purchases": {"$has": id}
        },
        "relate": "purchases",
        "select": ["lift", "related"]
      },
      { // query words
        "from": "impressions",
        "where": {
          "product.id": id
        },
        "get": "context.queryPhrase",
        "orderBy": { "$sum": {"$context": "purchase" } },
        "select": ["$score", "$value"]
      },
      { // purchases by month
        "from": "impressions",
        "where": {
          "product.id": id
        }, 
        "get": "context.week",
        "select": [
          "$value",
          "$f",
          {"$sum": {"$context": "purchase"}},
          {"$mean": {"$context": "purchase"}}
        ]
      }
    ], {
    headers: { 'x-api-key': config.aito.apiKey },
  })
    .then(response => {
      return response.data    
  })
}
