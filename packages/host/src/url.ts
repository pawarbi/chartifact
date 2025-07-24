import { Listener } from "./listener.js";
import { determineContent } from "./string.js";

export function checkUrlForFile(host: Listener) {
  const urlParams = new URLSearchParams(window.location.search);
  const loadUrl = urlParams.get(host.options.urlParamName);

  //ensure loadUrl is on the same origin, or must be https
  const isValidUrl = (url: string) => isSameOrigin(url) || isHttps(url);

  if (loadUrl && !isValidUrl(loadUrl)) {
    host.errorHandler(
      new Error(`Invalid URL provided`),
      'The URL provided is not valid. Please ensure it is on the same origin or uses HTTPS.'
    );
    return false;
  }

  if (loadUrl) {
    // Additional URL validation
    if (!isValidLoadUrl(loadUrl)) {
      host.errorHandler(
        new Error('Invalid URL format'),
        'The URL provided has an invalid format or contains suspicious characters.'
      );
      return false;
    }

    try {

      fetch(loadUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load content from URL`);
          }
          return response.text();
        })
        .then(content => {
          determineContent(content, host);
        })
        .catch(error => {
          host.errorHandler(error as Error, `Error loading file from the provided URL`);
        });

    } catch (error) {
      host.errorHandler(error as Error, `Error loading file from the provided URL`);
    }
    return true; // We found a load parameter
  } else {
    return false; // No load parameter found
  }
}

function isSameOrigin(url: string) {
  const link = document.createElement("a");
  link.href = url;
  return link.origin === window.location.origin;
}

function isHttps(url: string) {
  const link = document.createElement("a");
  link.href = url;
  return link.protocol === "https:";
}

function isValidLoadUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }
    
    // Prevent javascript:, vbscript:, and data: URLs
    if (parsedUrl.protocol === 'javascript:' || parsedUrl.protocol === 'vbscript:' || parsedUrl.protocol === 'data:') {
      return false;
    }
    
    // Basic hostname validation (prevent obvious malicious patterns)
    const hostname = parsedUrl.hostname.toLowerCase();
    if (hostname.includes('<') || hostname.includes('>') || hostname.includes('"') || hostname.includes("'")) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}
