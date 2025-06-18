/**
 * Drag and drop handling functionality
 */

/**
 * Sets up drag and drop event handling for markdown files
 * @param onMarkdownDrop - Callback function to handle dropped markdown content
 * @param onError - Callback function to handle errors
 */
export function setupDragDropHandling(
  onMarkdownDrop: (content: string) => void,
  onError: (error: Error, details: string) => void
): void {
  // Handle drag and drop
  document.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  document.addEventListener('drop', (e) => {
    e.preventDefault();

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      // Handle regular file drops (Windows shell)
      const file = files[0];
      if (file.name.endsWith('.md')) {
        handleDroppedFile(file, onMarkdownDrop);
      }
    } else if (e.dataTransfer?.types.includes('text/plain')) {
      // Handle VS Code file drops
      const filePath = e.dataTransfer.getData('text/plain');

      if (filePath && filePath.endsWith('.md')) {
        onError(
          new Error(`Cannot directly read local file: ${filePath}`),
          'The browser blocks local files for security reasons. Try copying the file content and pasting it instead.'
        );
      }
    }
  });
}

/**
 * Handles a file dropped onto the page
 * @param file - The dropped file
 * @param onMarkdownDrop - Callback function to handle the file content
 */
function handleDroppedFile(file: File, onMarkdownDrop: (content: string) => void): void {
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target?.result as string;
    onMarkdownDrop(content);
  };
  reader.readAsText(file);
}
