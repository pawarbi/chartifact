/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { Spec as VegaSpec } from 'vega-typings';
import { TopLevelSpec as VegaLiteSpec } from "vega-lite";
import { ChartFull, DataSource, ElementGroup, InteractiveDocument, TableElement, Variable } from '@microsoft/chartifact-schema';
import { getChartType } from './util.js';
import { addDynamicDataLoaderToSpec, addStaticDataLoaderToSpec } from './loader.js';
import { Plugins } from '@microsoft/chartifact-markdown';
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

    const tableElements = page.groups.flatMap(group => group.elements.filter(e => typeof e !== 'string' && e.type === 'table'));

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
            case 'inline': {
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

type pluginSpecs = Plugins.CheckboxSpec | Plugins.DropdownSpec | Plugins.ImageSpec | Plugins.PresetsSpec | Plugins.SliderSpec | Plugins.TabulatorSpec | Plugins.TextboxSpec;

function groupMarkdown(group: ElementGroup, variables: Variable[], vegaScope: VegaScope) {
    const mdElements: string[] = [];

    const addSpec = (pluginName: Plugins.PluginNames, spec: pluginSpecs) => {
        mdElements.push(jsonWrap(pluginName, JSON.stringify(spec, null, 2)));
    }

    for (const element of group.elements) {
        if (typeof element === 'string') {
            mdElements.push(element);
        } else if (typeof element === 'object') {
            switch (element.type) {
                case 'chart': {
                    const { chart } = element;
                    const chartFull = chart as ChartFull;
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
                    const { label, variableId } = element;
                    const cbSpec: Plugins.CheckboxSpec = {
                        variableId,
                        value: variables.find(v => v.variableId === variableId)?.initialValue as boolean,
                        label,
                    };
                    addSpec('checkbox', cbSpec);
                    break;
                }
                case 'dropdown': {
                    const { label, variableId, options, dynamicOptions, multiple, size } = element;
                    const ddSpec: Plugins.DropdownSpec = {
                        variableId,
                        value: variables.find(v => v.variableId === variableId)?.initialValue as string | string[],
                        label,
                    };
                    if (dynamicOptions) {
                        const { dataSourceName, fieldName } = dynamicOptions;
                        ddSpec.dynamicOptions = {
                            dataSourceName,
                            fieldName,
                        };
                    } else {
                        ddSpec.options = options;
                    }
                    if (multiple) {
                        ddSpec.multiple = multiple;
                        ddSpec.size = size || 1;
                    }
                    addSpec('dropdown', ddSpec);
                    break;
                }
                case 'image': {
                    const { url, alt, width, height } = element;
                    const imageSpec: Plugins.ImageSpec = {
                        url,
                        alt,
                        width,
                        height,
                    };
                    addSpec('image', imageSpec);
                    break;
                }
                case 'presets': {
                    const { presets } = element;
                    const presetsSpec: Plugins.PresetsSpec = presets;
                    addSpec('presets', presetsSpec);
                    break;
                }
                case 'slider': {
                    const { label, min, max, step, variableId } = element;
                    const sliderSpec: Plugins.SliderSpec = {
                        variableId,
                        value: variables.find(v => v.variableId === variableId)?.initialValue as number,
                        label,
                        min,
                        max,
                        step,
                    };
                    addSpec('slider', sliderSpec);
                    break;
                }
                case 'table': {
                    const { dataSourceName, variableId, tabulatorOptions, editable } = element;
                    const tableSpec: Plugins.TabulatorSpec = { dataSourceName, variableId, tabulatorOptions, editable };
                    addSpec('tabulator', tableSpec);
                    break;
                }
                case 'textbox': {
                    const { variableId, label, multiline, placeholder } = element;
                    const textboxSpec: Plugins.TextboxSpec = {
                        variableId,
                        value: variables.find(v => v.variableId === variableId)?.initialValue as string,
                        label,
                        multiline,
                        placeholder,
                    };
                    addSpec('textbox', textboxSpec);
                    break;
                }
            }
        }
    }
    const markdown = mdElements.join('\n\n');
    return markdown;
}
