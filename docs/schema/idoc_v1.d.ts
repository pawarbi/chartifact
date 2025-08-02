/**
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
 * - The following names are not allowed as VariableIDs: "width", "height", "padding", "autosize", "background", "style", "parent", "datum", "item", "event", "cursor", "encodeUriComponent"
 */
type VariableID = string;
type VariableType = 'number' | 'string' | 'boolean' | 'object';
type VariableValuePrimitive = string | number | boolean | object;
type VariableValueArray = string[] | number[] | boolean[] | object[];
type VariableValue = VariableValuePrimitive | VariableValueArray;
interface Variable {
    variableId: VariableID;
    type: VariableType;
    isArray?: boolean;
    initialValue: VariableValue;
    calculation?: Calculation;
}
interface Calculation {
    dependsOn?: VariableID[];
    /** Vega expression language, used to calculate the value based on other variables. Not for object arrays. */
    vegaExpression?: string;
    /** If a variable type is object and isArray is true, the calculation must be a DataFrameTransformation */
    dataFrameTransformations?: Transforms[];
}
/** A url, it may contain template variables, e.g. https://example.com/{{category}}/{{item}} */
type TemplatedUrl = string;
interface DataSourceBase {
    /** name of the data source, used to reference it in the UI, has same constraints as VariableID */
    dataSourceName: VariableID;
    /** optional, default is 'json' */
    format?: DataSourceBaseFormat;
    dataFrameTransformations?: Transforms[];
}
type DataSourceBaseFormat = 'csv' | 'json' | 'tsv';
interface ElementBase {
}
interface VariableControl extends ElementBase {
    variableId: VariableID;
    /** optional label if the variableId is not descriptive enough */
    label?: string;
}
interface ReturnType {
    type: VariableType;
    /** in our system, a pandas dataframe is an array of objects */
    isArray?: boolean;
}
/** Data source types */
/** JSON data */
interface DataSourceInline extends DataSourceBase {
    type: 'inline';
    content: object[] | string;
}
/** User uploaded their own data file */
interface DataSourceByFile extends DataSourceBase {
    type: 'file';
    filename: string;
    content: string;
}
/** User references a data source by URL, may be either static or dynamic */
interface DataSourceByDynamicURL extends DataSourceBase {
    type: 'url';
    url: TemplatedUrl;
    returnType?: ReturnType;
    /** Assistant should not populate this. */
    docString?: string;
}
/** Union type for DataSource */
type DataSource<T = {}> = (DataSourceInline | DataSourceByFile | DataSourceByDynamicURL) & T;
/** LLM Should not use this type */
interface DataLoaderBySpec {
    type: 'spec';
    /** Vega Specification - Not Vega-Lite */
    spec: object;
}
type DataLoader = DataSource | DataLoaderBySpec;
/**
 * Interactive Elements
 */
/**
 * Checkbox
 * use for boolean values
 */
interface CheckboxElement extends CheckboxProps {
    type: 'checkbox';
}
interface CheckboxProps extends VariableControl {
}
/**
 * Textbox
 * use sparingly - typically only for text input
 */
interface TextboxElement extends TextboxElementProps {
    type: 'textbox';
}
interface TextboxElementProps extends VariableControl {
    /** whether to render as a textarea instead of input */
    multiline?: boolean;
    /** placeholder text to show when input is empty */
    placeholder?: string;
}
/**
 * Slider
 * prefer sliders over textbox for numbers. Never use for boolean values.
 */
interface SliderElement extends SliderElementProps {
    type: 'slider';
}
interface SliderElementProps extends VariableControl {
    min: number;
    max: number;
    step: number;
}
/**
 * Dropdown
 * use for selecting from a list of options
 */
