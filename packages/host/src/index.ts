import { Renderer } from '@microsoft/interactive-document-renderer';
import { setupClipboardHandling } from './clipboard.js';
import { setupDragDropHandling } from './dragdrop.js';
import { setupFileUpload } from './upload.js';
import { checkUrlForFile } from './url.js';
import { setupPostMessageHandling } from './post-receive.js';
import { InteractiveDocument } from 'dsl';
import compiler from '@microsoft/interactive-document-compiler';
import { postStatus } from './post-send.js';

export interface HostOptions {
  clipboard?: boolean;
  dragDrop?: boolean;
  fileUpload?: boolean;
  postMessage?: boolean;
  postMessageTarget?: Window;
  url?: boolean;
}

export const options: HostOptions = {
  clipboard: true,
  dragDrop: true,
  fileUpload: true,
  postMessage: true,
  postMessageTarget: window.opener || window.parent || window,
  url: true,
};

let loadingDiv: HTMLElement;
let helpDiv: HTMLElement;
let appDiv: HTMLElement;

function show(element: HTMLElement, shown: boolean) {
  if (!element) {
    return;
  }
  element.style.display = shown ? '' : 'none';
}

export interface ContentHandler {
  (markdown?: string, interactiveDocument?: InteractiveDocument): void;
}

export interface ErrorHandler {
  (error: Error, details: string): void;
}

const errorHandler: ErrorHandler = (error, details) => {
  show(loadingDiv, false);
  appDiv.innerHTML = `<div style="color: red; padding: 20px;">
    <strong>Error:</strong> ${error.message}<br>
      ${details}
    </div>`;
};

let renderer: Renderer = undefined;

export function renderInteractiveDocument(content: InteractiveDocument) {
  postStatus(options.postMessageTarget, { status: 'compiling', details: 'Starting interactive document compilation' });
  const markdown = compiler(content);
  renderMarkdown(markdown);
}

export function renderMarkdown(content: string) {
  show(loadingDiv, false);
  show(helpDiv, false);

  if (!renderer) {
    errorHandler(new Error('Renderer not initialized'), 'Please wait for the application to load.');
    return;
  }

  try {
    postStatus(options.postMessageTarget, { status: 'rendering', details: 'Starting markdown rendering' });
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
        postStatus(options.postMessageTarget, { status: 'error', details: `Rendering error in ${pluginName}: ${error.message}` });
      }
    );
    postStatus(options.postMessageTarget, { status: 'rendered', details: 'Markdown rendering completed successfully' });
  } catch (error) {
    errorHandler(
      error, 'Error rendering markdown content'
    );
    postStatus(options.postMessageTarget, { status: 'error', details: `Rendering failed: ${error.message}` });
  }
}

const render: ContentHandler = (markdown?: string, interactiveDocument?: InteractiveDocument) => {
  if (interactiveDocument) {
    renderInteractiveDocument(interactiveDocument);
  } else if (markdown) {
    renderMarkdown(markdown);
  }
};

// Setup all event handlers
window.addEventListener('DOMContentLoaded', async () => {
  loadingDiv = document.getElementById('loading') as HTMLElement;
  helpDiv = document.getElementById('help') as HTMLElement;
  appDiv = document.getElementById('app') as HTMLElement;

  if (!appDiv) {
    throw new Error('App container not found');
  }

  show(loadingDiv, true);
  show(helpDiv, false);

  // Initialize renderer
  renderer = new Renderer(appDiv, {});

  // Setup clipboard, drag-drop, upload, and postMessage handling based on options
  if (options.clipboard) {
    setupClipboardHandling(render, errorHandler);
  }
  if (options.dragDrop) {
    setupDragDropHandling(render, errorHandler);
  }
  if (options.fileUpload) {
    setupFileUpload(render, errorHandler);
  }
  if (options.postMessage) {
    setupPostMessageHandling(render, errorHandler);
  }

  // Check URL parameters for file to load
  if (!options.url || (options.url && !await checkUrlForFile(render, errorHandler))) {
    show(loadingDiv, false);
    show(helpDiv, true);

    // Send ready message to parent window (if embedded)
    postStatus(options.postMessageTarget, { status: 'ready' });
  }
});
