/**
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
    hasImage: boolean;
}

export const ImageOpacity = {
    full: '1',
    loading: '0.1',
    error: '0.5',
};

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
            
            // Create imageInstance first so it can be referenced in callbacks
            const imageInstance: ImageInstance = {
                id: `${pluginName}-${index}`,
                spec,
                img: null as any, // Will be set below
                spinner: null as any, // Will be set below
                hasImage: false,
            };

            const { img, spinner, retryBtn } = createImageLoadingLogic(
                container as HTMLElement,
                () => {
                    imageInstance.hasImage = true;
                },
                (error) => {
                    imageInstance.hasImage = false;
                    errorHandler(error, pluginName, index, 'load', container, img.src);
                }
            );

            // Now set the actual img and spinner references
            imageInstance.img = img;
            imageInstance.spinner = spinner;

            if (spec.alt) img.alt = spec.alt;
            if (spec.width) img.width = spec.width;
            if (spec.height) img.height = spec.height;

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

export const imgSpinner = `
<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="gray" stroke-width="2" fill="none" stroke-dasharray="31.4" stroke-dashoffset="0">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
    </circle>
</svg>
`;

export function createImageContainerTemplate(alt = '', title = '', dataTemplateUrl = '') {
    const titleAttr = title ? ` title="${title}"` : '';
    const templateUrlAttr = dataTemplateUrl ? ` data-template-url="${dataTemplateUrl}"` : '';
    
    return `<div class="dynamic-image-container" style="position: relative;">
        <div class="image-spinner" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: none;">
            ${imgSpinner}
        </div>
        <img src="" alt="${alt}"${titleAttr}${templateUrlAttr} style="opacity: 0.1;">
        <button class="image-retry" style="display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 2;">Retry</button>
    </div>`;
}

export function createImageLoadingLogic(
    container: HTMLElement,
    onSuccess?: () => void,
    onError?: (error: Error) => void
): { img: HTMLImageElement; spinner: HTMLDivElement; retryBtn: HTMLButtonElement } {
    container.style.position = 'relative';
    container.innerHTML = createImageContainerTemplate();

    const img = container.querySelector('img') as HTMLImageElement;
    const spinner = container.querySelector('.image-spinner') as HTMLDivElement;
    const retryBtn = container.querySelector('.image-retry') as HTMLButtonElement;

    img.onload = () => {
        spinner.style.display = 'none';
        img.style.opacity = ImageOpacity.full;
        img.style.display = '';
        retryBtn.style.display = 'none';
        onSuccess?.();
    };

    img.onerror = () => {
        spinner.style.display = 'none';
        img.style.opacity = ImageOpacity.error;
        img.style.display = 'none';
        retryBtn.style.display = '';
        retryBtn.disabled = false;
        onError?.(new Error('Image failed to load'));
    };

    retryBtn.onclick = () => {
        retryBtn.disabled = true;
        spinner.style.display = '';
        img.style.opacity = ImageOpacity.loading;
        const src = img.src;
        img.src = '';
        setTimeout(() => {
            img.src = src;
        }, 100);
    };

    return { img, spinner, retryBtn };
}
