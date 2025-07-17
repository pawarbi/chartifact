/*!
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { Batch, definePlugin, IInstance, Plugin } from '../factory.js';
import { sanitizedHTML } from '../sanitize.js';

interface CheckboxInstance {
    id: string;
    spec: CheckboxSpec;
    element: HTMLInputElement;
}

export interface CheckboxSpec {
    name: string;
    value?: boolean;
    label?: string;
}

export const checkboxPlugin: Plugin = {
    name: 'checkbox',
    initializePlugin: (md) => definePlugin(md, 'checkbox'),
    fence: (token, idx) => {
        const CheckboxId = `Checkbox-${idx}`;
        return sanitizedHTML('div', { id: CheckboxId, class: 'checkbox' }, token.content.trim());
    },
    hydrateComponent: async (renderer, errorHandler) => {
        const checkboxInstances: CheckboxInstance[] = [];
        const containers = renderer.element.querySelectorAll('.checkbox');
        for (const [index, container] of Array.from(containers).entries()) {
            if (!container.textContent) continue;

            try {
                const spec: CheckboxSpec = JSON.parse(container.textContent);

                const html = `<form class="vega-bindings">
                    <div class="vega-bind">
                        <label>
                            <span class="vega-bind-name">${spec.label || spec.name}</span>
                            <input type="checkbox" class="vega-bind-checkbox" id="${spec.name}" name="${spec.name}" ${spec.value ? 'checked' : ''}>
                        </label>
                    </div>
                </form>`;
                container.innerHTML = html;
                const element = container.querySelector('input[type="checkbox"]') as HTMLInputElement;

                const checkboxInstance: CheckboxInstance = { id: container.id, spec, element };
                checkboxInstances.push(checkboxInstance);
            } catch (e) {
                container.innerHTML = `<div class="error">${e.toString()}</div>`;
                errorHandler(e, 'Checkbox', index, 'parse', container);
                continue;
            }
        }
        
        const instances: IInstance[] = checkboxInstances.map((checkboxInstance) => {
            const { element, spec } = checkboxInstance;
            const initialSignals = [{
                name: spec.name,
                value: spec.value || false,
                priority: 1,
                isData: false,
            }];
            
            return {
                ...checkboxInstance,
                initialSignals,
                recieveBatch: async (batch) => {
                    if (batch[spec.name]) {
                        const value = batch[spec.name].value as boolean;
                        element.checked = value;
                    }
                },
                beginListening() {
                    // Wire up handler to send the checked value to the signal bus
                    element.addEventListener('change', (e) => {
                        const value = (e.target as HTMLInputElement).checked;
                        const batch: Batch = {
                            [spec.name]: {
                                value,
                                isData: false,
                            },
                        };
                        renderer.signalBus.broadcast(checkboxInstance.id, batch);
                    });
                },
                getCurrentSignalValue: () => {
                    return element.checked;
                },
                destroy: () => {
                    element.removeEventListener('change', checkboxInstance.element.onchange as EventListener);
                },
            };
        });
        return instances;
    },
};
