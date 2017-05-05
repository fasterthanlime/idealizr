"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EntitySchema_1 = require("./EntitySchema");
const IterableSchema_1 = require("./IterableSchema");
const TransformerSchema_1 = require("./TransformerSchema");
const nodash_1 = require("./nodash");
function visitObject(obj, schema, bag, opts) {
    const k = opts.keyTransformer;
    const normalized = {};
    for (const key of Object.keys(obj)) {
        const itemSchema = schema[key];
        const result = visit(obj[key], itemSchema, bag, opts);
        if (itemSchema instanceof EntitySchema_1.default) {
            normalized[k(key + "_id")] = result;
        }
        else if (isIterableSchema(itemSchema) && Array.isArray(result)) {
            normalized[k(key.replace(/s$/, "") + "_ids")] = result;
        }
        else if (isTransformerSchema(itemSchema)) {
            normalized[k(key)] = itemSchema._transformer(result);
        }
        else {
            normalized[k(key)] = result;
        }
    }
    return normalized;
}
function visitIterable(obj, iterableSchema, bag, opts) {
    const itemSchema = iterableSchema.getItemSchema();
    const k = opts.keyTransformer;
    const f = (fobj) => visit(fobj, itemSchema, bag, opts);
    if (Array.isArray(obj)) {
        return obj.map(f);
    }
    else {
        const normalized = {};
        for (const key of Object.keys(obj)) {
            const result = f(obj[key]);
            if (itemSchema instanceof EntitySchema_1.default) {
                normalized[k(key + "_id")] = result;
            }
            else if (itemSchema instanceof IterableSchema_1.default && Array.isArray(result)) {
                normalized[k(key.replace(/s$/, "") + "_ids")] = result;
            }
        }
        return normalized;
    }
}
function mergeIntoEntity(entityA, entityB, entityKey) {
    for (const key of Object.keys(entityB)) {
        if (!entityA.hasOwnProperty(key) || nodash_1.isEqual(entityA[key], entityB[key])) {
            entityA[key] = entityB[key];
            continue;
        }
        // tslint:disable-next-line
        console.warn("When merging two " + entityKey + ', found unequal data in their "' + key + '" values. Using the earlier value.', entityA[key], entityB[key]);
    }
}
function visitEntity(entity, entitySchema, bag, opts) {
    const entityKey = entitySchema.getKey();
    const id = entitySchema.getId(entity);
    if (!bag.hasOwnProperty(entityKey)) {
        bag[entityKey] = {};
    }
    if (!bag[entityKey].hasOwnProperty(id)) {
        bag[entityKey][id] = {};
    }
    const stored = bag[entityKey][id];
    const normalized = visitObject(entity, entitySchema, bag, opts);
    mergeIntoEntity(stored, normalized, entityKey);
    return id;
}
function visit(obj, schema, bag, opts) {
    if (!nodash_1.isObject(obj) || !nodash_1.isObject(schema)) {
        return obj;
    }
    if (isEntitySchema(schema)) {
        return visitEntity(obj, schema, bag, opts);
    }
    else if (isIterableSchema(schema)) {
        return visitIterable(obj, schema, bag, opts);
    }
    else {
        return visitObject(obj, schema, bag, opts);
    }
}
exports.Schema = EntitySchema_1.default;
function arrayOf(schema) {
    return new IterableSchema_1.default(schema);
}
exports.arrayOf = arrayOf;
function valuesOf(schema) {
    return new IterableSchema_1.default(schema);
}
exports.valuesOf = valuesOf;
function transform(transformer) {
    return new TransformerSchema_1.default(transformer);
}
exports.transform = transform;
function normalize(obj, schema, userOptions = {}) {
    const opts = Object.assign({}, userOptions);
    if (!opts.keyTransformer) {
        opts.keyTransformer = (x) => x;
    }
    if (!nodash_1.isObject(obj) && !Array.isArray(obj)) {
        throw new Error("Normalize accepts an object or an array as its input.");
    }
    if (!nodash_1.isObject(schema) || Array.isArray(schema)) {
        throw new Error("Normalize accepts an object for schema.");
    }
    const bag = {};
    const result = visit(obj, schema, bag, opts);
    return {
        entities: bag,
        result,
    };
}
exports.normalize = normalize;
function isEntitySchema(s) {
    return s instanceof EntitySchema_1.default;
}
function isTransformerSchema(s) {
    return s instanceof TransformerSchema_1.default;
}
function isIterableSchema(s) {
    return s instanceof IterableSchema_1.default;
}
