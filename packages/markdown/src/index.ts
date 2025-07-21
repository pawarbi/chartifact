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
    type Plugin,
    plugins,
    registerMarkdownPlugin,
    Renderer,
    type RendererOptions,
    sanitizedHTML,
};

export type * as Plugins from './plugins/interfaces.js';
export type { Batch, IInstance } from './factory.js';
