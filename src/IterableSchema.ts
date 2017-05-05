
import {isObject} from "./nodash";
import ISchema from "./Schema";

export default class ArraySchema implements ISchema {
  _itemSchema: ISchema; // tslint:disable-line

  constructor(itemSchema: ISchema) {
    if (!itemSchema) {
      throw new Error("Iterable schema needs a valid item schema");
    }

    this._itemSchema = itemSchema;
  }

  getItemSchema() {
    return this._itemSchema;
  }
}
