
import ISchema from "./Schema";
import EntitySchema, {IEntitySchemaOptions} from "./EntitySchema";
import IterableSchema from "./IterableSchema";
import TransformerSchema, {ITransformer} from "./TransformerSchema";

export type ISchema = ISchema;

import {isEqual, isObject} from "./nodash";

function visitObject(obj: any, schema: ISchema, bag: IBag, opts: IVisitOptions) {
  const k = opts.keyTransformer;

  const normalized: any = {};
  for (const key of Object.keys(obj)) {
    const itemSchema = schema[key];
    const result = visit(obj[key], itemSchema, bag, opts);

    if (itemSchema instanceof EntitySchema) {
      normalized[k(key + "_id")] = result;
    } else if (isIterableSchema(itemSchema) && Array.isArray(result)) {
      normalized[k(key.replace(/s$/, "") + "_ids")] = result;
    } else if (isTransformerSchema(itemSchema)) {
      normalized[k(key)] = itemSchema._transformer(result);
    } else {
      normalized[k(key)] = result;
    }
  }
  return normalized;
}

function visitIterable(obj: any, iterableSchema: IterableSchema, bag: IBag, opts: IVisitOptions) {
  const itemSchema = iterableSchema.getItemSchema();
  const k = opts.keyTransformer;
  const f = (fobj: IVisitable) => visit(fobj, itemSchema, bag, opts);

  if (Array.isArray(obj)) {
    return obj.map(f);
  } else {
    const normalized = {};
    for (const key of Object.keys(obj)) {
      const result = f(obj[key]);

      if (itemSchema instanceof EntitySchema) {
        normalized[k(key + "_id")] = result;
      } else if (itemSchema instanceof IterableSchema && Array.isArray(result)) {
        normalized[k(key.replace(/s$/, "") + "_ids")] = result;
      }
    }
    return normalized;
  }
}

function mergeIntoEntity(entityA: object, entityB: object, entityKey: string) {
  for (const key of Object.keys(entityB)) {
    if (!entityA.hasOwnProperty(key) || isEqual(entityA[key], entityB[key])) {
      entityA[key] = entityB[key];
      continue;
    }

    // tslint:disable-next-line
    console.warn(
      "When merging two " + entityKey + ', found unequal data in their "' + key + '" values. Using the earlier value.',
      entityA[key], entityB[key],
    );
  }
}

function visitEntity(entity: any, entitySchema: EntitySchema, bag: IBag, opts: IVisitOptions) {
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

function visit(obj: IVisitable, schema: ISchema, bag: IBag, opts: IVisitOptions) {
  if (!isObject(obj) || !isObject(schema)) {
    return obj;
  }

  if (isEntitySchema(schema)) {
    return visitEntity(obj, schema, bag, opts);
  } else if (isIterableSchema(schema)) {
    return visitIterable(obj, schema, bag, opts);
  } else {
    return visitObject(obj, schema, bag, opts);
  }
}

export const Schema = EntitySchema;

export function arrayOf(schema: ISchema) {
  return new IterableSchema(schema);
}

export function valuesOf(schema: ISchema) {
  return new IterableSchema(schema);
}

export function transform(transformer: ITransformer) {
  return new TransformerSchema(transformer);
}

export function normalize(obj: IVisitable, schema: ISchema, userOptions: IVisitOptions = {}) {
  const opts = {
    ...userOptions,
  };
  if (!opts.keyTransformer) {
    opts.keyTransformer = (x) => x;
  }

  if (!isObject(obj) && !Array.isArray(obj)) {
    throw new Error("Normalize accepts an object or an array as its input.");
  }

  if (!isObject(schema) || Array.isArray(schema)) {
    throw new Error("Normalize accepts an object for schema.");
  }

  const bag: IBag = {};
  const result = visit(obj, schema, bag, opts);

  return {
    entities: bag,
    result,
  };
}

export type IVisitable = {
  [key: string]: IVisitable;
} | {
  [key: number]: IVisitable;
} | object;

export interface IBag {
  [schemaName: string]: {
    [id: string]: any;
  };
}

export type IKeyTransformer = (key: string) => string;

export interface IVisitOptions {
  keyTransformer?: IKeyTransformer;
}

function isEntitySchema(s: ISchema): s is EntitySchema {
  return s instanceof EntitySchema;
}

function isTransformerSchema(s: ISchema): s is TransformerSchema {
  return s instanceof TransformerSchema;
}

function isIterableSchema(s: ISchema): s is IterableSchema {
  return s instanceof IterableSchema;
}
