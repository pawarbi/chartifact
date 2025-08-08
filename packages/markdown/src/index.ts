/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { registerNativePlugins } from './plugins/index.js';

registerNativePlugins();

export { sanitizedHTML } from './sanitize.js';
export { plugins, registerMarkdownPlugin } from './factory.js';
export { Renderer } from './renderer.js';

export type { RendererOptions } from './renderer.js';
export type { Plugin } from './factory.js';
export type * as Plugins from './plugins/interfaces.js';
export type { Batch, IInstance } from './factory.js';
