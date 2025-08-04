/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
export interface GuardedFetchResponse {
    status: number;
    body: string;
}

export function guardedFetch(
    url: string,
    options: RequestInit = {}
): Promise<GuardedFetchResponse> {
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
function sniffContent(content) {
    if (typeof content !== 'string') {
        console.warn('Blocked: content is not a string. Type:', typeof content);
        return false;
    }

    const len = content.length;
    if (len < 5) {
        console.warn('Blocked: content too short (length =', len + ')');
        return false;
    }

    if (len > 1_000_000) {
        console.warn('Blocked: content too large (length =', len + ')');
        return false;
    }

    const head = content.slice(0, 512);
    const lower = head.toLowerCase();

    for (let i = 0; i < head.length; i++) {
        const code = head.charCodeAt(i);
        if (
        (code < 32 && code !== 9 && code !== 10 && code !== 13) ||
        code > 126
        ) {
        console.warn(
            'Blocked: binary or control char at pos', i, '(charCode =', code + ')'
        );
        return false;
        }
    }

    const badSignatures = [
        '<html', '<script', '<style', '<iframe', '<svg', '<link',
        '<meta', '<!doctype', '<?xml', '</',
        '%pdf', '{\\rtf', 'mz', 'gif89a', 'gif87a', '\x7felf', 'pk\x03\x04'
    ];

    const sig = lower.slice(0, 64);
    for (const s of badSignatures) {
        if (sig.includes(s)) {
        console.warn('Blocked: matched dangerous signature:', s);
        return false;
        }
    }

    return true;
}

window.addEventListener('message', async (e) => {
    const { url, options } = e.data || {};
    try {
    const res = await fetch(url, options);
    const body = await res.text();
    if (!sniffContent(body)) {
        console.warn('Content blocked:', url);
        e.source?.postMessage({ error: 'Blocked by content firewall' }, '*');
    } else {
        e.source?.postMessage({ status: res.status, body }, '*');
    }
    } catch (err) {
    console.error('Fetch error:', url, err);
    e.source?.postMessage({ error: err.message || 'Fetch failed' }, '*');
    }
});
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
            iframe.contentWindow?.postMessage({ url, options }, '*');
        };
    });
}
