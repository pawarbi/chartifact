/*!
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { definePlugin, Plugin, plugins, registerMarkdownPlugin } from './factory.js';
import { Renderer, RendererOptions } from './renderer.js';
import { registerNativePlugins } from './plugins/index.js';
import { sanitizedHTML } from './sanitize.js';

registerNativePlugins();

export {
    definePlugin,
    Plugin,
    plugins,
    registerMarkdownPlugin,
    Renderer,
    RendererOptions,
    sanitizedHTML,
};

export * as Plugins from './plugins/interfaces.js';
export { Batch, IInstance } from './factory.js';
