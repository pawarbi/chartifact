declare const hostOptions: IDocs.host.ListenOptions;

window.addEventListener('DOMContentLoaded', () => {
    const options: IDocs.host.ListenOptions = { ...hostOptions, ...{ postMessageTarget: acquireVsCodeApi() } };
    const host = new IDocs.host.Listener({
        app: '#app',
        loading: '#loading',
        options,
        onApprove: (message: IDocs.common.SandboxedPreHydrateMessage) => {
            // TODO look through each and override policy to approve unapproved
            // policy from vscode settings
            const { specs } = message;
            return specs;
        },
    });
});
