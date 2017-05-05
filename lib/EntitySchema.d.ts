import ISchema from "./Schema";
export default class EntitySchema implements ISchema {
    _key: string;
    _getId: AttributeGetter;
    _idAttribute: string | AttributeGetter;
    constructor(key: string, options?: IEntitySchemaOptions);
    getKey(): string;
    getId(entity: any): any;
    getIdAttribute(): string | AttributeGetter;
    define(nestedSchema: INestedSchema): void;
}
export declare type AttributeGetter = (x: any) => any;
export interface IEntitySchemaOptions {
    idAttribute?: string | AttributeGetter;
}
export interface INestedSchema {
    [key: string]: ISchema;
}
