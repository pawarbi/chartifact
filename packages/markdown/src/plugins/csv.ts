/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { read } from 'vega';
import { Batch, IInstance, Plugin, RawFlaggableSpec } from '../factory.js';
import { sanitizedHTML, sanitizeHtmlComment } from '../sanitize.js';
import { pluginClassName } from './util.js';
import { PluginNames } from './interfaces.js';
import { SpecReview } from 'common';

interface CsvInstance {
    id: string;
    spec: CsvSpec;
    data: object[];
}

export interface CsvSpec {
    variableId: string;
    wasDefaultId?: boolean; // Flag to track if we used a default ID
}

function inspectCsvSpec(spec: CsvSpec): RawFlaggableSpec<CsvSpec> {
    const result: RawFlaggableSpec<CsvSpec> = {
        spec,
        hasFlags: false,
        reasons: []
    };

    // Flag if we had to use a default variable ID
    if (spec.wasDefaultId) {
        result.hasFlags = true;
        result.reasons.push('No variable ID specified - using default');
    }
    
    return result;
}

const pluginName: PluginNames = 'csv';
const className = pluginClassName(pluginName);

export const csvPlugin: Plugin<CsvSpec> = {
    name: pluginName,
    fence: (token, index) => {
        const csvContent = token.content.trim();
        const info = token.info.trim();
        
        // Extract variableId from the fence info or provide default
        const parts = info.split(/\s+/);
        const wasDefaultId = parts.length < 2;
        const variableId = wasDefaultId ? `csvData${index}` : parts[1];
        
        return sanitizedHTML('pre', { 
            id: `${pluginName}-${index}`, 
            class: className,
            style: 'display:none',
            'data-variable-id': variableId,
            'data-was-default-id': wasDefaultId.toString()
        }, csvContent, false);
    },
    hydrateSpecs: (renderer, errorHandler) => {
        const flagged: SpecReview<CsvSpec>[] = [];
        const containers = renderer.element.querySelectorAll(`.${className}`);
        
        for (const [index, container] of Array.from(containers).entries()) {
            try {
                const variableId = container.getAttribute('data-variable-id');
                const wasDefaultId = container.getAttribute('data-was-default-id') === 'true';
                
                if (!variableId) {
                    errorHandler(new Error('No variable ID found'), pluginName, index, 'parse', container);
                    continue;
                }
                
                const spec: CsvSpec = { variableId, wasDefaultId };
                const flaggableSpec = inspectCsvSpec(spec);
                
                const f: SpecReview<CsvSpec> = { 
                    approvedSpec: null, 
                    pluginName, 
                    containerId: container.id 
                };
                
                if (flaggableSpec.hasFlags) {
                    f.blockedSpec = flaggableSpec.spec;
                    f.reason = flaggableSpec.reasons?.join(', ') || 'Unknown reason';
                } else {
                    f.approvedSpec = flaggableSpec.spec;
                }
                
                flagged.push(f);
            } catch (e) {
                errorHandler(e instanceof Error ? e : new Error(String(e)), pluginName, index, 'parse', container);
            }
        }
        
        return flagged;
    },
    hydrateComponent: async (renderer, errorHandler, specs) => {
        const { signalBus } = renderer;
        const csvInstances: CsvInstance[] = [];

        for (let index = 0; index < specs.length; index++) {
            const specReview = specs[index];
            if (!specReview.approvedSpec) {
                continue;
            }
            
            const container = renderer.element.querySelector(`#${specReview.containerId}`);
            if (!container) {
                errorHandler(new Error('Container not found'), pluginName, index, 'init', null);
                continue;
            }

            try {
                const csvContent = container.textContent?.trim();
                if (!csvContent) {
                    errorHandler(new Error('No CSV content found'), pluginName, index, 'parse', container);
                    continue;
                }
                
                const spec: CsvSpec = specReview.approvedSpec;
                
                // Parse CSV content using vega.read
                const data = read(csvContent, { type: 'csv' });
                
                const csvInstance: CsvInstance = { 
                    id: `${pluginName}-${index}`, 
                    spec, 
                    data 
                };
                csvInstances.push(csvInstance);
                
                // Add a safe comment before the container to show that CSV was loaded
                const comment = sanitizeHtmlComment(`CSV data loaded: ${data.length} rows for variable '${spec.variableId}'`);
                container.insertAdjacentHTML('beforebegin', comment);
                
            } catch (e) {
                errorHandler(e instanceof Error ? e : new Error(String(e)), pluginName, index, 'parse', container);
            }
        }

        const instances = csvInstances.map((csvInstance): IInstance => {
            const { spec, data } = csvInstance;
            
            const initialSignals = [{
                name: spec.variableId,
                value: data,
                priority: 1,
                isData: true,
            }];

            return {
                ...csvInstance,
                initialSignals,
                beginListening() {
                    // CSV data is static, but we broadcast it when listening begins
                    const batch: Batch = {
                        [spec.variableId]: {
                            value: data,
                            isData: true,
                        },
                    };
                    signalBus.broadcast(csvInstance.id, batch);
                },
                getCurrentSignalValue: () => {
                    return data;
                },
                destroy: () => {
                    // No cleanup needed for CSV data
                },
            };
        });
        
        return instances;
    },
};
