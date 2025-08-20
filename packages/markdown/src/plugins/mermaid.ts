/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

/*
* Mermaid Plugin - Renders Mermaid diagrams with flexible input modes
*
* USAGE EXAMPLES:
*
* 1. Raw Mermaid Text (simplest):
* ```mermaid
* flowchart TD
*     A[Start] --> B[Process]
*     B --> C[End]
* ```
*
* 2. String Input via Signal (textbox → diagram):
* ```mermaid
* {
*   "dataSourceName": "userInput",
*   "variableId": "generatedDiagram"
* }
* ```
* When userInput signal contains complete Mermaid text, renders directly.
*
* 3. Template-Driven with Data (structured data → diagram):
* ```mermaid
* {
*   "template": {
*     "diagramType": "flowchart TD",
*     "lineTemplates": {
*       "node": "    {{id}}[{{label}}]",
*       "link": "    {{from}} --> {{to}}"
*     }
*   },
*   "dataSourceName": "diagramData",
*   "variableId": "outputDiagram"
* }
* ```
* With data like:
* [
*   {"template": "node", "id": "A", "label": "Start"},
*   {"template": "node", "id": "B", "label": "Process"},
*   {"template": "link", "from": "A", "to": "B"}
* ]
*/

import { Plugin, RawFlaggableSpec, IInstance } from '../factory.js';
import { ErrorHandler } from '../renderer.js';
import { SignalBus } from '../signalbus.js';
import { sanitizedHTML } from '../sanitize.js';
import { flaggableJsonPlugin } from './config.js';
import { pluginClassName } from './util.js';
import { PluginNames } from './interfaces.js';
import { tokenizeTemplate } from 'common';
import mermaid, { MermaidConfig } from 'mermaid';

interface MermaidInstance {
    id: string;
    spec: MermaidSpec | string;
    container: Element;
    isDataDriven: boolean;
    lastRenderedData?: any[];
}

export interface MermaidSpec {
    template?: {
        diagramType: string;
        lineTemplates: { [templateName: string]: string };
    };
    dataSourceName?: string;
    variableId?: string;
}

interface MermaidDataItem {
    template: string;
    [key: string]: any;
}

const pluginName: PluginNames = 'mermaid';
const className = pluginClassName(pluginName);

function inspectMermaidSpec(spec: MermaidSpec | string): RawFlaggableSpec<MermaidSpec | string> {
    const reasons: string[] = [];
    let hasFlags = false;

    if (typeof spec === 'string') {
        // For raw text mode, check for potentially dangerous content
        const dangerousPatterns = [
            /javascript:/i,
            /<script/i,
            /onclick=/i,
            /onerror=/i,
            /onload=/i,
            /href\s*=\s*["']javascript:/i
        ];

        for (const pattern of dangerousPatterns) {
            if (pattern.test(spec)) {
                hasFlags = true;
                reasons.push('Potentially unsafe content detected in diagram');
                break;
            }
        }
    } else {
        // For JSON template mode, validate structure
        // template is optional - only needed if using template mode
        if (spec.template && typeof spec.template !== 'object') {
            hasFlags = true;
            reasons.push('template must be an object if provided');
        } else if (spec.template) {
            // Validate diagram
            if (!spec.template.diagramType || typeof spec.template.diagramType !== 'string') {
                hasFlags = true;
                reasons.push('template.diagram must be a non-empty string');
            }

            // Validate lineTemplates
            if (!spec.template.lineTemplates || typeof spec.template.lineTemplates !== 'object') {
                hasFlags = true;
                reasons.push('template.lineTemplates must be an object');
            } else {
                // Check templates for dangerous content
                for (const [templateName, template] of Object.entries(spec.template.lineTemplates)) {
                    if (typeof template !== 'string') {
                        hasFlags = true;
                        reasons.push(`Template '${templateName}' must be a string`);
                    }
                }
            }
        }

        // Must have dataSourceName for dynamic content
        if (!spec.dataSourceName) {
            hasFlags = true;
            reasons.push('Must specify dataSourceName for dynamic content');
        }
    }

    return {
        spec,
        hasFlags,
        reasons,
    };
}

// Helper to lazy load Mermaid from CDN and initialize it
let mermaidLoadPromise: Promise<void> | null = null;
function loadMermaidFromCDN(): Promise<void> {
    if (mermaidLoadPromise) return mermaidLoadPromise;
    mermaidLoadPromise = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/mermaid@11.10.0/dist/mermaid.min.js';
        script.async = true;
        script.onload = () => {
            if (mermaid) {
                mermaid.initialize({
                    startOnLoad: true,
                    theme: 'default',
                    securityLevel: 'strict',
                    fontFamily: 'sans-serif'
                } as MermaidConfig);
            }
            resolve();
        };
        script.onerror = () => reject(new Error('Failed to load Mermaid from CDN'));
        document.head.appendChild(script);
    });
    return mermaidLoadPromise;
}

