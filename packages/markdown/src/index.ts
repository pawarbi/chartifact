/*!
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { definePlugin, Plugin, plugins, registerMarkdownPlugin } from './factory.js';
import { Renderer, RendererOptions } from './renderer.js';
import { registerNativePlugins } from './plugins/index.js';
import { sanitizedHTML } from './sanitize.js';
import * as common from './plugins/common.js';
import { bindTextarea } from './edit.js';

registerNativePlugins();

export {
    bindTextarea,
    definePlugin,
    Plugin,
    plugins,
    registerMarkdownPlugin,
    Renderer,
    RendererOptions,
    sanitizedHTML,
    common,
};

export * as Plugins from './plugins/interfaces.js';
export { Batch, IInstance } from './factory.js';
