'use strict'

const EntitySchema = require('./EntitySchema')
const IterableSchema = require('./IterableSchema')

const isEqual = require('./nodash').isEqual
const isObject = require('./nodash').isObject

function visitObject (obj, schema, bag, options) {
  let normalized = {}
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      const itemSchema = schema[key]
      const result = visit(obj[key], itemSchema, bag, options)

      if (itemSchema instanceof EntitySchema) {
        normalized[key + '_id'] = result
      } else if (itemSchema instanceof IterableSchema && Array.isArray(result)) {
        normalized[key.replace(/s$/, '') + '_ids'] = result
      } else {
        normalized[key] = result
      }
    }
  }
  return normalized
}

function visitIterable (obj, iterableSchema, bag, options) {
  const itemSchema = iterableSchema.getItemSchema()
  const f = (obj) => visit(obj, itemSchema, bag, options)

  if (Array.isArray(obj)) {
    return obj.map(f)
  } else {
    let normalized = {}
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        const result = f(obj[key])

        if (itemSchema instanceof EntitySchema) {
          normalized[key + '_id'] = result
        } else if (itemSchema instanceof IterableSchema && Array.isArray(result)) {
          normalized[key.replace(/s$/, '') + '_ids'] = result
        }
      }
    }
    return normalized
  }
}

function defaultMergeIntoEntity (entityA, entityB, entityKey) {
  for (let key of Object.keys(entityB)) {
    if (!entityA.hasOwnProperty(key) || isEqual(entityA[key], entityB[key])) {
      entityA[key] = entityB[key]
      continue
    }

    console.warn(
      'When merging two ' + entityKey + ', found unequal data in their "' + key + '" values. Using the earlier value.',
      entityA[key], entityB[key]
    )
  }
}

function visitEntity (entity, entitySchema, bag, options) {
  const mergeIntoEntity = defaultMergeIntoEntity

  const entityKey = entitySchema.getKey()
  const id = entitySchema.getId(entity)

  if (!bag.hasOwnProperty(entityKey)) {
    bag[entityKey] = {}
  }

  if (!bag[entityKey].hasOwnProperty(id)) {
    bag[entityKey][id] = {}
  }

  let stored = bag[entityKey][id]
  let normalized = visitObject(entity, entitySchema, bag, options)
  mergeIntoEntity(stored, normalized, entityKey)

  return id
}

function visit (obj, schema, bag, options) {
  if (!isObject(obj) || !isObject(schema)) {
    return obj
  }

  if (schema instanceof EntitySchema) {
    return visitEntity(obj, schema, bag, options)
  } else if (schema instanceof IterableSchema) {
    return visitIterable(obj, schema, bag, options)
  } else {
    return visitObject(obj, schema, bag, options)
  }
}

function arrayOf (schema, options) {
  return new IterableSchema(schema, options)
}

function valuesOf (schema, options) {
  return new IterableSchema(schema, options)
}

function normalize (obj, schema, options) {
  if (!options) {
    options = {}
  }

  if (!isObject(obj) && !Array.isArray(obj)) {
    throw new Error('Normalize accepts an object or an array as its input.')
  }

  if (!isObject(schema) || Array.isArray(schema)) {
    throw new Error('Normalize accepts an object for schema.')
  }

  let bag = {}
  let result = visit(obj, schema, bag, options)

  return {
    entities: bag,
    result
  }
}

module.exports = {
  Schema: EntitySchema,
  arrayOf,
  valuesOf,
  normalize
}
