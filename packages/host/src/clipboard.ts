import { readFile } from "./file.js";
import { Host } from "./index.js";
import { determineContent } from "./string.js";

export function setupClipboardHandling(host: Host) {

  const pasteHandler = (e: ClipboardEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const clipboardData = e.clipboardData;
    if (clipboardData && clipboardData.files.length > 0) {
      const file = clipboardData.files[0];
      readFile(file, host);
    } else if (clipboardData && clipboardData.items) {
      // Handle clipboard items (VS Code puts file content as text)
      for (let i = 0; i < clipboardData.items.length; i++) {
        const item = clipboardData.items[i];

        if (item.kind === 'string' && item.type === 'text/plain') {
          item.getAsString((content) => {
            if (!content) {
              host.errorHandler(
                new Error('Pasted content is empty'),
                'The pasted content was empty. Please paste valid markdown content or JSON.'
              );
              return;
            }
            content = content.trim();
            if (!content) {
              host.errorHandler(
                new Error('Pasted content is empty'),
                'The pasted content was only whitespace. Please paste valid markdown content or JSON.'
              );
              return;
            }
            determineContent(content, host);
          });
          break;
        }
      }
    }
  };
  document.addEventListener('paste', pasteHandler);

  return () => {
    document.removeEventListener('paste', pasteHandler);
  };
}
