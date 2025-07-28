window.addEventListener('DOMContentLoaded', () => {
    const appProps = {
        onApprove: (message) => {
            // TODO look through each spec and override policy to approve unapproved for https://microsoft.github.io/chartifact/
            const { specs } = message;
            return specs;
        }
    };
    const root = ReactDOM.createRoot(document.getElementById("app"));
    root.render(React.createElement(IDocs.editor.App, appProps));
});
