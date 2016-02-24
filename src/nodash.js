'use strict'

function isObject (obj) {
  return obj && typeof obj === 'object'
}

const isEqual = require('deep-equal')

module.exports = { isObject, isEqual }
