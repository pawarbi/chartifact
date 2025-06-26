import { Spec as VegaSpec } from 'vega-typings';
import { TopLevelSpec as VegaLiteSpec } from "vega-lite";
import { ChartFull, DataSource, ElementGroup, extendedElements, InteractiveExplanatoryPage, Variable } from 'dsl';
import { getChartType } from './util.js';
import { addDynamicDataLoaderToSpec, createSpecWithVariables, VegaScope } from './loader.js';
import { Plugins } from '@microsoft/interactive-document-renderer';

function mdWrap(type: string, content: string) {
    return `\`\`\`${type}\n${content}\n\`\`\``;
}

function chartWrap(spec: VegaSpec | VegaLiteSpec) {
    const chartType = getChartType(spec);
    return mdWrap(chartType, JSON.stringify(spec, null, 4));
}

function mdContainerWrap(id: string, content: string) {
    return `::: markdown-block {#${id}}
${content}
:::`;
}

const $schema = "https://vega.github.io/schema/vega/v5.json";

export function targetMarkdown(page: InteractiveExplanatoryPage<extendedElements>) {
    const mdSections: string[] = [];

    const vegaScope = dataLoaderMarkdown(page.dataLoaders.filter(dl => dl.type !== 'spec'), page.variables);

    for (const dataLoader of page.dataLoaders.filter(dl => dl.type === 'spec')) {
        mdSections.push(chartWrap(dataLoader.spec));
    }

    for (const group of page.groups) {
        mdSections.push(mdContainerWrap(group.groupId, groupMarkdown(group, page.variables, vegaScope)));
    }

    //spec is at the top of the markdown file
    mdSections.unshift(chartWrap(vegaScope.spec));

    const markdown = mdSections.join('\n\n');
    return markdown;
}

function dataLoaderMarkdown(dataSources: DataSource[], variables: Variable[]) {

    //create a Vega spec with all variables
    const spec = createSpecWithVariables(variables);
    const vegaScope = new VegaScope(spec);

    for (const dataSource of dataSources) {

        switch (dataSource.type) {
            case 'file': {
                //TODO
                break;
            }
            case 'url': {
                addDynamicDataLoaderToSpec(vegaScope, dataSource);
                break;
            }
        }

        //TODO: only add this if there is a selectable table ?

        //add a special "-selected" data item
        if (!spec.data) {
            spec.data = [];
        }
        spec.data.push({
            name: dataSource.dataSourceName + '-selected',
        });
    }

    return vegaScope;
}

function groupMarkdown(group: ElementGroup<extendedElements>, variables: Variable[], vegaScope: VegaScope) {
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
                    const spec: VegaSpec = {
                        $schema,
                        signals: [
                            {
                                name: element.variableId,
                                value: variables.find(v => v.variableId === element.variableId)?.initialValue,
                                bind: {
                                    input: "checkbox",
                                }
                            }
                        ]
                    };
                    mdElements.push(chartWrap(spec));
                    break;
                }
                case 'dropdown': {
                    const ddSpec: Plugins.DropdownSpec = {
                        name: element.variableId,
                        value: variables.find(v => v.variableId === element.variableId)?.initialValue as string | string[],
                        label: element.label,
                    };
                    if (element.dynamicOptions) {
                        ddSpec.dynamicOptions = {
                            dataSignalName: element.dynamicOptions.dataSourceName,
                            fieldName: element.dynamicOptions.fieldName,
                        };
                    } else {
                        ddSpec.options = element.options;
                    }
                    if (element.multiple) {
                        ddSpec.multiple = element.multiple;
                        ddSpec.size = element.size || 1;
                    }

                    mdElements.push(mdWrap('dropdown', JSON.stringify(ddSpec, null, 2)));
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
                    mdElements.push(mdWrap('image', JSON.stringify(imageSpec, null, 2)));
                    break;
                }
                case 'presets': {
                    const presetsSpec: Plugins.PresetsSpec = element.presets;
                    mdElements.push(mdWrap('presets', JSON.stringify(presetsSpec, null, 2)));
                    break;
                }
                case 'slider': {
                    const spec: VegaSpec = {
                        $schema,
                        signals: [
                            {
                                name: element.variableId,
                                value: variables.find(v => v.variableId === element.variableId)?.initialValue,
                                bind: {
                                    input: "range",
                                    min: element.min,
                                    max: element.max,
                                    step: element.step,
                                    debounce: 100,
                                }
                            }
                        ]
                    };
                    mdElements.push(chartWrap(spec));
                    break;
                }
                case 'table': {
                    const tableSpec: Plugins.TabulatorSpec = {
                        dataSignalName: element.dataSourceName,
                        options: element.options,
                    };
                    mdElements.push(mdWrap('tabulator', JSON.stringify(tableSpec, null, 2)));
                    break;
                }
                case 'textbox': {
                    const spec: VegaSpec = {
                        $schema,
                        signals: [
                            {
                                name: element.variableId,
                                value: variables.find(v => v.variableId === element.variableId)?.initialValue,
                                bind: {
                                    input: "text",
                                    debounce: 100,
                                }
                            }
                        ]
                    };
                    mdElements.push(chartWrap(spec));
                    break;
                }
            }
        }
    }
    const markdown = mdElements.join('\n\n');
    return markdown;
}
