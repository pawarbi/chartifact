/*!
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { Listener } from "./listener.js";
import { determineContent } from "./string.js";

export function checkUrlForFile(host: Listener) {
  const urlParams = new URLSearchParams(window.location.search);
  const loadUrl = urlParams.get(host.options.urlParamName);

  if (!loadUrl) {
    return false; // No load parameter found
  }

  // First, validate the URL format and security
  if (!isValidLoadUrl(loadUrl)) {
    host.errorHandler(
      new Error('Invalid URL format'),
      'The URL provided has an invalid format or contains suspicious characters.'
    );
    return false;
  }

  // Then check origin/protocol requirements
  const isValidUrl = (url: string) => isSameOrigin(url) || isHttps(url);
  if (!isValidUrl(loadUrl)) {
    host.errorHandler(
      new Error(`Invalid URL provided`),
      'The URL provided is not valid. Please ensure it is on the same origin or uses HTTPS.'
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
}

function isSameOrigin(url: string) {
  try {
    // First check if it's a relative URL (no protocol)
    if (!url.includes('://')) {
      // Relative URLs are inherently same-origin
      return true;
    }
    
    // For absolute URLs, check if origin matches
    const parsedUrl = new URL(url);
    return parsedUrl.origin === window.location.origin;
  } catch {
    return false;
  }
}

function isHttps(url: string) {
  try {
    // Relative URLs inherit the current page's protocol
    if (!url.includes('://')) {
      return window.location.protocol === "https:";
    }
    
    // For absolute URLs, check the protocol directly
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidLoadUrl(url: string): boolean {
  try {
    // Resolve relative URLs against current location
    const parsedUrl = new URL(url, window.location.href);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }

    // Prevent javascript:, vbscript:, and data: URLs (redundant check but good for clarity)
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
