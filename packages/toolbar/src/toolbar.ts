/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

export interface ToolbarOptions {
    tweakButton?: boolean;
    downloadButton?: boolean;
    restartButton?: boolean;
    textarea?: HTMLTextAreaElement;
    mode?: 'markdown' | 'json';
    filename?: string;
}

export class Toolbar {
    public toolbarElement: HTMLElement;
    public folderSpan: HTMLElement;
    public tweakButton: HTMLButtonElement;
    public restartButton: HTMLButtonElement;
    public downloadButton: HTMLButtonElement;
    public mode: 'markdown' | 'json';
    public filename: string;

    constructor(toolbarElementOrSelector: HTMLElement | string, public options: ToolbarOptions = {}) {
        this.filename = options.filename || 'sample';
        this.mode = options.mode || 'markdown';
        this.toolbarElement = typeof toolbarElementOrSelector === 'string' ? document.querySelector(toolbarElementOrSelector) : toolbarElementOrSelector;

        if (!this.toolbarElement) {
            throw new Error('Toolbar element not found');
        }

        const { home, target } = (window.location.hostname === 'localhost')
            ? { home: '/', target: '_self' }
            : { home: 'https://microsoft.github.io/chartifact', target: '_blank' };

        const html = `
<div>
    <a href="${home}" target="${target}">Chartifact</a> viewer
</div>
<div id="folderSpan" style="display: none;"></div>
<div>
    <button type="button" id="restart" style="display: none;">start over</button>
    <button type="button" id="tweak" style="display: none;">view source</button>
    <button type="button" id="download" style="display: none;">download</button>
</div>
        `;

        this.toolbarElement.innerHTML = html;

        this.folderSpan = this.toolbarElement.querySelector('#folderSpan') as HTMLElement;
        this.tweakButton = this.toolbarElement.querySelector('#tweak') as HTMLButtonElement;
        this.restartButton = this.toolbarElement.querySelector('#restart') as HTMLButtonElement;
        this.downloadButton = this.toolbarElement.querySelector('#download') as HTMLButtonElement;

        if (this.options.tweakButton) {
            this.showTweakButton();
        }

        if (this.options.restartButton) {
            this.showRestartButton();
        }

        if (this.options.downloadButton) {
            this.showDownloadButton();
        }

        this.tweakButton?.addEventListener('click', () => {
            this.options.textarea.style.display = this.options.textarea.style.display === 'none' ? '' : 'none';
        });

        this.restartButton?.addEventListener('click', () => {
            window.location.reload();
        });

        this.downloadButton?.addEventListener('click', () => {
            const textarea = this.options.textarea;
            if (!textarea) return;
            const content = textarea.value;
            const ext = this.mode === 'markdown' ? 'idoc.md' : 'idoc.json';
            const filename = `${filenameWithoutPathOrExtension(this.filename)}.${ext}`;
            const blob = new Blob([content], {
                type: this.mode === 'markdown' ? 'text/markdown' : 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 0);
        });
    }

    showTweakButton() {
        this.tweakButton.style.display = '';
    }

    showRestartButton() {
        this.restartButton.style.display = '';
    }

    showDownloadButton() {
        this.downloadButton.style.display = '';
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

function filenameWithoutPathOrExtension(filename: string) {
    // Remove everything before the last slash or backslash
    const base = filename.split(/[\\/]/).pop() || filename;
    // If .idoc appears, remove it and everything after
    const idocIdx = base.indexOf('.idoc');
    if (idocIdx !== -1) {
        return base.substring(0, idocIdx);
    }
    // Otherwise, remove the last extension if present
    const lastDot = base.lastIndexOf('.');
    if (lastDot > 0) {
        return base.substring(0, lastDot);
    }
    return base;
}

// --- TESTS for filenameWithoutPathOrExtension ---

// const filenameTests: [string, string][] = [
//     // [input, expected]
//     ["foo.md", "foo"],
//     ["foo.idoc.md", "foo"],
//     ["foo.idoc.json", "foo"],
//     ["foo", "foo"],
//     ["foo.bar.baz.md", "foo.bar.baz"],
//     ["C:\\folder\\foo.md", "foo"],
//     ["/home/user/foo.md", "foo"],
//     ["folder/foo.idoc.md", "foo"],
//     ["folder\\foo.idoc.json", "foo"],
//     ["folder.with.dots/foo.bar.baz.md", "foo.bar.baz"],
//     ["folder.with.dots\\foo.bar.baz.md", "foo.bar.baz"],
//     ["", ""],
// ];

// filenameTests.forEach(([input, expected], i) => {
//     const result = filenameWithoutPathOrExtension(input);
//     const pass = result === expected;
//     // eslint-disable-next-line no-console
//     console.log(
//         `${pass ? '✅' : '❌'} Test ${i + 1}: ${pass ? 'PASS' : `FAIL\n  Input: ${input}\n  Got: ${result}\n  Expected: ${expected}`}`
//     );
// });

