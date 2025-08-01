/*!
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { ImageElementProps } from '@microsoft/chartifact-schema';
import { IInstance, Plugin } from '../factory.js';
import { pluginClassName } from './util.js';
import { flaggableJsonPlugin } from './config.js';
import { PluginNames } from './interfaces.js';
import { DynamicUrl } from './url.js';

export interface ImageSpec extends ImageElementProps {
}

interface ImageInstance {
    id: string;
    spec: ImageSpec;
    img: HTMLImageElement;
    spinner: HTMLDivElement;
}

enum ImageOpacity {
    full = '1',
    loading = '0.1',
    error = '0.5',
}

const pluginName: PluginNames = 'image';
const className = pluginClassName(pluginName);

export const imagePlugin: Plugin<ImageSpec> = {
    ...flaggableJsonPlugin<ImageSpec>(pluginName, className),
    hydrateComponent: async (renderer, errorHandler, specs) => {
        const imageInstances: ImageInstance[] = [];
        for (let index = 0; index < specs.length; index++) {
            const specReview = specs[index];
            if (!specReview.approvedSpec) {
                continue;
            }
            const container = renderer.element.querySelector(`#${specReview.containerId}`);

            const spec: ImageSpec = specReview.approvedSpec;
            const img = document.createElement('img');
            const spinner = document.createElement('div');
            spinner.innerHTML = `
                    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="gray" stroke-width="2" fill="none" stroke-dasharray="31.4" stroke-dashoffset="0">
                            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                        </circle>
                    </svg>`;

            if (spec.alt) img.alt = spec.alt;
            if (spec.width) img.width = spec.width;
            if (spec.height) img.height = spec.height;
            img.onload = () => {
                spinner.style.display = 'none';
                img.style.opacity = ImageOpacity.full;
            };
            img.onerror = () => {
                spinner.style.display = 'none';
                img.style.opacity = ImageOpacity.error;
                errorHandler(new Error('Image failed to load'), pluginName, index, 'load', container, img.src);
            };

            (container as HTMLElement).style.position = 'relative';
            spinner.style.position = 'absolute';
            container.innerHTML = '';
            container.appendChild(spinner);
            container.appendChild(img);

            const imageInstance: ImageInstance = { id: `${pluginName}-${index}`, spec, img, spinner };
            imageInstances.push(imageInstance);
        }
        const instances = imageInstances.map((imageInstance, index): IInstance => {
            const { img, spinner, id, spec } = imageInstance;

            const dynamicUrl = new DynamicUrl(spec.url, (src) => {
                if (src) {
                    spinner.style.display = '';
                    img.src = src.toString();
                    img.style.opacity = ImageOpacity.loading;
                } else {
                    img.src = '';   //TODO placeholder image
                    spinner.style.display = 'none';
                    img.style.opacity = ImageOpacity.full;
                }
            });

            const signalNames = Object.keys(dynamicUrl.signals);

            return {
                id,
                initialSignals: Array.from(signalNames).map(name => ({
                    name,
                    value: null,
                    priority: -1,
                    isData: false,
                })),
                destroy: () => {
                    if (img) {
                        img.remove();
                    }
                    if (spinner) {
                        spinner.remove();
                    }
                },
                receiveBatch: async (batch, from) => {
                    dynamicUrl.receiveBatch(batch);
                },
            };
        });
        return instances;
    },
};