interface DynamicDropdownOptions {
    /** name of the data source to use for data */
    dataSourceName: VariableID;
    /** name of the field to use for options */
    fieldName: string;
}
interface DropdownElement extends DropdownElementProps {
    type: 'dropdown';
}
interface DropdownElementProps extends VariableControl {
    /** one of either options or dynamicOptions must be set */
    options?: string[];
    dynamicOptions?: DynamicDropdownOptions;
    /** allow multiple selections */
    multiple?: boolean;
    /** number of options to show at once */
    size?: number;
}
interface ChartPlaceholder {
    /** A list of available chart templates will be provided below, the Assistant will choose one of these templates to render a chart */
    chartTemplateKey: string;
    dataSourceBase: DataSourceBase;
    /** what this chart intends to show */
    chartIntent: string;
}
interface ChartFull extends ChartPlaceholder {
    /** either a Vega or Vega-Lite spec */
    spec: object;
}
/** When creating a new page: for charts, the Assistant will create a ChartPlaceholder */
/** When working with existing pages/charts, the Assistant can use ChartFull */
type ChartValue = ChartPlaceholder | ChartFull;
/**
 * Chart
 * use for visualizations
 */
interface ChartElement extends ElementBase {
    type: 'chart';
    chart: ChartValue;
}
/**
 * Image element
 * use for displaying images or server-generated visualizations
 */
interface ImageElement extends ElementBase, ImageElementProps {
    type: 'image';
}
interface ImageElementProps {
    url: TemplatedUrl;
    alt?: string;
    height?: number;
    width?: number;
}
/**
 * Presets
 * use for storing and applying preset batches of signal states
 */
interface PresetsElement extends ElementBase, PresetsElementProps {
    type: 'presets';
}
interface PresetsElementProps {
    presets: Preset[];
}
interface Preset {
    name: string;
    description?: string;
    state: {
        [signalName: string]: unknown;
    };
}
/**
 * Table
 * use for tabular data
 */
interface TableElement extends TableElementProps {
    type: 'table';
}
interface TableElementProps extends VariableControl {
    /** Name of the data source to use for incoming data (output data is available via the variableId of this table element) */
    dataSourceName: string;
    editable?: boolean;
    /** Tabulator options (must be JSON stringify-able, so no callbacks allowed) */
    tabulatorOptions?: object;
}
/**
 * Union type for all possible interactive elements
 */
type InteractiveElement = ChartElement | CheckboxElement | DropdownElement | ImageElement | PresetsElement | SliderElement | TableElement | TextboxElement;
interface ElementGroup {
    groupId: string;
    elements: PageElement[];
}
/** Define the basic structure of an interactive document */
interface InteractiveDocument {
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
    style?: PageStyle;
}
/**
 * Use markdown elements to be verbose and descriptive. Do not use as labels for interactive elements.
 * Embed dynamic variables in markdown using double curly braces {{variableId}} as a placeholder for their values.
 */
type MarkdownElement = string;
/** Union type for all possible elements */
type PageElement = MarkdownElement | InteractiveElement;
interface PageStyle {
    css: string;
    googleFonts?: GoogleFontsSpec;
}
interface GoogleFontsSpec {
    googleFontsUrl: string;
    mapping?: {
        body?: string;
        hero?: string;
        headings?: string;
        code?: string;
        table?: string;
    };
    sizing?: {
        body?: number;
        hero?: number;
        headings?: number;
        code?: number;
        table?: number;
    };
}
/** JSON Schema version with $schema property for validation */
type InteractiveDocumentWithSchema = InteractiveDocument & {
    $schema?: string;
};
export type { Calculation, ChartElement, ChartFull, ChartPlaceholder, ChartValue, CheckboxElement, CheckboxProps, DataLoader, DataLoaderBySpec, DataSource, DataSourceBase, DataSourceBaseFormat, DataSourceByDynamicURL, DataSourceByFile, DataSourceInline, DropdownElement, DropdownElementProps, DynamicDropdownOptions, ElementBase, ElementGroup, GoogleFontsSpec, ImageElement, ImageElementProps, InteractiveDocument, InteractiveDocumentWithSchema, InteractiveElement, MarkdownElement, PageElement, PageStyle, Preset, PresetsElement, PresetsElementProps, ReturnType, SliderElement, SliderElementProps, TableElement, TableElementProps, TemplatedUrl, TextboxElement, TextboxElementProps, Variable, VariableControl, VariableID, VariableType, VariableValue, VariableValueArray, VariableValuePrimitive };