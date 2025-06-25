/**
 * URL parameter handling functionality
 */

/**
 * Checks URL parameters for file to load and loads the file content
 * @param onFileLoad - Callback function to handle loaded file content
 * @param onError - Callback function to handle errors during file loading
 * @returns Promise<boolean> - true if load parameter was found, false otherwise
 */
export async function checkUrlForFile(
  onFileLoad: (content: string) => void,
  onError: (error: Error, details: string) => void
): Promise<boolean> {
  const urlParams = new URLSearchParams(window.location.search);
  const loadUrl = urlParams.get('load');

  if (loadUrl) {
    try {
      const response = await fetch(loadUrl);
      if (!response.ok) {
        throw new Error(`Failed to load ${loadUrl}`);
      }
      const content = await response.text();
      onFileLoad(content);
      return true;
    } catch (error) {
      onError(error as Error, `Error loading file: ${loadUrl}`);
      return true; // We found a load parameter, even though it failed
    }
  } else {
    return false; // No load parameter found
  }
}

/**
 * Loads a markdown file from a given file path
 * @param filePath - The path to the markdown file
 * @param onSuccess - Callback function to handle successful file load
 * @param onError - Callback function to handle errors
 */
export async function loadMarkdownFile(
  filePath: string,
  onSuccess: (content: string) => void,
  onError: (error: Error, details: string) => void
): Promise<void> {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to load ${filePath}`);
    }
    const content = await response.text();
    onSuccess(content);
  } catch (error) {
    onError(error as Error, `Error loading file: ${filePath}`);
  }
}