export const mermaidPlugin: Plugin<MermaidSpec | string> = {
    ...flaggableJsonPlugin<MermaidSpec | string>(pluginName, className, inspectMermaidSpec),
    fence: (token, index) => {
        const content = token.content.trim();
        let spec: MermaidSpec | string;
        let flaggableSpec: RawFlaggableSpec<MermaidSpec | string>;

        // Try to parse as JSON first
        try {
            const parsed = JSON.parse(content);
            if (parsed && typeof parsed === 'object' && (parsed.dataSourceName || parsed.template)) {
                spec = parsed as MermaidSpec;
            } else {
                // If it's JSON but not a valid MermaidSpec, treat as raw text
                spec = content;
            }
        } catch (e) {
            // If JSON parsing fails, treat as raw text
            spec = content;
        }

        flaggableSpec = inspectMermaidSpec(spec);
        const json = JSON.stringify(flaggableSpec);

        return sanitizedHTML('div', { class: className, id: `${pluginName}-${index}` }, json, true);
    },
    hydrateComponent: async (renderer, errorHandler, specs) => {
        const { signalBus } = renderer;
        const mermaidInstances: MermaidInstance[] = [];

        for (let index = 0; index < specs.length; index++) {
            const specReview = specs[index];
            if (!specReview.approvedSpec) {
                continue;
            }
            const container = renderer.element.querySelector(`#${specReview.containerId}`);
            if (!container) {
                continue;
            }

            const spec = specReview.approvedSpec;
            const isDataDriven = typeof spec === 'object' && !!spec.dataSourceName;

            // Create container for the diagram
            container.innerHTML = `<div class="mermaid-diagram" style="text-align: center; padding: 20px;">
                ${typeof mermaid === 'undefined' ?
                    '<div class="error">Mermaid library not loaded</div>' :
                    '<div class="mermaid-loading">Loading diagram...</div>'
                }
            </div>`;

            const mermaidInstance: MermaidInstance = {
                id: `${pluginName}-${index}`,
                spec,
                container,
                isDataDriven,
            };
            mermaidInstances.push(mermaidInstance);

            // For raw text mode, render immediately
            if (!isDataDriven && typeof spec === 'string') {
                await renderRawDiagram(mermaidInstance, spec, errorHandler, pluginName, index);
            }
        }

        const instances = mermaidInstances.map((mermaidInstance, index): IInstance => {
            const { spec, isDataDriven } = mermaidInstance;

            const initialSignals = [];

            if (isDataDriven && typeof spec === 'object' && spec.dataSourceName) {
                initialSignals.push({
                    name: spec.dataSourceName,
                    value: null,
                    priority: -1,
                    isData: true,
                });
            }

            // Add output signal for generated Mermaid text (data-driven mode only)
            if (isDataDriven && typeof spec === 'object' && spec.variableId) {
                initialSignals.push({
                    name: spec.variableId,
                    value: '',
                    priority: 1,
                    isData: false,
                });
            }

            return {
                ...mermaidInstance,
                initialSignals,
                receiveBatch: async (batch) => {
                    if (isDataDriven && typeof spec === 'object' && spec.dataSourceName) {
                        const newData = batch[spec.dataSourceName]?.value;
                        if (newData) {
                            if (typeof newData === 'string') {
                                // Handle string input - render as raw Mermaid text
                                await renderRawDiagram(mermaidInstance, newData, errorHandler, pluginName, index);

                                // Broadcast the string if variableId is specified
                                if (spec.variableId && signalBus) {
                                    signalBus.broadcast(mermaidInstance.id, {
                                        [spec.variableId]: {
                                            value: newData,
                                            isData: false,
                                        }
                                    });
                                }
                            } else if (Array.isArray(newData)) {
                                // Handle array input - use template system
                                await renderDataDrivenDiagram(mermaidInstance, newData, errorHandler, pluginName, index, signalBus);
                            }
                        }
                    }
                }
            };
        });

        return instances;
    },
};

