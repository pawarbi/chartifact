//BEGIN LLM IGNORE
import { DataSourceBase, VariableID, VariableControl, ElementBase, UrlRef } from './common';
//END LLM IGNORE

/**
 * Interactive Elements
 */

/**
 * Checkbox
 * use for boolean values
 */
export interface CheckboxElement extends VariableControl {
  type: 'checkbox';
}

/**
 * Textbox
 * use sparingly - typically only for text input
 */
export interface TextboxElement extends VariableControl {
  type: 'textbox';
}

/**
 * Slider
 * prefer sliders over textbox for numbers. Never use for boolean values.
 */
export interface SliderElement extends VariableControl {
  type: 'slider';
  min: number;
  max: number;
  step: number;
}

/**
 * Dropdown
 * use for selecting from a list of options
 */

export interface DynamicDropdownOptions {
  dataSourceName: VariableID; // name of the data source to use for data
  fieldName: string; // name of the field to use for options
}

export interface DropdownElement extends VariableControl {
  type: 'dropdown';

  // one of either options or dynamicOptions must be set
  options?: string[];
  dynamicOptions?: DynamicDropdownOptions;

  multiple?: boolean; // allow multiple selections
  size?: number; // number of options to show at once
}

export interface ChartPlaceholder {
  // A list of available chart templates will be provided below, the Assistant will choose one of these templates to render a chart
  chartTemplateKey: string;
  dataSourceBase: DataSourceBase;
  // what this chart intends to show
  chartIntent: string;
}

export interface ChartFull extends ChartPlaceholder {
  spec: object; // either a Vega or Vega-Lite spec
}

// When creating a new page: for charts, the Assistant will create a ChartPlaceholder
// When working with existing pages/charts, the Assistant can use ChartFull
export type ChartValue = ChartPlaceholder | ChartFull;

/**
 * Chart
 * use for visualizations
 */
export interface ChartElement extends ElementBase {
  type: 'chart';
  chart: ChartValue;
}

/**
 * Image element
 * use for displaying images or server-generated visualizations
 */
export interface ImageElement extends ElementBase {
  type: 'image';
  alt?: string;
  height?: number;
  width?: number;
  urlRef: UrlRef;
}

/**
 * Table
 * use for tabular data
 */
export interface TableElement extends ElementBase {
  type: 'table';
  dataSourceName: string;
  options: object;  // Tabulator options (must be serializable, so no callbacks allowed)

  /**
   * Example table options
    
   default:
   {
      autoColumns: true,
      layout: "fitColumns",
      minHeight: "200px",
      maxHeight: "200px",
  };
  
  selectable:
  {
      ...defaultTableOptions,
      selectableRows: true, //true = allow row selection, 1 = allow just one row to be selected, 2 = allow 2 rows to be selected (useful for comparing rows)
      rowHeader: {
          formatter: "rowSelection",
          titleFormatter: "rowSelection",
          headerSort: false,
          resizable: false,
          frozen: true,
          headerHozAlign: "center",
          hozAlign: "center",
          width: 40
      }
  };

  singleSelectable:
  {
      ...selectableOptions,
      selectableRows: 1 //allow just one row to be selected
  };
 
  dualSelectable:
  {
      ...selectableOptions,
      selectableRows: 2 // allow 2 rows to be selected (useful for comparing rows)
  };

  */

}

/**
 * Union type for all possible interactive elements
 */
export type InteractiveElement =
  | ChartElement
  | CheckboxElement
  | DropdownElement
  | ImageElement
  | SliderElement
  | TableElement
  | TextboxElement
  ;
