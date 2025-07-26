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
            const editorProps = { previewer: OfflineSandbox, postMessageTarget: vscode };
            const root = ReactDOM.createRoot(document.getElementById("app"));
            root.render(React.createElement(IDocs.editor.Editor, editorProps as any));
        }
    });

    const editorGetOfflineDependenciesMessage: IDocs.common.EditorGetOfflineDependenciesMessage = {
        type: 'editorGetOfflineDependencies',
        sender: 'webview',
    };

    vscode.postMessage(editorGetOfflineDependenciesMessage, '*');
});
