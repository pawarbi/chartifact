/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
declare const hostOptions: Chartifact.host.ListenOptions;

window.addEventListener('DOMContentLoaded', () => {

    const vscode = acquireVsCodeApi();

    const x = (event: MessageEvent<Chartifact.common.EditorSetOfflineDependenciesMessage>) => {

        const options: Chartifact.host.ListenOptions = { ...hostOptions, ...{ postMessageTarget: vscode } };

        let offlineDeps = '<script>console.log("offline deps not loaded!");</script>';

        const message = event.data as Chartifact.common.EditorSetOfflineDependenciesMessage;

        if (message.type === 'editorSetOfflineDependencies') {

            offlineDeps = message.offlineDeps;

            class OfflineSandbox extends Chartifact.sandbox.Sandbox {
                constructor(element: string | HTMLElement, markdown: string, options: Chartifact.sandbox.SandboxOptions) {
                    super(element, markdown, options);
                }
                getDependencies() {
                    return offlineDeps;
                }
            }

            const host = new Chartifact.host.Listener({
                app: '#app',
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

            window.removeEventListener('message', x);
        }
    };

    window.addEventListener('message', x);

    const editorGetOfflineDependenciesMessage: Chartifact.common.EditorGetOfflineDependenciesMessage = {
        type: 'editorGetOfflineDependencies',
        sender: 'webview',
    };

    vscode.postMessage(editorGetOfflineDependenciesMessage, '*');
});
