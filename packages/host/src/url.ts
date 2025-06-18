/**
 * URL parameter handling functionality
 */

/**
 * Sets up URL parameter checking and file loading on page load
 * @param onFileLoad - Callback function to handle loading a file from URL parameter
 * @param onNoFileInUrl - Callback function to handle when no file is found in URL
 */
export function setupUrlHandling(onFileLoad: (filePath: string) => void, onNoFileInUrl?: () => void): void {
  // Check URL parameters on load
  window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const mdFile = urlParams.get('load');

    if (mdFile) {
      onFileLoad(mdFile);
    } else if (onNoFileInUrl) {
      onNoFileInUrl();
    }
  });
}
