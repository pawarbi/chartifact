import { Spec as VegaSpec } from 'vega-typings';
import { TopLevelSpec as VegaLiteSpec } from "vega-lite";
import { ChartFull, DataSource, ElementGroup, InteractiveDocument, TableElement, TextboxElement, Variable } from 'schema';
import { getChartType } from './util.js';
import { addDynamicDataLoaderToSpec, addStaticDataLoaderToSpec } from './loader.js';
import { Plugins } from '@microsoft/interactive-document-markdown';
import { VegaScope } from './scope.js';
import { createSpecWithVariables } from './spec.js';
import { defaultCommonOptions } from 'common';

function tickWrap(tick: string, content: string) {
    return `\`\`\`${tick}\n${content}\n\`\`\``;
}

function jsonWrap(type: string, content: string) {
    return tickWrap('json ' + type, content);
}

function chartWrap(spec: VegaSpec | VegaLiteSpec) {
    const chartType = getChartType(spec);
    return jsonWrap(chartType, JSON.stringify(spec, null, 4));
}

function mdContainerWrap(classname: string, id: string, content: string) {
    return `::: ${classname} {#${id}}
${content}
:::`;
}

const $schema = "https://vega.github.io/schema/vega/v5.json";

export function targetMarkdown(page: InteractiveDocument) {
    const mdSections: string[] = [];
    const dataLoaders = page.dataLoaders || [];
    const variables = page.variables || [];

    if (page.layout?.css) {
        mdSections.push(tickWrap('css', page.layout.css));
    }

    const tableElements = page.groups.flatMap(group => group.elements.filter(e => typeof e !== 'string' && e.type === 'table') as TableElement[]);

    const vegaScope = dataLoaderMarkdown(dataLoaders.filter(dl => dl.type !== 'spec'), variables, tableElements);

    for (const dataLoader of dataLoaders.filter(dl => dl.type === 'spec')) {
        mdSections.push(chartWrap(dataLoader.spec));
    }

    for (const group of page.groups) {
        mdSections.push(mdContainerWrap(defaultCommonOptions.groupClassName, group.groupId, groupMarkdown(group, variables, vegaScope)));
    }

    //spec is at the top of the markdown file
    mdSections.unshift(chartWrap(vegaScope.spec));

    const markdown = mdSections.join('\n\n');
    return markdown;
}

function dataLoaderMarkdown(dataSources: DataSource[], variables: Variable[], tableElements: TableElement[]) {

    //create a Vega spec with all variables
    const spec = createSpecWithVariables(variables, tableElements);
    const vegaScope = new VegaScope(spec);

    for (const dataSource of dataSources) {
        switch (dataSource.type) {
            case 'json': {
                addStaticDataLoaderToSpec(vegaScope, dataSource);
                break;
            }
            case 'file': {
                addStaticDataLoaderToSpec(vegaScope, dataSource);
                break;
            }
            case 'url': {
                addDynamicDataLoaderToSpec(vegaScope, dataSource);
                break;
            }
        }
    }

    return vegaScope;
}

function groupMarkdown(group: ElementGroup, variables: Variable[], vegaScope: VegaScope) {
    const mdElements: string[] = [];
    for (const element of group.elements) {
        if (typeof element === 'string') {
            mdElements.push(element);
        } else if (typeof element === 'object') {
            switch (element.type) {
                case 'chart': {
                    const chartFull = element.chart as ChartFull;
                    //see if it's a placeholder or a full chart
                    if (!chartFull.spec) {
                        //add a markdown element (not a chart element) with an image of the spinner at /img/chart-spinner.gif
                        mdElements.push('![Chart Spinner](/img/chart-spinner.gif)');
                    } else {
                        mdElements.push(chartWrap(chartFull.spec));
                    }
                    break;
                }
                case 'checkbox': {
                    const cbSpec: Plugins.CheckboxSpec = {
                        variableId: element.variableId,
                        value: variables.find(v => v.variableId === element.variableId)?.initialValue as boolean,
                        label: element.label,
                    };
                    mdElements.push(jsonWrap('checkbox', JSON.stringify(cbSpec, null, 2)));
                    break;
                }
                case 'dropdown': {
                    const ddSpec: Plugins.DropdownSpec = {
                        variableId: element.variableId,
                        value: variables.find(v => v.variableId === element.variableId)?.initialValue as string | string[],
                        label: element.label,
                    };
                    if (element.dynamicOptions) {
                        ddSpec.dynamicOptions = {
                            dataSourceName: element.dynamicOptions.dataSourceName,
                            fieldName: element.dynamicOptions.fieldName,
                        };
                    } else {
                        ddSpec.options = element.options;
                    }
                    if (element.multiple) {
                        ddSpec.multiple = element.multiple;
                        ddSpec.size = element.size || 1;
                    }

                    mdElements.push(jsonWrap('dropdown', JSON.stringify(ddSpec, null, 2)));
                    break;
                }
                case 'image': {
                    const urlSignal = vegaScope.createUrlSignal(element.urlRef);
                    const imageSpec: Plugins.ImageSpec = {
                        srcSignalName: urlSignal.name,
                        alt: element.alt,
                        width: element.width,
                        height: element.height,
                    };
                    mdElements.push(jsonWrap('image', JSON.stringify(imageSpec, null, 2)));
                    break;
                }
                case 'presets': {
                    const presetsSpec: Plugins.PresetsSpec = element.presets;
                    mdElements.push(jsonWrap('presets', JSON.stringify(presetsSpec, null, 2)));
                    break;
                }
                case 'slider': {
                    const sliderSpec: Plugins.SliderSpec = {
                        variableId: element.variableId,
                        value: variables.find(v => v.variableId === element.variableId)?.initialValue as number,
                        label: element.label,
                        min: element.min,
                        max: element.max,
                        step: element.step,
                    };
                    mdElements.push(jsonWrap('slider', JSON.stringify(sliderSpec, null, 2)));
                    break;
                }
                case 'table': {
                    const { dataSourceName, variableId, tabulatorOptions } = element;
                    const tableSpec: Plugins.TabulatorSpec = { dataSourceName, variableId, tabulatorOptions };
                    mdElements.push(jsonWrap('tabulator', JSON.stringify(tableSpec, null, 2)));
                    break;
                }
                case 'textbox': {
                    const textboxElement = element as TextboxElement;
                    const textboxSpec: Plugins.TextboxSpec = {
                        variableId: textboxElement.variableId,
                        value: variables.find(v => v.variableId === textboxElement.variableId)?.initialValue as string,
                        label: textboxElement.label,
                        multiline: textboxElement.multiline,
                    };
                    mdElements.push(jsonWrap('textbox', JSON.stringify(textboxSpec, null, 2)));
                    break;
                }
            }
        }
    }
    const markdown = mdElements.join('\n\n');
    return markdown;
}
