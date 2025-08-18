/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
window.addEventListener('DOMContentLoaded', () => {

    const vscode = acquireVsCodeApi();

    window.addEventListener('message', (event) => {

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
            const editorProps: Chartifact.editor.EditorProps = {
                sandbox: OfflineSandbox,
                postMessageTarget: vscode as any,
                onApprove: (message) => {
                    // TODO look through each and override policy to approve unapproved
                    // policy from vscode settings
                    const { specs } = message;
                    return specs;
                }
            };
            const root = ReactDOM.createRoot(document.getElementById("app"));
            root.render(React.createElement(Chartifact.editor.Editor, editorProps));
        }
    });

    const editorGetOfflineDependenciesMessage: Chartifact.common.EditorGetOfflineDependenciesMessage = {
        type: 'editorGetOfflineDependencies',
        sender: 'webview',
    };

    vscode.postMessage(editorGetOfflineDependenciesMessage, '*');
});
