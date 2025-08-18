/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { Toolbar, ToolbarOptions } from './toolbar.js';
export * from './toolbar.js';

export function create(toolbarElementOrSelector: HTMLElement | string, options: ToolbarOptions = {}): Toolbar {
    const toolbar = new Toolbar(toolbarElementOrSelector, options);
    toolbar.manageTextareaVisibilityForAgents();
    return toolbar;
}
