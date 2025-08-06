/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { DataSourceBase, TemplatedUrl, VariableType } from './common.js';

export interface ReturnType {
  type: VariableType;

  /** in our system, a pandas dataframe is an array of objects */
  isArray?: boolean;
}

/** Data source types */

/** JSON data */
export interface DataSourceInline extends DataSourceBase {
  type: 'inline';

  /* handles JSON arrays or a string of CSV / TSV */
  content: object[] | string;
}

/** User uploaded their own data file */
export interface DataSourceByFile extends DataSourceBase {
  type: 'file';
  filename: string;
  content: string;
}

/** User references a data source by URL, may be either static or dynamic */
export interface DataSourceByDynamicURL extends DataSourceBase {
  type: 'url';
  url: TemplatedUrl;
  returnType?: ReturnType;

  /** Assistant should not populate this. */
  docString?: string;
}

/** Union type for DataSource */
export type DataSource<T = {}> = (DataSourceInline | DataSourceByFile | DataSourceByDynamicURL) & T;

/** LLM Should not use this type */
export interface DataLoaderBySpec {
  type: 'spec';
  /** Vega Specification - Not Vega-Lite */
  spec: object;
}

export type DataLoader = DataSource | DataLoaderBySpec;
