/*!
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import MarkdownIt from 'markdown-it';
import { Renderers } from 'vega-typings';
import { create, IInstance, plugins } from './factory.js';
import { SignalBus } from './signalbus.js';
import { defaultCommonOptions, SpecReview } from 'common';

export interface ErrorHandler {
    (error: Error, pluginName: string, instanceIndex: number, phase: string, container: Element, detail?: string): void;
}

export interface RendererOptions {
    vegaRenderer?: Renderers;
    signalBus?: SignalBus;
    errorHandler?: ErrorHandler;
    useShadowDom?: boolean;
}

const defaultRendererOptions: RendererOptions = {
    vegaRenderer: 'canvas',
    useShadowDom: false,
    errorHandler: (error, pluginName, instanceIndex, phase) => {
        console.error(`Error in plugin ${pluginName} instance ${instanceIndex} phase ${phase}`, error);
    },
};

interface Hydration {
    pluginName: string;
    instances: IInstance[];
}

export class Renderer {

    public md: MarkdownIt;
    public instances: { [key: string]: IInstance[] };
    public signalBus: SignalBus;
    public options: RendererOptions;
    public shadowRoot?: ShadowRoot;
    public element: Element | ShadowRoot;

    constructor(_element: HTMLElement, options?: RendererOptions) {
        this.options = { ...defaultRendererOptions, ...options };
        this.signalBus = this.options.signalBus || new SignalBus(defaultCommonOptions.dataSignalPrefix!);
        this.instances = {};

        // Create shadow DOM or use regular DOM
        if (this.options.useShadowDom) {
            this.shadowRoot = _element.attachShadow({ mode: 'open' });
            this.element = this.shadowRoot;
        } else {
            this.element = _element;
        }
    }

    private ensureMd() {
        if (!this.md) {
            this.md = create();
        }
    }

    async render(markdown: string) {
        //loop through all the destroy handlers and call them. have the key there to help us debug
        this.reset();

        const html = this.renderHtml(markdown);
        this.element.innerHTML = html;
        const specs = this.hydrateSpecs();

        await this.hydrate(specs);
    }

    renderHtml(markdown: string) {
        this.ensureMd();
        const parsedHTML = this.md.render(markdown);

        let content = parsedHTML;

        // Wrap in "body" div for shadow DOM
        if (this.options.useShadowDom) {
            content = `<div class="body">${content}</div>`;
        }

        return content;
    }

    hydrateSpecs() {
        this.ensureMd();

        const specs: SpecReview<{}>[] = [];

        //loop through all the plugins and hydrate their specs and flag them id needed
        this.signalBus.log('Renderer', 'hydrate specs');

        for (let i = 0; i < plugins.length; i++) {
            const plugin = plugins[i];
            if (plugin.hydrateSpecs) {
                specs.push(...plugin.hydrateSpecs(this, this.options.errorHandler));
            }
        }

        return specs;
    }

    async hydrate(specs: SpecReview<{}>[]) {
        this.ensureMd();

        //loop through all the plugins and render them
        this.signalBus.log('Renderer', 'hydrate components');
        const hydrationPromises: Promise<Hydration>[] = [];

        for (let i = 0; i < plugins.length; i++) {
            const plugin = plugins[i];
            if (plugin.hydrateComponent) {
                //get only those specs that match the plugin name
                const specsForPlugin = specs.filter(spec => spec.pluginName === plugin.name);
                //make a new promise that returns IInstances but adds the plugin name
                hydrationPromises.push(plugin.hydrateComponent(this, this.options.errorHandler, specsForPlugin).then(instances => {
                    return {
                        pluginName: plugin.name,
                        instances,
                    };
                }));
            }
        }

        try {
            const pluginHydrations = await Promise.all(hydrationPromises);
            for (const hydration of pluginHydrations) {
                if (hydration && hydration.instances) {
                    this.instances[hydration.pluginName] = hydration.instances;
                    //registration phase
                    for (const instance of hydration.instances) {
                        this.signalBus.registerPeer(instance);
                    }
                }
            }
            await this.signalBus.beginListening();
        } catch (error) {
            console.error('Error in rendering plugins', error);
        }
    }

    reset() {
        this.signalBus.reset();
        for (const pluginName of Object.keys(this.instances)) {
            const instances = this.instances[pluginName];
            for (const instance of instances) {
                instance.destroy && instance.destroy();
            }
        }
        this.instances = {};

        // Clear container content including styles
        this.element.innerHTML = '';
    }

}
