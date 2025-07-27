/*!
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { defaultCommonOptions } from 'common';
import { Batch, definePlugin, IInstance, Plugin } from '../factory.js';
import { sanitizedHTML } from '../sanitize.js';
import { Tabulator as TabulatorType, Options as TabulatorOptions } from 'tabulator-tables';
import { getJsonScriptTag, pluginClassName } from './util.js';
import { TableElementProps } from 'schema';

interface TabulatorInstance {
    id: string;
    spec: TabulatorSpec;
    table: TabulatorType;
    built: boolean;
}

export interface TabulatorSpec extends TableElementProps {
    options?: TabulatorOptions;
}

declare const Tabulator: typeof TabulatorType;

const pluginName = 'tabulator';
const className = pluginClassName(pluginName);

export const tabulatorPlugin: Plugin = {
    name: pluginName,
    initializePlugin: (md) => definePlugin(md, pluginName),
    fence: token => {
        return sanitizedHTML('div', { class: className, style: 'box-sizing: border-box;' }, token.content.trim(), true);
    },
    hydrateComponent: async (renderer, errorHandler) => {
        const tabulatorInstances: TabulatorInstance[] = [];
        const containers = renderer.element.querySelectorAll(`.${className}`);
        for (const [index, container] of Array.from(containers).entries()) {
            const jsonObj = getJsonScriptTag(container, e => errorHandler(e, pluginName, index, 'parse', container));
            if (!jsonObj) continue;

            if (!Tabulator && index === 0) {
                errorHandler(new Error('Tabulator not found'), pluginName, index, 'init', container);
                continue;
            }

            const spec: TabulatorSpec = jsonObj;

            if (!spec.input_dataSourceName || !spec.output_dataSourceName) {
                errorHandler(new Error('Tabulator requires input_dataSourceName and output_dataSourceName'), pluginName, index, 'init', container);
                continue;
            } else if (spec.input_dataSourceName === spec.output_dataSourceName) {
                errorHandler(new Error('Tabulator input_dataSourceName and output_dataSourceName cannot be the same'), pluginName, index, 'init', container);
                continue;
            }

            let options: TabulatorOptions = {
                autoColumns: true,
                layout: 'fitColumns',
                maxHeight: '200px',
            };

            //see if default options is an object with no properties
            if (spec.options && Object.keys(spec.options).length > 0) {
                options = spec.options;
            }

            const table = new Tabulator(container as HTMLElement, options);
            const tabulatorInstance: TabulatorInstance = { id: `${pluginName}-${index}`, spec, table, built: false };
            table.on('tableBuilt', () => {
                table.off('tableBuilt');
                tabulatorInstance.built = true;
            });
            tabulatorInstances.push(tabulatorInstance);
        }
        const instances: IInstance[] = tabulatorInstances.map((tabulatorInstance, index) => {
            const initialSignals = [{
                name: tabulatorInstance.spec.input_dataSourceName,
                value: null,
                priority: -1,
                isData: true,
            }];
            if (tabulatorInstance.spec.options?.selectableRows) {
                initialSignals.push({
                    name: tabulatorInstance.spec.output_dataSourceName,
                    value: [],
                    priority: -1,
                    isData: true,
                });
            }
            return {
                ...tabulatorInstance,
                initialSignals,
                recieveBatch: async (batch) => {
                    const newData = batch[tabulatorInstance.spec.input_dataSourceName]?.value as object[];
                    if (newData) {
                        //make sure tabulator is ready before setting data
                        if (!tabulatorInstance.built) {
                            tabulatorInstance.table.off('tableBuilt');
                            tabulatorInstance.table.on('tableBuilt', () => {
                                tabulatorInstance.built = true;
                                tabulatorInstance.table.off('tableBuilt');
                                tabulatorInstance.table.setData(newData);
                            });
                        } else {
                            tabulatorInstance.table.setData(newData);
                        }
                    }
                },
                beginListening(sharedSignals) {
                    if (tabulatorInstance.spec.options?.selectableRows) {
                        for (const { isData, signalName } of sharedSignals) {
                            if (isData) {
                                const matchData = signalName === tabulatorInstance.spec.output_dataSourceName;
                                if (matchData) {
                                    tabulatorInstance.table.on('rowSelectionChanged', (e, rows) => {
                                        const selectedData = tabulatorInstance.table.getSelectedData();
                                        const batch: Batch = {
                                            [tabulatorInstance.spec.output_dataSourceName]: {
                                                value: selectedData,
                                                isData: true,
                                            },
                                        };
                                        renderer.signalBus.log(tabulatorInstance.id, 'sending batch', batch);
                                        renderer.signalBus.broadcast(tabulatorInstance.id, batch);
                                    });
                                }
                            }
                        }
                    }
                },
                getCurrentSignalValue() {
                    return tabulatorInstance.table.getSelectedData();
                },
                destroy: () => {
                    tabulatorInstance.table.destroy();
                },
            };
        });
        return instances;
    },
};
