import ISchema from "./Schema";
export default class TransformerSchema implements ISchema {
    _transformer: ITransformer;
    constructor(transformer: ITransformer);
}
export declare type ITransformer = (x: any) => any;
