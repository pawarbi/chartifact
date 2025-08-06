/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
function sniffContent(content: string) {
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
    const { url, options } = (e.data || {}) as Chartifact.common.GuardedFetchRequestMessage;
    let responseMessage: Chartifact.common.GuardedFetchResponseMessage;
    try {
        const res = await fetch(url, options);
        const body = await res.text();
        if (!sniffContent(body)) {
            console.warn('Content blocked:', url);
            responseMessage = { status: 403, error: 'Blocked by content firewall' };
        } else {
            responseMessage = { status: res.status, body };
        }
    } catch (err) {
        console.error('Fetch error:', url, err);
        responseMessage = { status: 500, error: err.message || 'Fetch failed' };
    }
    (e.source as Window)?.postMessage(responseMessage, '*');
});
