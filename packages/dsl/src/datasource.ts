//BEGIN LLM IGNORE
import { DataSourceBase, VariableID, Calculation, VariableValue, VariableType, MappedNameValuePairs, UrlRef } from './common';
//END LLM IGNORE

export interface ReturnType {
  type: VariableType | 'image';

  //in our system, a pandas dataframe is an array of objects
  isArray?: boolean;
}

// Data source types

// User uploaded their own data file
export interface DataSourceByFile extends DataSourceBase {
  type: 'file';
  filename: string;
  content: string;
}

// User references a data source by URL, may be either static or dynamic
export interface DataSourceByDynamicURL extends DataSourceBase {
  type: 'url';
  urlRef: UrlRef;
  returnType?: ReturnType;

  // Assistant should not populate this.
  docString?: string;
}

// Union type for DataSource
export type DataSource<T = {}> = (DataSourceByFile | DataSourceByDynamicURL) & T;

//LLM Should not use this type
export interface DataLoaderBySpec {
  type: 'spec';
  spec: object; //Vega Specification - Not Vega-Lite
}

export type DataLoader = DataSource | DataLoaderBySpec;
