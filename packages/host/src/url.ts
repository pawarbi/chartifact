/**
 * URL parameter handling functionality
 */

/**
 * Checks URL parameters for file to load
 * @param onFileLoad - Callback function to handle loading a file from URL parameter
 * @param onNoFileInUrl - Callback function to handle when no file is found in URL
 */
export function checkUrlForFile(onFileLoad: (filePath: string) => void, onNoFileInUrl?: () => void): void {
  const urlParams = new URLSearchParams(window.location.search);
  const mdFile = urlParams.get('load');

  if (mdFile) {
    onFileLoad(mdFile);
  } else if (onNoFileInUrl) {
    onNoFileInUrl();
  }
}
