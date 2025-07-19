declare const hostOptions: IDocs.host.ListenOptions;

window.addEventListener('DOMContentLoaded', () => {
    const options: IDocs.host.ListenOptions = { ...hostOptions, ...{ postMessageTarget: acquireVsCodeApi() } };
    const host = new IDocs.host.Listener({
        app: '#app',
        loading: '#loading',
        options,
    });
});
