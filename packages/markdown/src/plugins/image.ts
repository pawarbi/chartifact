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
    dynamicUrl: DynamicUrl;
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

            container.innerHTML = createImageContainerTemplate(spec.alt);
            const { img, spinner, retryBtn, dynamicUrl } = createImageLoadingLogic(
                spec.url,
                container as HTMLElement,
                null,
                (error) => {
                    errorHandler(error, pluginName, index, 'load', container, img.src);
                }
            );

            const imageInstance: ImageInstance = {
                id: `${pluginName}-${index}`,
                spec,
                img: null as any, // Will be set below
                spinner: null as any, // Will be set below
                dynamicUrl,
            };

            // Now set the actual img and spinner references
            imageInstance.img = img;
            imageInstance.spinner = spinner;

            if (spec.alt) img.alt = spec.alt;
            if (spec.width) img.width = spec.width;
            if (spec.height) img.height = spec.height;

            imageInstances.push(imageInstance);
        }
        const instances = imageInstances.map((imageInstance, index): IInstance => {
            const { img, spinner, id, dynamicUrl } = imageInstance;

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

export function createImageContainerTemplate(alt: string) {

    return `<div class="dynamic-image-container" style="position: relative;">
        <div class="image-spinner" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: none;">
            ${imgSpinner}
        </div>
        <img src="" alt="${alt}" style="opacity: 0.1;">
        <button class="image-retry" style="display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 2;">Retry</button>
    </div>`;
}

export function createImageLoadingLogic(
    url: string,
    container: HTMLElement,
    onSuccess?: () => void,
    onError?: (error: Error) => void
) {
    container.style.position = 'relative';

    const img = container.querySelector('img') as HTMLImageElement;
    const spinner = container.querySelector('.image-spinner') as HTMLDivElement;
    const retryBtn = container.querySelector('.image-retry') as HTMLButtonElement;

    img.onload = () => {
        spinner.style.display = 'none';
        img.style.opacity = ImageOpacity.full;
        img.style.display = '';
        retryBtn.style.display = 'none';
        img.setAttribute('hasImage', 'true');
        onSuccess?.();
    };

    img.onerror = () => {
        spinner.style.display = 'none';
        img.style.opacity = ImageOpacity.error;
        img.style.display = 'none';
        retryBtn.style.display = '';
        retryBtn.disabled = false;
        img.setAttribute('hasImage', 'false');
        onError?.(new Error('Image failed to load'));
    };

    retryBtn.onclick = () => {
        retryBtn.disabled = true;
        spinner.style.display = '';
        img.style.opacity = ImageOpacity.loading;
        img.style.display = img.getAttribute('hasImage') ? '' : 'none';  // only show if previous load succeeded
        const src = img.src;
        img.src = '';
        setTimeout(() => {
            img.src = src;
        }, 100);
    };

    const dynamicUrl = new DynamicUrl(url, (src) => {
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

    return { img, spinner, retryBtn, dynamicUrl };
}
