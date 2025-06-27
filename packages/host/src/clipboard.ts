import { readFile } from "./file.js";
import { ContentHandler, ErrorHandler } from "./index.js";
import { determineContent } from "./string.js";

export function setupClipboardHandling(contentHandler: ContentHandler, errorHandler: ErrorHandler) {

  const pasteHandler = (e: ClipboardEvent) => {
    e.preventDefault();

    const clipboardData = e.clipboardData;
    if (clipboardData && clipboardData.files.length > 0) {
      const file = clipboardData.files[0];
      readFile(file, contentHandler, errorHandler);
    } else if (clipboardData && clipboardData.items) {
      // Handle clipboard items (VS Code puts file content as text)
      for (let i = 0; i < clipboardData.items.length; i++) {
        const item = clipboardData.items[i];

        if (item.kind === 'string' && item.type === 'text/plain') {
          item.getAsString((content) => {
            if (!content) {
              errorHandler(
                new Error('Pasted content is empty'),
                'The pasted content was empty. Please paste valid markdown content or JSON.'
              );
              return;
            }
            content = content.trim();
            if (!content) {
              errorHandler(
                new Error('Pasted content is empty'),
                'The pasted content was only whitespace. Please paste valid markdown content or JSON.'
              );
              return;
            }
            determineContent(content, contentHandler, errorHandler);
            //remove the event listener after handling the paste
            document.removeEventListener('paste', pasteHandler);
          });
          break;
        }
      }
    }
  };
  document.addEventListener('paste', pasteHandler);
}
