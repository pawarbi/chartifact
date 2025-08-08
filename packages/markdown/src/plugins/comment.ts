/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { Plugin } from '../factory.js';
import { PluginNames } from './interfaces.js';

const pluginName: PluginNames = '#';

export const commentPlugin: Plugin<string> = {
    name: pluginName,
    fence: token => {
        const content = token.content.trim();

        // Special handling for HTML comments

        // First escape the content safely
        const tempElement = document.createElement('div');
        tempElement.textContent = content;
        const safeContent = tempElement.innerHTML;

        // Then create comment with the safe content
        const comment = document.createComment(safeContent);
        const container = document.createElement('div');
        container.appendChild(comment);
        return container.innerHTML;
    },
};
