
import ISchema from "./Schema";

export default class TransformerSchema implements ISchema {
  _transformer: ITransformer; // tslint:disable-line

  constructor(transformer: ITransformer) {
    this._transformer = transformer;
  }
}

export type ITransformer = (x: any) => any;
