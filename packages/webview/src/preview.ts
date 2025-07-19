declare const hostOptions: IDocs.host.HostOptions;

window.addEventListener('DOMContentLoaded', () => {
    const options = { ...hostOptions, ...{ postMessageTarget: acquireVsCodeApi() } };
    const host = new IDocs.host.Listener({
        app: '#app',
        loading: '#loading',
        options,
    });
});
