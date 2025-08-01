/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { registerMarkdownPlugin } from '../factory.js';

import { checkboxPlugin } from './checkbox.js';
import { cssPlugin } from './css.js';
import { dropdownPlugin } from './dropdown.js';
import { imagePlugin } from './image.js';
import { placeholdersPlugin } from './placeholders.js';
import { presetsPlugin } from './presets.js';
import { sliderPlugin } from './slider.js';
import { tabulatorPlugin } from './tabulator.js';
import { textboxPlugin } from './textbox.js';
import { vegaLitePlugin } from './vega-lite.js';
import { vegaPlugin } from './vega.js';

export function registerNativePlugins() {
    registerMarkdownPlugin(checkboxPlugin);
    registerMarkdownPlugin(cssPlugin);
    registerMarkdownPlugin(dropdownPlugin);
    registerMarkdownPlugin(imagePlugin);
    registerMarkdownPlugin(placeholdersPlugin);
    registerMarkdownPlugin(presetsPlugin);
    registerMarkdownPlugin(sliderPlugin);
    registerMarkdownPlugin(tabulatorPlugin);
    registerMarkdownPlugin(textboxPlugin);
    registerMarkdownPlugin(vegaLitePlugin);
    registerMarkdownPlugin(vegaPlugin);
}
