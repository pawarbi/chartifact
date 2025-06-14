/*!
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { definePlugin, Plugin, plugins, registerMarkdownPlugin } from './factory.js';
import { Renderer } from './renderer.js';
import { registerNativePlugins } from './plugins/index.js';
import { sanitizedHTML } from './sanitize.js';
import * as common from './plugins/common.js';

registerNativePlugins();

export {
    definePlugin,
    Plugin,
    plugins,
    registerMarkdownPlugin,
    Renderer,
    sanitizedHTML,
    common,
};

export type MdVega = {
    definePlugin: typeof definePlugin;
    plugins: typeof plugins;
    registerMarkdownPlugin: typeof registerMarkdownPlugin;
    Renderer: typeof Renderer;
    sanitizedHTML: typeof sanitizedHTML;
    common: typeof common;
};

export * as Plugins from './plugins/interfaces.js';
export { Batch, IInstance } from './factory.js';
