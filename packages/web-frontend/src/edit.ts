/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
window.addEventListener('DOMContentLoaded', () => {

    const appProps: Chartifact.editor.AppProps = {
        onApprove: (message) => {
            // TODO look through each spec and override policy to approve unapproved for https://microsoft.github.io/chartifact/
            const { specs } = message;
            return specs;
        }
    };

    const root = ReactDOM.createRoot(document.getElementById("app"));
    root.render(React.createElement(Chartifact.editor.App, appProps));

});
