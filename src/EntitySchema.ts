
import ISchema from "./Schema";

export default class EntitySchema implements ISchema {
  _key: string; // tslint:disable-line
  _getId: AttributeGetter; // tslint:disable-line
  _idAttribute: string | AttributeGetter; // tslint:disable-line

  constructor(key: string, options: IEntitySchemaOptions = {}) {
    if (!key || typeof key !== "string") {
      throw new Error("A string non-empty key is required");
    }

    this._key = key;

    const idAttribute = options.idAttribute || "id";
    this._getId = typeof idAttribute === "function" ? idAttribute : (x) => x[idAttribute];
    this._idAttribute = idAttribute;
  }

  getKey() {
    return this._key;
  }

  getId(entity: any) {
    return this._getId(entity);
  }

  getIdAttribute() {
    return this._idAttribute;
  }

  define(nestedSchema: INestedSchema) {
    for (const key of Object.keys(nestedSchema)) {
      this[key] = nestedSchema[key];
    }
  }
}

export type AttributeGetter = (x: any) => any;

export interface IEntitySchemaOptions {
  idAttribute?: string | AttributeGetter;
}

export interface INestedSchema {
  [key: string]: ISchema;
}
