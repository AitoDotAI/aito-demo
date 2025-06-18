const fs = require('fs')
const _ = require('lodash')

/**
 * Checks if a file exists at the specified path
 * @param {string} filePath - Path to the file to check
 * @returns {Promise<boolean>} - True if file exists, false otherwise
 */
function fileExists(filePath) {
  return fs.statAsync(filePath)
    .then(stats => stats.isFile())
    .catch((err) => {
      if (err.code === 'ENOENT') {
        return false
      }

      throw err
    })
}

/**
 * Extracts individual tags from a product's tag string
 * @param {Object} product - Product object with tags field
 * @returns {Array<string>} - Array of individual tag strings
 */
function getProductTags(product) {
  return product.tags.split(' ')
}

/**
 * Finds all products that have a specific tag
 * @param {Array} products - Array of product objects
 * @param {string} tag - Tag to search for
 * @returns {Array} - Sorted array of products with the specified tag
 */
function findProductsWithTag(products, tag) {
  const foundProducts = _.filter(products, (product) => {
    const tags = getProductTags(product)
    return _.includes(tags, tag)
  })

  return _.sortBy(foundProducts, 'name')
}

/**
 * Finds a product by its unique ID
 * @param {Array} products - Array of product objects
 * @param {string|number} id - Product ID to search for
 * @returns {Object|undefined} - Product object if found, undefined otherwise
 */
function findProductById(products, id) {
  return _.find(products, p => p.id === id)
}

module.exports = {
  fileExists,
  findProductsWithTag,
  getProductTags,
  findProductById,
}
