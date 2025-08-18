/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
declare const hostOptions: Chartifact.host.ListenOptions;

window.addEventListener('DOMContentLoaded', () => {

    const vscode = acquireVsCodeApi();

    const messageListener = (event: MessageEvent<Chartifact.common.EditorSetOfflineDependenciesMessage>) => {

        const options: Chartifact.host.ListenOptions = { ...hostOptions, ...{ postMessageTarget: vscode } };

        const message = event.data as Chartifact.common.EditorSetOfflineDependenciesMessage;

        if (message.type === 'editorSetOfflineDependencies') {

            class OfflineSandbox extends Chartifact.sandbox.Sandbox {
                constructor(element: string | HTMLElement, markdown: string, options: Chartifact.sandbox.SandboxOptions) {
                    super(element, markdown, options);
                }
                getDependencies() {
                    return message.offlineDeps;
                }
            }

            const host = new Chartifact.host.Listener({
                preview: '#preview',
                loading: '#loading',
                options,
                onApprove: (message: Chartifact.common.SandboxedPreHydrateMessage) => {
                    // TODO look through each and override policy to approve unapproved
                    // policy from vscode settings
                    const { specs } = message;
                    return specs;
                },
                sandboxConstructor: OfflineSandbox,
            });

            window.removeEventListener('message', messageListener);
        }
    };

    window.addEventListener('message', messageListener);

    const editorGetOfflineDependenciesMessage: Chartifact.common.EditorGetOfflineDependenciesMessage = {
        type: 'editorGetOfflineDependencies',
        sender: 'webview',
    };

    vscode.postMessage(editorGetOfflineDependenciesMessage, '*');
});
