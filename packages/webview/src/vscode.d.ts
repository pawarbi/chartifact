declare const acquireVsCodeApi: () => {
    postMessage: (message: any, targetOrigin: string) => void;
};
