//BEGIN LLM IGNORE
import { InteractiveElement } from './interactive';
import { DataLoader } from './datasource';
import { Variable, VariableID } from './common';
//END LLM IGNORE

export interface Layout {
  css: string;
}

export interface ElementGroup<T = never> {
  groupId: string;
  elements: PageElement<T>[];
}

// Define the basic structure of an interactive page
export interface InteractiveExplanatoryPage<T = never> {
  title: string;
  theme: string;
  groups: ElementGroup<T>[]; // the first groupId should be 'main'

  // DataLoaders populate variables for tables and charts
  // Note: 'image' is not a valid type for a variable, do not provide a dataLoader if returnType.type = 'image', 
  // (ImageElements can load images from URLs directly without a DataLoader.)
  dataLoaders: DataLoader[];

  variables: Variable[];

  // Assistant should not populate these during the initial create phase.
  layout?: Layout;
}

// Use markdown elements to be verbose and descriptive. Do not use as labels for interactive elements.
// Embed dynamic variables in markdown using double curly braces {{variableId}} as a placeholder for their values.
export type MarkdownElement = string;

// Union type for all possible elements
export type PageElement<T = never> = MarkdownElement | InteractiveElement | T;
