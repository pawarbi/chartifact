import { readFile } from "./file.js";
import { Host } from "./index.js";
import { determineContent } from "./string.js";

export function setupDragDropHandling(host: Host) {

  const dragHandler = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  document.addEventListener('dragover', dragHandler);

  const dropHandler = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      // Handle regular file drops (Windows shell)
      const file = files[0];
      readFile(file, host);
    } else if (e.dataTransfer?.types.includes('text/plain')) {
      let content = e.dataTransfer.getData('text/plain');
      if (!content) {
        host.errorHandler(
          new Error('Dropped content is empty'),
          'The dropped content was empty. Please drop valid markdown content or JSON.'
        );
        return;
      }
      content = content.trim();
      if (!content) {
        host.errorHandler(
          new Error('Dropped content is empty'),
          'The dropped content was only whitespace. Please drop valid markdown content or JSON.'
        );
        return;
      }
      determineContent(content, host);

      // Remove the event listener after handling the drop
      document.removeEventListener('drop', dropHandler);
      document.removeEventListener('dragover', dragHandler);
    }
  };

  document.addEventListener('drop', dropHandler);
}
