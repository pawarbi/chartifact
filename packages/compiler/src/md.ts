/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { Spec as VegaSpec } from 'vega-typings';
import { TopLevelSpec as VegaLiteSpec } from "vega-lite";
import { DataSource, ElementGroup, InteractiveDocument, TableElement, Variable } from '@microsoft/chartifact-schema';
import { getChartType } from './util.js';
import { addDynamicDataLoaderToSpec, addStaticDataLoaderToSpec } from './loader.js';
import { Plugins } from '@microsoft/chartifact-markdown';
import { VegaScope } from './scope.js';
import { createSpecWithVariables } from './spec.js';
import { defaultCommonOptions } from 'common';

const defaultJsonIndent = 2;

function tickWrap(plugin: string, content: string) {
    return `\`\`\`${plugin}\n${content}\n\`\`\``;
}

function jsonWrap(type: string, content: string) {
    return tickWrap('json ' + type, content);
}

function chartWrap(spec: VegaSpec | VegaLiteSpec) {
    const chartType = getChartType(spec);
    return jsonWrap(chartType, JSON.stringify(spec, null, defaultJsonIndent));
}

function mdContainerWrap(classname: string, id: string, content: string) {
    return `::: ${classname} {#${id}}
${content}
:::`;
}

export function targetMarkdown(page: InteractiveDocument) {
    const mdSections: string[] = [];
    const dataLoaders = page.dataLoaders || [];
    const variables = page.variables || [];

    if (page.style) {
        const { style } = page;
        if (style.css) {
            let css: string;
            if (typeof style.css === 'string') {
                css = style.css;
            } else if (Array.isArray(style.css)) {
                css = style.css.join('\n');
            }
            mdSections.push(tickWrap('css', css));
        }
        if (style.googleFonts) {
            mdSections.push(jsonWrap('google-fonts', JSON.stringify(style.googleFonts, null, defaultJsonIndent)));
        }
    }

    const tableElements = page.groups.flatMap(group => group.elements.filter(e => typeof e !== 'string' && e.type === 'table'));

    const vegaScope = dataLoaderMarkdown(dataLoaders.filter(dl => dl.type !== 'spec'), variables, tableElements);

    for (const dataLoader of dataLoaders.filter(dl => dl.type === 'spec')) {
        mdSections.push(chartWrap(dataLoader.spec));
    }

    for (const group of page.groups) {
        mdSections.push(mdContainerWrap(
            defaultCommonOptions.groupClassName,
            group.groupId,
            groupMarkdown(group, variables, vegaScope, page.resources)
        ));
    }

    const { data, signals } = vegaScope.spec;

    //cleanup the vegaScope.spec
    if (data?.length === 0) {
        delete vegaScope.spec.data;
    } else {
        data.forEach(d => {
            if (d.transform?.length === 0) {
                delete d.transform;
            }
        });
    }
    if (signals?.length === 0) {
        delete vegaScope.spec.signals;
    }

    if (vegaScope.spec.data || vegaScope.spec.signals) {
        //spec is towards the top of the markdown file
        mdSections.unshift(chartWrap(vegaScope.spec));
    }

    if (page.notes) {
        //add notes at the very top of the markdown file
        if (Array.isArray(page.notes)) {

            mdSections.unshift(tickWrap('#', page.notes.map(n => {
                if (typeof n === 'object') {
                    return JSON.stringify(n, null, defaultJsonIndent);
                } else if (typeof n === 'string') {
                    return n;
                } else {
                    return JSON.stringify(n);
                }
            }).join('\n')));
        } else {
            mdSections.unshift(tickWrap('#', JSON.stringify(page.notes, null, defaultJsonIndent)));
        }
    }

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

function groupMarkdown(group: ElementGroup, variables: Variable[], vegaScope: VegaScope, resources: { charts?: { [chartKey: string]: VegaSpec | VegaLiteSpec } }) {
    const mdElements: string[] = [];

    const addSpec = (pluginName: Plugins.PluginNames, spec: pluginSpecs, indent = true) => {
        const content = indent ? JSON.stringify(spec, null, defaultJsonIndent) : JSON.stringify(spec);
        mdElements.push(jsonWrap(pluginName, content));
    }

    for (const element of group.elements) {
        if (typeof element === 'string') {
            mdElements.push(element);
        } else if (typeof element === 'object') {
            switch (element.type) {
                case 'chart': {
                    const { chartKey } = element;
                    const spec = resources?.charts?.[chartKey];
                    //see if it's a placeholder or a full chart
                    if (!spec) {
                        //add a markdown element (not a chart element) with an image of the spinner at /img/chart-spinner.gif
                        mdElements.push('![Chart Spinner](/img/chart-spinner.gif)');
                    } else {
                        mdElements.push(chartWrap(spec));
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
                    addSpec('checkbox', cbSpec, false);
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
                    addSpec('slider', sliderSpec, false);
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
                    addSpec('textbox', textboxSpec, false);
                    break;
                }
                default: {
                    //output as a comment
                    mdElements.push(tickWrap('#', JSON.stringify(element)));
                }
            }
        } else {
            //output as a comment
            mdElements.push(tickWrap('#', JSON.stringify(element)));
        }
    }
    const markdown = mdElements.join('\n\n');
    return markdown;
}