async function renderRawDiagram(instance: MermaidInstance, diagramText: string, errorHandler: ErrorHandler, pluginName: string, index: number) {
    const diagramContainer = instance.container.querySelector('.mermaid-diagram') as HTMLElement;
    if (!diagramContainer) return;

    // Ensure Mermaid is loaded
    await loadMermaidFromCDN();

    if (typeof mermaid === 'undefined') {
        diagramContainer.innerHTML = '<div class="error">Mermaid library not loaded</div>';
        return;
    }

    try {
        const uniqueId = `mermaid-${instance.id}-${Date.now()}`;
        const { svg } = await mermaid.render(uniqueId, diagramText);
        diagramContainer.innerHTML = svg;
    } catch (error) {
        diagramContainer.innerHTML = `<div class="error">Failed to render diagram</div>`;
        errorHandler(error instanceof Error ? error : new Error(String(error)), pluginName, index, 'render', instance.container);
    }
}

async function renderDataDrivenDiagram(instance: MermaidInstance, data: MermaidDataItem[], errorHandler: ErrorHandler, pluginName: string, index: number, signalBus?: SignalBus) {
    const spec = instance.spec as MermaidSpec;
    const diagramContainer = instance.container.querySelector('.mermaid-diagram') as HTMLElement;

    // Ensure Mermaid is loaded
    await loadMermaidFromCDN();
    if (!diagramContainer || typeof mermaid === 'undefined') return;

    try {
        // Skip re-rendering if data hasn't changed
        if (instance.lastRenderedData && instance.lastRenderedData === data) {
            return;
        }
        instance.lastRenderedData = data;

        // Generate diagram text from template and data
        const lines: string[] = [];

        // Add diagram type from template
        if (spec.template?.diagramType) {
            lines.push(spec.template.diagramType);
        }

        for (const item of data) {
            const templateName = item.template;
            const template = spec.template?.lineTemplates?.[templateName];

            if (!template) {
                console.warn(`Template '${templateName}' not found in lineTemplates`);
                continue;
            }

            // Use tokenizeTemplate to parse placeholders
            const tokens = tokenizeTemplate(template);

            // Replace variables with actual values
            let line = '';
            for (const token of tokens) {
                if (token.type === 'literal') {
                    line += token.value;
                } else if (token.type === 'variable') {
                    const value = item[token.name];
                    if (value !== undefined) {
                        line += String(value);
                    }
                    // If value is undefined, we leave the placeholder empty (could also leave the original {{var}} if preferred)
                }
            }

            lines.push(line);
        }

        const diagramText = lines.join('\n');

        // Broadcast the generated Mermaid text if variableId is specified
        if (spec.variableId && signalBus) {
            signalBus.broadcast(instance.id, {
                [spec.variableId]: {
                    value: diagramText,
                    isData: false,
                }
            });
        }

        if (diagramText) {
            const uniqueId = `mermaid-${instance.id}-${Date.now()}`;
            const { svg } = await mermaid.render(uniqueId, diagramText);
            diagramContainer.innerHTML = svg;
        } else {
            diagramContainer.innerHTML = '<div class="error">No valid diagram data provided</div>';
        }
    } catch (error) {
        diagramContainer.innerHTML = `<div class="error">Failed to render diagram</div>`;
        errorHandler(error instanceof Error ? error : new Error(String(error)), pluginName, index, 'render', instance.container);
    }
}
