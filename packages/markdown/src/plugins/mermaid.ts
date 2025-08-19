/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { Plugin, RawFlaggableSpec, IInstance } from '../factory.js';
import { ErrorHandler } from '../renderer.js';
import { sanitizedHTML } from '../sanitize.js';
import { flaggableJsonPlugin } from './config.js';
import { pluginClassName } from './util.js';
import { PluginNames } from './interfaces.js';
import { tokenizeTemplate } from 'common';

declare const mermaid: {
    initialize: (config: any) => void;
    render: (id: string, graphDefinition: string) => Promise<{ svg: string }>;
    mermaidAPI: {
        render: (id: string, graphDefinition: string) => string;
    };
};

interface MermaidInstance {
    id: string;
    spec: MermaidSpec | string;
    container: Element;
    isDataDriven: boolean;
    lastRenderedData?: any[];
}

export interface MermaidSpec {
    diagramType: string;
    lineTemplates: { [templateName: string]: string };
    dataSourceName?: string;
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
        if (!spec.diagramType || typeof spec.diagramType !== 'string') {
            hasFlags = true;
            reasons.push('diagramType must be a non-empty string');
        }

        if (!spec.lineTemplates || typeof spec.lineTemplates !== 'object') {
            hasFlags = true;
            reasons.push('lineTemplates must be an object');
        } else {
            // Check templates for dangerous content
            for (const [templateName, template] of Object.entries(spec.lineTemplates)) {
                if (typeof template !== 'string') {
                    hasFlags = true;
                    reasons.push(`Template '${templateName}' must be a string`);
                }
            }
        }
    }

    return {
        spec,
        hasFlags,
        reasons,
    };
}

let mermaidInitialized = false;

export const mermaidPlugin: Plugin<MermaidSpec | string> = {
    ...flaggableJsonPlugin<MermaidSpec | string>(pluginName, className, inspectMermaidSpec),
    fence: (token, index) => {
        const content = token.content.trim();
        let spec: MermaidSpec | string;
        let flaggableSpec: RawFlaggableSpec<MermaidSpec | string>;

        // Try to parse as JSON first
        try {
            const parsed = JSON.parse(content);
            if (parsed && typeof parsed === 'object' && (parsed.diagramType || parsed.lineTemplates)) {
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
        const mermaidInstances: MermaidInstance[] = [];

        // Initialize Mermaid only once
        if (!mermaidInitialized && typeof mermaid !== 'undefined') {
            mermaid.initialize({
                startOnLoad: false,
                theme: 'default',
                securityLevel: 'strict',
                fontFamily: 'Arial, sans-serif'
            });
            mermaidInitialized = true;
        }

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
            
            const initialSignals = isDataDriven && typeof spec === 'object' && spec.dataSourceName 
                ? [{
                    name: spec.dataSourceName,
                    value: null,
                    priority: -1,
                    isData: true,
                }]
                : [];

            return {
                ...mermaidInstance,
                initialSignals,
                receiveBatch: async (batch) => {
                    if (isDataDriven && typeof spec === 'object' && spec.dataSourceName) {
                        const newData = batch[spec.dataSourceName]?.value;
                        if (newData && Array.isArray(newData)) {
                            await renderDataDrivenDiagram(mermaidInstance, newData, errorHandler, pluginName, index);
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

    if (typeof mermaid === 'undefined') {
        diagramContainer.innerHTML = '<div class="error">Mermaid library not loaded</div>';
        return;
    }

    try {
        const uniqueId = `mermaid-${instance.id}-${Date.now()}`;
        const { svg } = await mermaid.render(uniqueId, diagramText);
        diagramContainer.innerHTML = svg;
    } catch (error) {
        diagramContainer.innerHTML = `<div class="error">Failed to render diagram: ${error.message}</div>`;
        errorHandler(error instanceof Error ? error : new Error(String(error)), pluginName, index, 'render', instance.container);
    }
}

async function renderDataDrivenDiagram(instance: MermaidInstance, data: MermaidDataItem[], errorHandler: ErrorHandler, pluginName: string, index: number) {
    const spec = instance.spec as MermaidSpec;
    const diagramContainer = instance.container.querySelector('.mermaid-diagram') as HTMLElement;
    if (!diagramContainer || typeof mermaid === 'undefined') return;

    try {
        // Skip re-rendering if data hasn't changed
        if (instance.lastRenderedData && JSON.stringify(instance.lastRenderedData) === JSON.stringify(data)) {
            return;
        }
        instance.lastRenderedData = data;

        // Generate diagram text from template and data
        const lines: string[] = [spec.diagramType];
        
        for (const item of data) {
            const templateName = item.template;
            const template = spec.lineTemplates[templateName];
            
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
        
        const uniqueId = `mermaid-${instance.id}-${Date.now()}`;
        const { svg } = await mermaid.render(uniqueId, diagramText);
        diagramContainer.innerHTML = svg;
    } catch (error) {
        diagramContainer.innerHTML = `<div class="error">Failed to render diagram: ${error.message}</div>`;
        errorHandler(error instanceof Error ? error : new Error(String(error)), pluginName, index, 'render', instance.container);
    }
}
