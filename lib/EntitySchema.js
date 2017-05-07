"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class EntitySchema {
    constructor(key, options = {}) {
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
    getId(entity) {
        return this._getId(entity);
    }
    getIdAttribute() {
        return this._idAttribute;
    }
    define(nestedSchema) {
        for (const key of Object.keys(nestedSchema)) {
            this[key] = nestedSchema[key];
        }
    }
}
exports.default = EntitySchema;