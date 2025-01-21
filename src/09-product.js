import axios from 'axios'
import { aitoApiKey, aitoUrl } from './config'


export function getProductDetails(id){
  return axios.post(`${aitoUrl}/api/v1/_query`,
    {
      from: 'products',
      limit:1,
      offset: id
    }, {
    headers: { 'x-api-key': aitoApiKey },
  })
    .then(response => {
      return response.data    
  })
}

export function getAllProducts(){
  return axios.post(`${aitoUrl}/api/v1/_query`,
    {
      from: 'products',
      limit: 100
    }, {
    headers: { 'x-api-key': aitoApiKey },
  })
    .then(response => {
      return response.data    
  })
}

export function getProductStats(id){
  var where = {
    'id': id
  }

  return axios.post(`${aitoUrl}/api/v1/_aggregate`, 
    {
      "from": "impressions",
      "where": {
        "product.id": id
      },
      "aggregate": ["purchase.$sum", "purchase.$mean"]
    }, {
    headers: { 'x-api-key': aitoApiKey },
  })
    .then(response => {
      return response.data    
  })
}

export function getProductAnalytics(id){
  var where = {
    'id': id
  }

  return axios.post(`${aitoUrl}/api/v1/_batch`,
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
      }
    ], {
    headers: { 'x-api-key': aitoApiKey },
  })
    .then(response => {
      return response.data    
  })
}
