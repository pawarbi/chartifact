declare let host: IDocs.host.Listener;

window.addEventListener('DOMContentLoaded', () => {
    host = new IDocs.host.Listener({
        app: 'main',
        loading: '#loading',
        help: '#help',
        uploadButton: '#upload-btn',
        fileInput: '#file-input',
        textarea: '#textarea',
        onApprove: (message: IDocs.common.SandboxedPreHydrateMessage) => {
            // TODO look through each and override policy to approve unapproved
            const remediated = message.flags;
            return remediated;
        },
    });
});
