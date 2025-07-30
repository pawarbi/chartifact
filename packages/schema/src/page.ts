/*!
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { InteractiveElement } from './interactive.js';
import { DataLoader } from './datasource.js';
import { Variable } from './common.js';

export interface Layout {
  css: string;
}

export interface ElementGroup {
  groupId: string;
  elements: PageElement[];
}

/** Define the basic structure of an interactive document */
export interface InteractiveDocument {
  title: string;
  /** the first groupId should be 'main' */
  groups: ElementGroup[];

  /**
   * DataLoaders populate variables for tables and charts
   * Note: 'image' is not a valid type for a variable, do not provide a dataLoader if returnType.type = 'image', 
   * (ImageElements can load images from URLs directly without a DataLoader.)
   */
  dataLoaders?: DataLoader[];

  variables?: Variable[];

  /** Assistant should not populate these during the initial create phase. */
  layout?: Layout;
}

/**
 * Use markdown elements to be verbose and descriptive. Do not use as labels for interactive elements.
 * Embed dynamic variables in markdown using double curly braces {{variableId}} as a placeholder for their values.
 */
export type MarkdownElement = string;

/** Union type for all possible elements */
export type PageElement = MarkdownElement | InteractiveElement;
