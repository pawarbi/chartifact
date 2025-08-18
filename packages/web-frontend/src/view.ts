/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
declare let host: Chartifact.host.Listener;

window.addEventListener('DOMContentLoaded', () => {

    let render = () => { };

    const textarea = document.querySelector('#source') as HTMLTextAreaElement;
    textarea.addEventListener('input', render);
    const toolbar = new Chartifact.toolbar.Toolbar('.chartifact-toolbar', { textarea });

    host = new Chartifact.host.Listener({
        preview: '#preview',
        loading: '#loading',
        help: '#help',
        uploadButton: '#upload-btn',
        fileInput: '#file-input',
        toolbar,
        onApprove: (message: Chartifact.common.SandboxedPreHydrateMessage) => {
            // TODO look through each spec and override policy to approve unapproved for https://microsoft.github.io/chartifact/
            const { specs } = message;
            return specs;
        },
        onSetMode: (mode, markdown, interactiveDocument) => {
            switch (mode) {
                case 'json':
                    textarea.value = JSON.stringify(interactiveDocument, null, 2);
                    render = () => {
                        const json = textarea.value;
                        try {
                            const interactiveDocument = JSON.parse(json) as Chartifact.schema.InteractiveDocumentWithSchema;
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
                    textarea.value = markdown;
                    render = () => {
                        const markdown = textarea.value;
                        host.renderMarkdown(markdown);
                    };
                    break;
                default:
                    return;
            }
            toolbar.showTweakButton();
        },
    });

});
