/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { Plugin } from '../factory.js';
import { sanitizedHTML } from '../sanitize.js';
import { PluginNames } from './interfaces.js';

const pluginName: PluginNames = '#';

export const commentPlugin: Plugin<string> = {
    name: pluginName,
    fence: (token, index) => {
        const content = token.content.trim();
        return sanitizedHTML('comment', {}, content);
    },
};
