window.addEventListener('DOMContentLoaded', () => {
    const appProps = {
        onApprove: (message) => {
            // TODO look through each and override policy to approve unapproved
            // policy from vscode settings
            const { specs } = message;
            return specs;
        }
    };
    const root = ReactDOM.createRoot(document.getElementById("app"));
    root.render(React.createElement(IDocs.editor.App, appProps));
});
