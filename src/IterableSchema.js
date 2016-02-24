'use strict'

const isObject = require('./nodash').isObject

class ArraySchema {
  constructor (itemSchema, options) {
    if (!options) {
      options = {}
    }

    if (!isObject(itemSchema)) {
      throw new Error('ArraySchema requires item schema to be an object.')
    }

    this._itemSchema = itemSchema
  }

  getItemSchema () {
    return this._itemSchema
  }
}

module.exports = ArraySchema
