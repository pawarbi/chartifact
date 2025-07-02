import { readFile } from "./file.js";
import { Listener } from "./listener.js";

export function setupFileUpload(host: Listener) {
  const { uploadButton, fileInput } = host;

  // Ensure elements exist
  if (!uploadButton || !fileInput) {
    host.errorHandler(
      new Error('Upload button or file input not found'),
      'Please ensure the upload button and file input elements are present in the HTML.'
    );
    return;
  }

  // Handle file upload button
  uploadButton?.addEventListener('click', () => {
    fileInput?.click();
  });

  // Handle file input change
  fileInput?.addEventListener('change', (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      readFile(file, host);
    } else {
      host.errorHandler(
        new Error('No file selected'),
        'Please select a markdown or JSON file to upload.'
      );
    }
  });
}
