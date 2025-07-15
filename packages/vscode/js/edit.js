const vscode = acquireVsCodeApi();

window.addEventListener('message', (event) => {

    let offlineDeps = '<script>console.log("offline deps not loaded!");</script>';

    if (event.data.type === 'setOfflineDeps') {
        offlineDeps = event.data.offlineDeps;
        class OfflineSandbox extends IDocs.editor.sandbox.Sandbox {
            constructor(element, options) {
                super(element, options);
            }
            getDependencies() {
                return offlineDeps;
            }
        }
        const editorProps = { previewer: OfflineSandbox, postMessageTarget: vscode };
        const root = ReactDOM.createRoot(document.getElementById("app"));
        root.render(React.createElement(IDocs.editor.Editor, editorProps));
    }
});

window.addEventListener('DOMContentLoaded', () => {
    vscode.postMessage({ type: 'getOfflineDeps' }, '*');
});
