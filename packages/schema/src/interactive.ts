/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { DataSourceBase, VariableID, VariableControl, ElementBase, TemplatedUrl } from './common.js';

/**
 * Interactive Elements
 */

/**
 * Checkbox
 * use for boolean values
 */
export interface CheckboxElement extends CheckboxProps {
  type: 'checkbox';
}
export interface CheckboxProps extends VariableControl {
}

/**
 * Textbox
 * use sparingly - typically only for text input
 */
export interface TextboxElement extends TextboxElementProps {
  type: 'textbox';
}
export interface TextboxElementProps extends VariableControl {
  /** whether to render as a textarea instead of input */
  multiline?: boolean;
  /** placeholder text to show when input is empty */
  placeholder?: string;
}

/**
 * Slider
 * prefer sliders over textbox for numbers. Never use for boolean values.
 */
export interface SliderElement extends SliderElementProps {
  type: 'slider';
}
export interface SliderElementProps extends VariableControl {
  min: number;
  max: number;
  step: number;
}

/**
 * Dropdown
 * use for selecting from a list of options
 */

export interface DynamicDropdownOptions {
  /** name of the data source to use for data */
  dataSourceName: VariableID;
  /** name of the field to use for options */
  fieldName: string;
}

export interface DropdownElement extends DropdownElementProps {
  type: 'dropdown';
}
export interface DropdownElementProps extends VariableControl {
  /** one of either options or dynamicOptions must be set */
  options?: string[];
  dynamicOptions?: DynamicDropdownOptions;

  /** allow multiple selections */
  multiple?: boolean;
  /** number of options to show at once */
  size?: number;
}

/**
 * Chart
 * use for visualizations
 */
export interface ChartElement extends ElementBase {
  type: 'chart';

  // key of the chart spec in the page.resources.charts
  chartKey: string;
}

/**
 * Image element
 * use for displaying images or server-generated visualizations
 */
export interface ImageElement extends ElementBase, ImageElementProps {
  type: 'image';
}
export interface ImageElementProps {
  url: TemplatedUrl;
  alt?: string;
  height?: number;
  width?: number;
}

/**
 * Presets
 * use for storing and applying preset batches of signal states
 */
export interface PresetsElement extends ElementBase, PresetsElementProps {
  type: 'presets';
}
export interface PresetsElementProps {
  presets: Preset[];
}

export interface Preset {
  name: string;
  description?: string;
  state: { [signalName: string]: unknown };
}

/**
 * Table
 * use for tabular data
 */
export interface TableElement extends TableElementProps {
  type: 'table';
}
export interface TableElementProps extends VariableControl {

  /** Name of the data source to use for incoming data (output data is available via the variableId of this table element) */
  dataSourceName: string;
  
  editable?: boolean;

  /** Tabulator options (must be JSON stringify-able, so no callbacks allowed) */
  tabulatorOptions?: object;

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
  | PresetsElement
  | SliderElement
  | TableElement
  | TextboxElement
  ;
