/*!
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
declare const hostOptions: Chartifact.host.ListenOptions;

window.addEventListener('DOMContentLoaded', () => {
    const options: Chartifact.host.ListenOptions = { ...hostOptions, ...{ postMessageTarget: acquireVsCodeApi() } };
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
    });
});
