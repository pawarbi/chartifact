import { Host } from "./index.js";
import { determineContent } from "./string.js";

export function checkUrlForFile(host: Host) {
  const urlParams = new URLSearchParams(window.location.search);
  const loadUrl = urlParams.get(host.options.urlParamName);

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
