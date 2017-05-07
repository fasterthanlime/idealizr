import ISchema from "./Schema";
import EntitySchema from "./EntitySchema";
import IterableSchema from "./IterableSchema";
import TransformerSchema, { ITransformer } from "./TransformerSchema";
export declare type ISchema = ISchema;
export declare const Schema: typeof EntitySchema;
export declare function arrayOf(schema: ISchema): IterableSchema;
export declare function valuesOf(schema: ISchema): IterableSchema;
export declare function transform(transformer: ITransformer): TransformerSchema;
export declare function normalize(obj: IVisitable, schema: ISchema, userOptions?: IVisitOptions): INormalized;
export interface INormalized {
    entities: {
        [schemaName: string]: {
            [id: string]: any;
        };
    };
    result: any;
}
export declare type IVisitable = {
    [key: string]: IVisitable;
} | {
    [key: number]: IVisitable;
} | object;
export interface IBag {
    [schemaName: string]: {
        [id: string]: any;
    };
}
export declare type IKeyTransformer = (key: string) => string;
export interface IVisitOptions {
    keyTransformer?: IKeyTransformer;
}
