/**
 * File upload handling functionality
 */

/**
 * Sets up file upload event handling for markdown files
 * @param uploadBtn - The upload button element
 * @param fileInput - The file input element
 * @param onMarkdownUpload - Callback function to handle uploaded markdown content
 */
export function setupFileUpload(
  uploadBtn: HTMLButtonElement | null,
  fileInput: HTMLInputElement | null,
  onMarkdownUpload: (content: string) => void
): void {
  // Handle file upload button
  uploadBtn?.addEventListener('click', () => {
    fileInput?.click();
  });

  // Handle file input change
  fileInput?.addEventListener('change', (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && file.name.endsWith('.md')) {
      handleFileUpload(file, onMarkdownUpload);
    }
  });
}

/**
 * Handles an uploaded file
 * @param file - The uploaded file
 * @param onMarkdownUpload - Callback function to handle the file content
 */
function handleFileUpload(file: File, onMarkdownUpload: (content: string) => void): void {
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target?.result as string;
    onMarkdownUpload(content);
  };
  reader.readAsText(file);
}
