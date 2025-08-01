/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
declare const acquireVsCodeApi: () => {
    postMessage: (message: any, targetOrigin: string) => void;
};
