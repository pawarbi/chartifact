/*!
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { definePlugin, Plugin } from '../factory.js';
import { sanitizedHTML } from '../sanitize.js';
import { getJsonScriptTag, pluginClassName } from './util.js';
import { vegaPlugin } from './vega.js';
import { compile } from 'vega-lite';

const pluginName = 'vega-lite';
const className = pluginClassName(pluginName);

export const vegaLitePlugin: Plugin = {
    name: pluginName,
    hydratesBefore: vegaPlugin.name,
    initializePlugin: (md) => definePlugin(md, pluginName),
    fence: token => {
        return sanitizedHTML('div', { class: className }, token.content.trim(), true);
    },
    hydrateComponent: async (renderer, errorHandler) => {
        const containers = renderer.element.querySelectorAll(`.${className}`);
        for (const [index, container] of Array.from(containers).entries()) {
            const jsonObj = getJsonScriptTag(container, e => errorHandler(e, pluginName, index, 'parse', container));
            if (!jsonObj) continue;

            //compile to vega
            try {
                const { spec } = compile(jsonObj);

                //create both a script tag and a vega tag for the vega plugin to catch
                const html = sanitizedHTML('div', { class: pluginClassName(vegaPlugin.name) }, JSON.stringify(spec, null, 2), true);

                //append the html right after this container
                container.insertAdjacentHTML('afterend', html);

                //the container can be removed
                container.remove();

            } catch (error) {
                //did not compile
                errorHandler(error, pluginName, index, 'compile', container);
            }
        }

        //return a promise that resolves to an empty array of IInstance
        return Promise.resolve([]);
    },
};
