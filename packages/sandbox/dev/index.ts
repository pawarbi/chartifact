/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { SandboxOptions, Sandbox } from '../src/index.ts';
import { rendererCss } from '../src/resources/rendererCss.ts';
import { rendererUmdJs } from '../src/resources/rendererUmdJs.ts';
const textarea = document.getElementById('md') as HTMLTextAreaElement;

class LocalSandbox extends Sandbox {
    constructor(elementOrSelector: string | HTMLElement, markdown: string, options: SandboxOptions) {
        super(elementOrSelector, markdown, options);
    }

    getCssReset(): string {
        return `<style>\n${rendererCss}</style>`
    }

    getRendererScript() {
        return `<script>${rendererUmdJs}</script>`;
    }

}

const sandbox = new LocalSandbox(document.body, textarea.value, {
    onReady: () => {
        console.log('Sandbox is ready');
    },
    onError: (error) => {
        console.error('Sandbox error:', error);
    },
    onApprove: (message) => {
        console.log('Sandbox approval message:', message);
        //TODO policy to approve unapproved on localhost
        const { specs } = message;
        return specs;
    },
});

//allow sandbox to be accessed globally for debugging
window['sandbox'] = sandbox;

textarea.addEventListener('input', () => {
    sandbox.send(textarea.value);
});
