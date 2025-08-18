/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

export interface ToolbarOptions {
    tweakButton?: boolean;
    textarea?: HTMLTextAreaElement;
}

export class Toolbar {
    public toolbarElement: HTMLElement;

    constructor(toolbarElementOrSelector: HTMLElement | string, public options: ToolbarOptions = {}) {
        this.toolbarElement = typeof toolbarElementOrSelector === 'string' ? document.querySelector(toolbarElementOrSelector) : toolbarElementOrSelector;

        if (!this.toolbarElement) {
            throw new Error('Toolbar element not found');
        }

        const html = `
        <a href="https://microsoft.github.io/chartifact" target="_blank">Chartifact</a> viewer
        ${this.options.tweakButton ? '<button type="button" id="tweak">tweak</button>' : ''}
        `;

        this.toolbarElement.innerHTML = html;

        if (this.options.tweakButton) {
            const tweakButton = this.toolbarElement.querySelector('#tweak') as HTMLButtonElement;
            tweakButton?.addEventListener('click', () => {
                this.options.textarea.style.display = this.options.textarea.style.display === 'none' ? '' : 'none';
            });
        }
    }

    manageTextareaVisibilityForAgents() {
        const { textarea } = this.options;

        if (!textarea) {
            throw new Error('Textarea element not found');
        }

        // Bot-friendly content hiding strategy:
        // 1. Bots that don't execute JS will see the textarea content in full
        // 2. Bots that execute JS but have short timeouts will see content for 300ms
        // 3. Human users see no visual flash due to flex:0 + removed padding/border
        textarea.style.flex = '0';        // Collapse to zero width, no visual space
        textarea.style.padding = '0';     // Remove default padding that creates pixel shift
        textarea.style.border = '0';      // Remove default border that creates pixel shift
        setTimeout(() => {
            // After 300ms (longer than most bot JS timeouts), restore defaults and hide
            textarea.style.flex = '';     // Restore original flex value from CSS
            textarea.style.padding = '';  // Restore original padding from CSS
            textarea.style.border = '';   // Restore original border from CSS
            textarea.style.display = 'none'; // Fully hide from users (but they can unhide to edit)
        }, 300);

    }

}
