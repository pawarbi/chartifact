/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { GuardedFetchRequestMessage, GuardedFetchResponseMessage } from "common";
import { guardedJs } from "./resources/guardedJs.js";

export function guardedFetch(request: GuardedFetchRequestMessage): Promise<GuardedFetchResponseMessage> {
    return new Promise((resolve, reject) => {
        const loaderHTML = `<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Security-Policy" content="
    base-uri 'none';
">
</head>
<body>
<script>
${guardedJs}
</script>
</body>
</html>
`;

        const blob = new Blob([loaderHTML], { type: 'text/html' });
        const blobURL = URL.createObjectURL(blob);

        const iframe = document.createElement('iframe');
        iframe.sandbox = 'allow-scripts';
        iframe.referrerPolicy = 'no-referrer';
        iframe.style.display = 'none';
        iframe.src = blobURL;

        const cleanup = () => {
            window.removeEventListener('message', onMessage);
            document.body.removeChild(iframe);
            URL.revokeObjectURL(blobURL);
        };

        const onMessage = (event: MessageEvent) => {
            if (event.source !== iframe.contentWindow) return;

            const { status, body, error } = event.data || {};
            cleanup();

            if (error) return reject(new Error(error));
            if (typeof status !== 'number' || typeof body !== 'string') {
                return reject(new Error('Invalid response from loader'));
            }

            resolve({ status, body });
        };

        window.addEventListener('message', onMessage);
        document.body.appendChild(iframe);

        iframe.onload = () => {
            iframe.contentWindow?.postMessage(request, '*');
        };
    });
}
