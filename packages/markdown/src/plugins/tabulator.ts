/*!
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { Batch, IInstance, Plugin, RawFlaggableSpec } from '../factory.js';
import { Tabulator as TabulatorType, Options as TabulatorOptions } from 'tabulator-tables';
import { pluginClassName } from './util.js';
import { TableElementProps } from 'schema';
import { flaggableJsonPlugin } from './config.js';

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

export function inspectTabulatorSpec(spec: TabulatorSpec) {
    //TODO inspect spec for flags, such as http:// instead of https://, or other security issues
    const flaggableSpec: RawFlaggableSpec<TabulatorSpec> = {
        spec,
    };
    return flaggableSpec;
}

const pluginName = 'tabulator';
const className = pluginClassName(pluginName);

export const tabulatorPlugin: Plugin<TabulatorSpec> = {
    ...flaggableJsonPlugin<TabulatorSpec>(pluginName, className, inspectTabulatorSpec, { style: 'box-sizing: border-box;' }),
    hydrateComponent: async (renderer, errorHandler, specs) => {
        const tabulatorInstances: TabulatorInstance[] = [];
        for (let index = 0; index < specs.length; index++) {
            const specReview = specs[index];
            if (!specReview.approvedSpec) {
                continue;
            }
            const container = renderer.element.querySelector(`#${specReview.containerId}`);

            if (!Tabulator && index === 0) {
                errorHandler(new Error('Tabulator not found'), pluginName, index, 'init', container);
                continue;
            }

            const spec: TabulatorSpec = specReview.approvedSpec;

            if (!spec.dataSourceName || !spec.variableId) {
                errorHandler(new Error('Tabulator requires dataSourceName and variableId'), pluginName, index, 'init', container);
                continue;
            } else if (spec.dataSourceName === spec.variableId) {
                errorHandler(new Error('Tabulator dataSourceName and variableId cannot be the same'), pluginName, index, 'init', container);
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
                name: tabulatorInstance.spec.dataSourceName,
                value: null,
                priority: -1,
                isData: true,
            }];
            if (tabulatorInstance.spec.options?.selectableRows) {
                initialSignals.push({
                    name: tabulatorInstance.spec.variableId,
                    value: [],
                    priority: -1,
                    isData: true,
                });
            }
            return {
                ...tabulatorInstance,
                initialSignals,
                recieveBatch: async (batch) => {
                    const newData = batch[tabulatorInstance.spec.dataSourceName]?.value as object[];
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
                                const matchData = signalName === tabulatorInstance.spec.variableId;
                                if (matchData) {
                                    tabulatorInstance.table.on('rowSelectionChanged', (e, rows) => {
                                        const selectedData = tabulatorInstance.table.getSelectedData();
                                        const batch: Batch = {
                                            [tabulatorInstance.spec.variableId]: {
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
