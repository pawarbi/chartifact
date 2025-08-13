/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
declare let host: Chartifact.host.Listener;

window.addEventListener('DOMContentLoaded', () => {
    host = new Chartifact.host.Listener({
        app: '#app',
        loading: '#loading',
        help: '#help',
        uploadButton: '#upload-btn',
        fileInput: '#file-input',
        textarea: '#textarea',
        toolbar: '#toolbar',
        onApprove: (message: Chartifact.common.SandboxedPreHydrateMessage) => {
            // TODO look through each spec and override policy to approve unapproved for https://microsoft.github.io/chartifact/
            const { specs } = message;
            return specs;
        },
    });
});
