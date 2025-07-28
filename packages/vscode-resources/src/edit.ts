window.addEventListener('DOMContentLoaded', () => {

    const vscode = acquireVsCodeApi();

    window.addEventListener('message', (event) => {

        let offlineDeps = '<script>console.log("offline deps not loaded!");</script>';

        const message = event.data as IDocs.common.EditorSetOfflineDependenciesMessage;

        if (message.type === 'editorSetOfflineDependencies') {
            offlineDeps = message.offlineDeps;
            class OfflineSandbox extends IDocs.sandbox.Sandbox {
                constructor(element, markdown, options) {
                    super(element, markdown, options);
                }
                getDependencies() {
                    return offlineDeps;
                }
            }
            const editorProps: IDocs.editor.EditorProps = {
                previewer: OfflineSandbox,
                postMessageTarget: vscode as any,
                onApprove: (message) => {
                    // Handle sandboxed pre-render message
                    console.log('Handling sandboxed pre-render message:', message);
                    //Here you can approve unapproved specs per your own policy
                    const remediated = message.flags;
                    return remediated;
                }
            };
            const root = ReactDOM.createRoot(document.getElementById("app"));
            root.render(React.createElement(IDocs.editor.Editor, editorProps));
        }
    });

    const editorGetOfflineDependenciesMessage: IDocs.common.EditorGetOfflineDependenciesMessage = {
        type: 'editorGetOfflineDependencies',
        sender: 'webview',
    };

    vscode.postMessage(editorGetOfflineDependenciesMessage, '*');
});
