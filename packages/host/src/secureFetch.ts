// secureFetch.ts
// Provides a fetch-like API that uses sandboxed iframe for external URLs
// Usage: secureFetch(url, options)

/**
 * Mimics fetch, but uses a sandboxed iframe for external URLs.
 * Same-origin and relative URLs use window.fetch directly.
 * External URLs are fetched via a sandboxed iframe and postMessage.
 */
export function secureFetch(url: string, options?: RequestInit): Promise<ResponseLike> {
  if (isSameOrigin(url)) {
    // Use native fetch for same-origin/relative URLs
    return fetch(url, options);
  }
  // Use iframe for external URLs
  return fetchViaSandbox(url, options);
}

/**
 * Checks if a URL is same-origin or relative.
 */
function isSameOrigin(url: string): boolean {
  try {
    if (!url.includes('://')) return true;
    const parsedUrl = new URL(url);
    return parsedUrl.origin === window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Fetches a URL via a sandboxed iframe and postMessage.
 */
function fetchViaSandbox(url: string, options?: RequestInit): Promise<ResponseLike> {
  return new Promise((resolve, reject) => {
    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.sandbox.add('allow-scripts');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // Generate a unique request ID
    const requestId = 'req_' + Math.random().toString(36).slice(2);

    // Listen for response
    function handleMessage(event: MessageEvent) {
      if (event.source !== iframe.contentWindow) return;
      const { id, error, response } = event.data || {};
      if (id !== requestId) return;
      window.removeEventListener('message', handleMessage);
      document.body.removeChild(iframe);
      if (error) {
        reject(new Error(error));
      } else {
        resolve({
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          text: () => Promise.resolve(response.text),
          json: () => Promise.resolve(JSON.parse(response.text)),
        });
      }
    }
    window.addEventListener('message', handleMessage);

    // Setup iframe content
    const html = `
      <script>
        window.addEventListener('message', async function(e) {
          var data = e.data || {};
          if (data.url && data.id) {
            try {
              var resp = await fetch(data.url, data.options || {});
              var text = await resp.text();
              e.source.postMessage({
                id: data.id,
                response: {
                  ok: resp.ok,
                  status: resp.status,
                  statusText: resp.statusText,
                  text: text
                }
              }, e.origin);
            } catch (err) {
              e.source.postMessage({ id: data.id, error: err.message }, e.origin);
            }
          }
        });
      <\/script>
    `;
    iframe.srcdoc = html;

    // Send request to iframe after it loads
    iframe.onload = () => {
      iframe.contentWindow?.postMessage({ url, options, id: requestId }, '*');
    };
  });
}

// Minimal Response-like type
export interface ResponseLike {
  ok: boolean;
  status: number;
  statusText: string;
  text(): Promise<string>;
  json(): Promise<any>;
}
