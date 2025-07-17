import { Listener } from "./listener.js";
import { determineContent } from "./string.js";

export function checkUrlForFile(host: Listener) {
  const urlParams = new URLSearchParams(window.location.search);
  const loadUrl = urlParams.get(host.options.urlParamName);

  //ensure loadUrl is on the same origin, or must be https
  const isValidUrl = (url: string) => isSameOrigin(url) || isHttps(url);

  if (loadUrl && !isValidUrl(loadUrl)) {
    host.errorHandler(
      new Error(`Invalid URL: ${loadUrl}`),
      'The URL provided is not valid. Please ensure it is on the same origin or uses HTTPS.'
    );
    return false;
  }

  if (loadUrl) {
    try {

      fetch(loadUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load ${loadUrl}`);
          }
          return response.text();
        })
        .then(content => {
          determineContent(content, host);
        })
        .catch(error => {
          host.errorHandler(error as Error, `Error loading file: ${loadUrl}`);
        });

    } catch (error) {
      host.errorHandler(error as Error, `Error loading file: ${loadUrl}`);
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
