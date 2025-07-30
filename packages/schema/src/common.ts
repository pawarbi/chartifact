/*!
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { Transforms } from 'vega';

/**
 * VariableID
 * 
 * - The VariableID is an identifier for a variable.
 * - Do NOT use operator characters in the VariableID, such as /|\\\'"`,.;:~-=+?!@#$%^&*()[]{}<> 
 * - Do NOT use space characters in the VariableID, but you may use underscores.
 * - Do NOT prefix the VariableID with a digit.
 * - Do NOT prefix/suffix the VariableID with the type, e.g. "value_number" is bad.
 * - The following names are not allowed as VariableIDs: "width", "height", "padding", "autosize", "background", "style", "parent", "datum", "item", "event", "cursor", "origins"
 */
export type VariableID = string;

export type VariableType = 'number' | 'string' | 'boolean' | 'object';
export type VariableValuePrimitive = string | number | boolean | object;
export type VariableValueArray = string[] | number[] | boolean[] | object[];
export type VariableValue = VariableValuePrimitive | VariableValueArray;

export interface Variable {
  variableId: VariableID;
  type: VariableType;
  isArray?: boolean;
  initialValue: VariableValue;
  calculation?: Calculation;
}

export interface Calculation {
  dependsOn?: VariableID[];

  /** Vega expression language, used to calculate the value based on other variables. Not for object arrays. */
  vegaExpression?: string;

  /** If a variable type is object and isArray is true, the calculation must be a DataFrameTransformation */
  dataFrameTransformations?: Transforms[];
}

export interface NameValuePairs {
  /** case-sensitive, do not rename */
  name: string;
  value: VariableValue;
}

export interface MappedNameValuePairs extends NameValuePairs {
  /** IMPORTANT! map to a variable whenever possible */
  variableId?: VariableID;

  /** a calculated value */
  calculation?: Calculation;
}

export interface UrlRef {
  origin: string;
  urlPath: string;

  /** these become query parameters in the URL */
  mappedParams?: MappedNameValuePairs[];
}

export interface DataSourceBase {
  /** name of the data source, used to reference it in the UI, has same constraints as VariableID */
  dataSourceName: VariableID;
  /** optional, default is 'json' */
  format?: DataSourceBaseFormat;
  dataFrameTransformations?: Transforms[];
}

export type DataSourceBaseFormat = 'csv' | 'json' | 'tsv';

export interface ElementBase {
}

export interface VariableControl extends ElementBase {
  variableId: VariableID;
  /** optional label if the variableId is not descriptive enough */
  label?: string;
}
