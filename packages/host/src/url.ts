import { ContentHandler, ErrorHandler } from "./index.js";
import { determineContent } from "./string.js";

export async function checkUrlForFile(contentHandler: ContentHandler, errorHandler: ErrorHandler): Promise<boolean> {
  const urlParams = new URLSearchParams(window.location.search);
  const loadUrl = urlParams.get('load');

  if (loadUrl) {
    try {
      const response = await fetch(loadUrl);
      if (!response.ok) {
        throw new Error(`Failed to load ${loadUrl}`);
      }
      const content = await response.text();
      determineContent(content, contentHandler, errorHandler);
      return true;
    } catch (error) {
      errorHandler(error as Error, `Error loading file: ${loadUrl}`);
      return true; // We found a load parameter, even though it failed
    }
  } else {
    return false; // No load parameter found
  }
}
