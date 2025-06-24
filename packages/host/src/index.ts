import { Renderer } from '@microsoft/interactive-document-renderer';
import { setupClipboardHandling } from './clipboard.js';
import { setupDragDropHandling } from './dragdrop.js';
import { setupFileUpload } from './upload.js';
import { checkUrlForFile } from './url.js';
import { setupPostMessageHandling, postStatus } from './postmessage.js';

export { setPostMessageTarget } from './postmessage.js';

let loadingDiv: HTMLElement;
let helpDiv: HTMLElement;
let appDiv: HTMLElement;
let uploadBtn: HTMLButtonElement;
let fileInput: HTMLInputElement;

function show(element: HTMLElement, shown: boolean) {
  if (!element) {
    return;
  }
  element.style.display = shown ? '' : 'none';
}

const errorHandler = (error: Error, details: string) => {
  show(loadingDiv, false);
  appDiv.innerHTML = `<div style="color: red; padding: 20px;">
    <strong>Error:</strong> ${error.message}<br>
      ${details}
    </div>`;
};

let renderer: Renderer = undefined;

export function renderMarkdown(content: string) {
  show(loadingDiv, false);
  show(helpDiv, false);

  if (!renderer) {
    errorHandler(new Error('Renderer not initialized'), 'Please wait for the application to load.');
    return;
  }

  try {
    postStatus({ status: 'rendering', details: 'Starting markdown rendering' });
    renderer.destroy(); // Clean up previous renderer instance
    // Use your renderer to process the markdown
    renderer.render(
      content,
      (error: Error, pluginName: string, instanceIndex: number, phase: string, container: Element, detail?: string) => {
        const msg = `<strong>Error in ${pluginName}:</strong> ${error.message}<br>
          <strong>Instance:</strong> ${instanceIndex}<br>
          <strong>Phase:</strong> ${phase}<br>
          <strong>Container:</strong> ${container.tagName}<br>
          ${detail ? `<strong>Detail:</strong> ${detail}` : ''}`;
        errorHandler(error, msg);
        postStatus({ status: 'error', details: `Rendering error in ${pluginName}: ${error.message}` });
      }
    );
    postStatus({ status: 'rendered', details: 'Markdown rendering completed successfully' });
  } catch (error) {
    errorHandler(
      error, 'Error rendering markdown content'
    );
    postStatus({ status: 'error', details: `Rendering failed: ${error.message}` });
  }
}

// Setup all event handlers
window.addEventListener('DOMContentLoaded', async () => {
  loadingDiv = document.getElementById('loading') as HTMLElement;
  helpDiv = document.getElementById('help') as HTMLElement;
  appDiv = document.getElementById('app') as HTMLElement;
  uploadBtn = document.getElementById('upload-btn') as HTMLButtonElement;
  fileInput = document.getElementById('file-input') as HTMLInputElement;

  show(helpDiv, false);

  // Initialize renderer
  renderer = new Renderer(appDiv, {});

  // Setup clipboard, drag-drop, upload, and postMessage handling
  setupClipboardHandling(renderMarkdown);
  setupDragDropHandling(renderMarkdown, errorHandler);
  setupFileUpload(uploadBtn, fileInput, renderMarkdown);
  setupPostMessageHandling(renderMarkdown, errorHandler);

  // Send ready message to parent window (if embedded)
  postStatus({ status: 'ready' });

  // Check URL parameters for file to load
  if (!await checkUrlForFile(renderMarkdown, errorHandler)) {
    show(loadingDiv, false);
    show(helpDiv, true);
  }
});
