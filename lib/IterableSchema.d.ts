import ISchema from "./Schema";
export default class ArraySchema implements ISchema {
    _itemSchema: ISchema;
    constructor(itemSchema: ISchema);
    getItemSchema(): ISchema;
}
