/*!
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { registerMarkdownPlugin } from '../factory.js';

import { cssPlugin } from './css.js';
import { dropdownPlugin } from './dropdown.js';
import { imagePlugin } from './image.js';
import { placeholdersPlugin } from './placeholders.js';
import { presetsPlugin } from './presets.js';
import { tabulatorPlugin } from './tabulator.js';
import { vegaLitePlugin } from './vega-lite.js';
import { vegaPlugin } from './vega.js';

export function registerNativePlugins() {
    registerMarkdownPlugin(cssPlugin);
    registerMarkdownPlugin(dropdownPlugin);
    registerMarkdownPlugin(imagePlugin);
    registerMarkdownPlugin(placeholdersPlugin);
    registerMarkdownPlugin(presetsPlugin);
    registerMarkdownPlugin(tabulatorPlugin);
    registerMarkdownPlugin(vegaLitePlugin);
    registerMarkdownPlugin(vegaPlugin);
}
