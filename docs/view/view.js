window.addEventListener('DOMContentLoaded', () => {
    host = new IDocs.host.Listener({
        app: 'main',
        loading: '#loading',
        help: '#help',
        uploadButton: '#upload-btn',
        fileInput: '#file-input',
        textarea: '#textarea',
        onApprove: (message) => {
            // TODO look through each and override policy to approve unapproved
            const remediated = message.flags;
            return remediated;
        },
    });
});
