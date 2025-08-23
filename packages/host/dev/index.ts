/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { SandboxOptions, Sandbox } from '@microsoft/chartifact-sandbox';
import { Toolbar } from 'toolbar';
import { rendererCss } from '@microsoft/chartifact-sandbox/src/resources/rendererCss.ts';
import { rendererUmdJs } from '@microsoft/chartifact-sandbox/src/resources/rendererUmdJs.ts';
import { Listener } from '../src/index.ts';
import { InteractiveDocumentWithSchema } from '@microsoft/chartifact-schema';

class LocalSandbox extends Sandbox {
    constructor(elementOrSelector: string | HTMLElement, markdown: string, options: SandboxOptions) {
        super(elementOrSelector, markdown, options);
    }

    getDependencies() {
        return `
<link href="https://unpkg.com/tabulator-tables@6.3.0/dist/css/tabulator.min.css" rel="stylesheet" />
<style>\n${rendererCss}</style>
<script src="https://cdn.jsdelivr.net/npm/markdown-it/dist/markdown-it.min.js"></script>
<script src="https://unpkg.com/css-tree/dist/csstree.js"></script>
<script src="https://unpkg.com/js-yaml/dist/js-yaml.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vega@5.29.0"></script>
<script src="https://cdn.jsdelivr.net/npm/vega-lite@5.20.1"></script>
<script src="https://unpkg.com/tabulator-tables@6.3.0/dist/js/tabulator.min.js"></script>
<script>${rendererUmdJs}</script>
`;
    }

}

let render = () => { };

const textarea = document.querySelector('#source') as HTMLTextAreaElement;
textarea.addEventListener('input', () => render());
const toolbar = new Toolbar('.chartifact-toolbar', { textarea });

const host = new Listener({
    preview: '#preview',
    loading: '#loading',
    help: '#help',
    uploadButton: '#upload-btn',
    fileInput: '#file-input',
    toolbar,
    onApprove: (message) => {
        const { specs } = message;
        return specs;
    },
    sandboxConstructor: LocalSandbox,
    onSetMode: (mode, markdown, interactiveDocument) => {
        switch (mode) {
            case 'json':
                toolbar.mode = 'json';
                textarea.value = JSON.stringify(interactiveDocument, null, 2);
                render = () => {
                    const json = textarea.value;
                    try {
                        const interactiveDocument = JSON.parse(json) as InteractiveDocumentWithSchema;
                        if (typeof interactiveDocument !== 'object') {
                            host.errorHandler(
                                'Invalid JSON format',
                                'Please provide a valid Interactive Document JSON.'
                            );
                            return;
                        }
                        host.renderInteractiveDocument(interactiveDocument);
                    } catch (error) {
                        host.errorHandler(
                            error,
                            'Failed to parse Interactive Document JSON'
                        );
                    }
                };
                break;
            case 'markdown':
                toolbar.mode = 'markdown';
                textarea.value = markdown;
                render = () => {
                    const markdown = textarea.value;
                    host.renderMarkdown(markdown);
                };
                break;
            default:
                return;
        }
    },
});
