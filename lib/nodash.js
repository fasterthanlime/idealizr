"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isObject(obj) {
    return obj && typeof obj === "object";
}
exports.isObject = isObject;
exports.isEqual = require("deep-equal");
