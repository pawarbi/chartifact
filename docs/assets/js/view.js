window.addEventListener('DOMContentLoaded', () => {
    host = new Chartifact.host.Listener({
        app: 'main',
        loading: '#loading',
        help: '#help',
        uploadButton: '#upload-btn',
        fileInput: '#file-input',
        textarea: '#textarea',
        onApprove: (message) => {
            // TODO look through each spec and override policy to approve unapproved for https://microsoft.github.io/chartifact/
            const { specs } = message;
            return specs;
        },
    });
});
