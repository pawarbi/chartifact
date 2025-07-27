/*!
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { FlaggableSpec, Plugin } from '../factory.js';
import { sanitizedHTML } from '../sanitize.js';
import { flaggableJsonPlugin } from './config.js';
import { pluginClassName } from './util.js';
import { inspectVegaSpec, vegaPlugin } from './vega.js';
import { compile, TopLevelSpec } from 'vega-lite';

const pluginName = 'vega-lite';
const className = pluginClassName(pluginName);

export function inspectVegaLiteSpec(spec: TopLevelSpec) {
    //TODO inspect spec for flags
    const flaggableSpec: FlaggableSpec<TopLevelSpec> = {
        spec,
    };
    return flaggableSpec;
}

export const vegaLitePlugin: Plugin<TopLevelSpec> = {
    ...flaggableJsonPlugin<TopLevelSpec>(pluginName, className, inspectVegaLiteSpec),
    hydratesBefore: vegaPlugin.name,
    hydrateComponent: async (renderer, errorHandler, configContainers) => {
        for (const [index, configContainer] of Array.from(configContainers).entries()) {

            //compile to vega
            try {
                const { spec } = compile(configContainer.flaggableSpec.spec);

                const result = inspectVegaSpec(spec);

                //create both a script tag and a vega tag for the vega plugin to catch
                const html = sanitizedHTML('div', { class: pluginClassName(vegaPlugin.name) }, JSON.stringify(result, null, 2), true);

                //append the html right after this container
                configContainer.container.insertAdjacentHTML('afterend', html);

                //the container can be removed
                configContainer.container.remove();

            } catch (error) {
                //did not compile
                errorHandler(error, pluginName, index, 'compile', configContainer.container);
            }
        }

        //return a promise that resolves to an empty array of IInstance
        return Promise.resolve([]);
    },
};
