import { Renderer } from '@microsoft/interactive-document-renderer';
import { setupClipboardHandling } from './clipboard.js';
import { setupDragDropHandling } from './dragdrop.js';
import { setupFileUpload } from './upload.js';
import { checkUrlForFile } from './url.js';
import { setupPostMessageHandling } from './post-receive.js';
import { InteractiveDocument } from 'dsl';
import compiler from '@microsoft/interactive-document-compiler';
import { postStatus } from './post-send.js';

function getElement(elementOrSelector: string | HTMLElement): HTMLElement | null {
  if (typeof elementOrSelector === 'string') {
    return document.querySelector(elementOrSelector) as HTMLElement;
  }
  return elementOrSelector;
}

function show(element: HTMLElement, shown: boolean) {
  if (!element) {
    return;
  }
  element.style.display = shown ? '' : 'none';
}

export interface InitializeHostOptions {
  app?: string | HTMLElement;
  loading?: string | HTMLElement;
  help?: string | HTMLElement;
  options?: HostOptions;
}

export interface HostOptions {
  clipboard?: boolean;
  dragDrop?: boolean;
  fileUpload?: boolean;
  postMessage?: boolean;
  postMessageTarget?: Window;
  url?: boolean;
}

const defaultOptions: HostOptions = {
  clipboard: true,
  dragDrop: true,
  fileUpload: true,
  postMessage: true,
  postMessageTarget: window.opener || window.parent || window,
  url: true,
};

export class Host {
  public options: HostOptions;
  public loadingDiv: HTMLElement;
  public helpDiv: HTMLElement;
  public appDiv: HTMLElement;
  public renderer: Renderer;

  constructor(options: InitializeHostOptions) {
    this.options = { ...defaultOptions, ...options.options };
    console.log('Host initialized with options:', this.options);

    this.loadingDiv = getElement(options.loading);
    this.helpDiv = getElement(options.help);
    this.appDiv = getElement(options.app);

    if (!this.appDiv) {
      throw new Error('App container not found');
    }

    show(this.loadingDiv, true);
    show(this.helpDiv, false);

    // Initialize renderer
    this.renderer = new Renderer(this.appDiv, {});

    // Setup clipboard, drag-drop, upload, and postMessage handling based on options
    if (this.options.clipboard) {
      setupClipboardHandling(this);
    }
    if (this.options.dragDrop) {
      setupDragDropHandling(this);
    }
    if (this.options.fileUpload) {
      setupFileUpload(this);
    }
    if (this.options.postMessage) {
      setupPostMessageHandling(this);
    }

    // Check URL parameters for file to load
    if (!this.options.url || (this.options.url && !checkUrlForFile(this))) {
      show(this.loadingDiv, false);
      show(this.helpDiv, true);

      // Send ready message to parent window (if embedded)
      postStatus(this.options.postMessageTarget, { status: 'ready' });
    }
  }

  public errorHandler(error, details) {
    show(this.loadingDiv, false);
    this.appDiv.innerHTML = `<div style="color: red; padding: 20px;">
    <strong>Error:</strong> ${error.message}<br>
      ${details}
    </div>`;
  }

  public render(markdown?: string, interactiveDocument?: InteractiveDocument) {
    if (interactiveDocument) {
      this.renderInteractiveDocument(interactiveDocument);
    } else if (markdown) {
      this.renderMarkdown(markdown);
    }
  }

  public renderInteractiveDocument(content: InteractiveDocument) {
    postStatus(this.options.postMessageTarget, { status: 'compiling', details: 'Starting interactive document compilation' });
    const markdown = compiler(content);
    this.renderMarkdown(markdown);
  }

  public renderMarkdown(content: string) {
    show(this.loadingDiv, false);
    show(this.helpDiv, false);

    if (!this.renderer) {
      this.errorHandler(new Error('Renderer not initialized'), 'Please wait for the application to load.');
      return;
    }

    try {
      postStatus(this.options.postMessageTarget, { status: 'rendering', details: 'Starting markdown rendering' });
      this.renderer.destroy(); // Clean up previous renderer instance
      // Use your renderer to process the markdown
      this.renderer.render(
        content,
        (error: Error, pluginName: string, instanceIndex: number, phase: string, container: Element, detail?: string) => {
          const msg = `<strong>Error in ${pluginName}:</strong> ${error.message}<br>
          <strong>Instance:</strong> ${instanceIndex}<br>
          <strong>Phase:</strong> ${phase}<br>
          <strong>Container:</strong> ${container.tagName}<br>
          ${detail ? `<strong>Detail:</strong> ${detail}` : ''}`;
          this.errorHandler(error, msg);
          postStatus(this.options.postMessageTarget, { status: 'error', details: `Rendering error in ${pluginName}: ${error.message}` });
        }
      );
      postStatus(this.options.postMessageTarget, { status: 'rendered', details: 'Markdown rendering completed successfully' });
    } catch (error) {
      this.errorHandler(
        error, 'Error rendering markdown content'
      );
      postStatus(this.options.postMessageTarget, { status: 'error', details: `Rendering failed: ${error.message}` });
    }
  }

}
