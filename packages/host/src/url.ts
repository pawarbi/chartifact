/**
 * URL parameter handling functionality
 */

/**
 * Sets up URL parameter checking and file loading on page load
 * @param onFileLoad - Callback function to handle loading a file from URL parameter
 */
export function setupUrlHandling(onFileLoad: (filePath: string) => void): void {
  // Check URL parameters on load
  window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const mdFile = urlParams.get('md') || urlParams.get('file');

    if (mdFile) {
      onFileLoad(mdFile);
    }
  });
}

/**
 * Gets the markdown file parameter from the current URL
 * @returns The markdown file path from URL parameters, or null if not found
 */
export function getMarkdownFileFromUrl(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('md') || urlParams.get('file');
}
