/**
 * Clipboard handling functionality
 */

/**
 * Sets up clipboard paste event handling for markdown content
 * @param onMarkdownPaste - Callback function to handle pasted markdown content
 */
export function setupClipboardHandling(onMarkdownPaste: (content: string) => void): void {
  // Handle paste (for VS Code file copy)
  document.addEventListener('paste', (e) => {
    e.preventDefault();

    console.log('Paste event detected!');

    const clipboardData = e.clipboardData;
    if (clipboardData && clipboardData.files.length > 0) {
      const file = clipboardData.files[0];
      console.log('File pasted:', file.name, file.type);
      if (file.name.endsWith('.md')) {
        handleFileFromClipboard(file, onMarkdownPaste);
      }
    } else if (clipboardData && clipboardData.items) {
      // Handle clipboard items (VS Code puts file content as text)
      for (let i = 0; i < clipboardData.items.length; i++) {
        const item = clipboardData.items[i];
        console.log('Clipboard item:', item.kind, item.type);

        if (item.kind === 'string' && item.type === 'text/plain') {
          item.getAsString((content) => {
            console.log('Got text content, length:', content.length);
            console.log('Content preview:', content.substring(0, 100));
            if (content.trim()) {
              onMarkdownPaste(content);
            } else {
              console.log('Content was empty or whitespace only');
            }
          });
          break;
        }
      }
    }
  });
}

/**
 * Handles a file pasted from the clipboard
 * @param file - The file from clipboard
 * @param onMarkdownPaste - Callback function to handle the file content
 */
function handleFileFromClipboard(file: File, onMarkdownPaste: (content: string) => void): void {
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target?.result as string;
    onMarkdownPaste(content);
  };
  reader.readAsText(file);
}
