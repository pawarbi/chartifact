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
interface NameValuePairs {
    /** case-sensitive, do not rename */
    name: string;
    value: VariableValue;
}
interface MappedNameValuePairs extends NameValuePairs {
    /** IMPORTANT! map to a variable whenever possible */
    variableId?: VariableID;
    /** a calculated value */
    calculation?: Calculation;
}
interface UrlRef {
    origin: string;
    urlPath: string;
    /** these become query parameters in the URL */
    mappedParams?: MappedNameValuePairs[];
}
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
interface DataSourceByJSON extends DataSourceBase {
    type: 'json';
    content: object[];
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
    urlRef: UrlRef;
    returnType?: ReturnType;
    /** Assistant should not populate this. */
    docString?: string;
}
/** Union type for DataSource */
type DataSource<T = {}> = (DataSourceByJSON | DataSourceByFile | DataSourceByDynamicURL) & T;
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
interface CheckboxElement extends VariableControl {
    type: 'checkbox';
}
/**
 * Textbox
 * use sparingly - typically only for text input
 */
interface TextboxElement extends VariableControl {
    type: 'textbox';
}
/**
 * Slider
 * prefer sliders over textbox for numbers. Never use for boolean values.
 */
interface SliderElement extends VariableControl {
    type: 'slider';
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
interface DropdownElement extends VariableControl {
    type: 'dropdown';
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
interface ImageElement extends ElementBase {
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
interface TableElement extends ElementBase {
    type: 'table';
    dataSourceName: string;
    /** Tabulator options (must be serializable, so no callbacks allowed) */
    options?: object;
}
/**
 * Union type for all possible interactive elements
 */
type InteractiveElement = ChartElement | CheckboxElement | DropdownElement | ImageElement | SliderElement | TableElement | TextboxElement;
interface Layout {
    css: string;
}
interface ElementGroup<T = never> {
    groupId: string;
    elements: PageElement<T>[];
}
/** Define the basic structure of an interactive document */
interface InteractiveDocument<T = never> {
    title: string;
    /** the first groupId should be 'main' */
    groups: ElementGroup<T>[];
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
type MarkdownElement = string;
/** Union type for all possible elements */
type PageElement<T = never> = MarkdownElement | InteractiveElement | T;
interface Preset {
    name: string;
    description?: string;
    state: {
        [signalName: string]: unknown;
    };
}
interface PresetsElement extends ElementBase {
    type: 'presets';
    presets: Preset[];
}
type extendedElements = PresetsElement;
/** JSON Schema version with $schema property for validation */
type InteractiveDocumentWithSchema = InteractiveDocument & {
    $schema?: string;
};
export type { Calculation, ChartElement, ChartFull, ChartPlaceholder, ChartValue, CheckboxElement, DataLoader, DataLoaderBySpec, DataSource, DataSourceBase, DataSourceBaseFormat, DataSourceByDynamicURL, DataSourceByFile, DataSourceByJSON, DropdownElement, DynamicDropdownOptions, ElementBase, ElementGroup, ImageElement, InteractiveDocument, InteractiveDocumentWithSchema, InteractiveElement, Layout, MappedNameValuePairs, MarkdownElement, NameValuePairs, PageElement, Preset, PresetsElement, ReturnType, SliderElement, TableElement, TextboxElement, UrlRef, Variable, VariableControl, VariableID, VariableType, VariableValue, VariableValueArray, VariableValuePrimitive, extendedElements };