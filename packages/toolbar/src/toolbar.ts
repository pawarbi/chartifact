/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

export interface ToolbarOptions {
    tweakButton?: boolean;
    textarea?: HTMLTextAreaElement;
}

export function create(toolbarSelector: HTMLElement | string, options: ToolbarOptions = {}) {
    const toolbarElement = typeof toolbarSelector === 'string' ? document.querySelector(toolbarSelector) : toolbarSelector;

    if (!toolbarElement) {
        throw new Error('Toolbar element not found');
    }

    const html = `
        <a href="https://microsoft.github.io/chartifact" target="_blank">Chartifact</a> viewer
        ${options.tweakButton ? '<button type="button" id="tweak">tweak</button>' : ''}
        `;

    toolbarElement.innerHTML = html;

    if (options.tweakButton) {
        const tweakButton = toolbarElement.querySelector('#tweak') as HTMLButtonElement;
        tweakButton?.addEventListener('click', () => {
            options.textarea.style.display = options.textarea.style.display === 'none' ? '' : 'none';
        });
    }
}
