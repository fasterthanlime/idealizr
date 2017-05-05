"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ArraySchema {
    constructor(itemSchema) {
        if (!itemSchema) {
            throw new Error("Iterable schema needs a valid item schema");
        }
        this._itemSchema = itemSchema;
    }
    getItemSchema() {
        return this._itemSchema;
    }
}
exports.default = ArraySchema;
