import { readFile } from "./file.js";
import { ContentHandler, ErrorHandler } from "./index.js";

export function setupFileUpload(contentHandler: ContentHandler, errorHandler: ErrorHandler) {
  const uploadBtn = document.getElementById('upload-btn') as HTMLButtonElement;
  const fileInput = document.getElementById('file-input') as HTMLInputElement;

  // Ensure elements exist
  if (!uploadBtn || !fileInput) {
    errorHandler(
      new Error('Upload button or file input not found'),
      'Please ensure the upload button and file input elements are present in the HTML.'
    );
    return;
  }

  // Handle file upload button
  uploadBtn?.addEventListener('click', () => {
    fileInput?.click();
  });

  // Handle file input change
  fileInput?.addEventListener('change', (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      readFile(file, contentHandler, errorHandler);
    } else {
      errorHandler(
        new Error('No file selected'),
        'Please select a markdown or JSON file to upload.'
      );
    }
  });
}
