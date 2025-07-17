import { Sandbox } from 'sandbox';
import { targetMarkdown } from '@microsoft/interactive-document-compiler';
import { setupClipboardHandling } from './clipboard.js';
import { setupDragDropHandling } from './dragdrop.js';
import { setupFileUpload } from './upload.js';
import { checkUrlForFile } from './url.js';
import { setupPostMessageHandling } from './post-receive.js';
import { InteractiveDocument, InteractiveDocumentWithSchema } from 'schema';
import { postStatus } from './post-send.js';
import { ListenOptions } from './types.js';
import { RendererOptions } from '@microsoft/interactive-document-markdown';

function getElement<T extends HTMLElement = HTMLElement>(elementOrSelector: string | T): T | null {
  if (typeof elementOrSelector === 'string') {
    return document.querySelector(elementOrSelector) as T;
  }
  return elementOrSelector;
}

function show(element: HTMLElement, shown: boolean) {
  if (!element) {
    return;
  }
  element.style.display = shown ? '' : 'none';
}

export interface InitializeOptions {
  app: string | HTMLElement;
  loading?: string | HTMLElement;
  help?: string | HTMLElement;
  uploadButton?: string | HTMLElement;
  fileInput?: string | HTMLElement;
  textarea?: string | HTMLTextAreaElement;
  options?: ListenOptions;
  rendererOptions?: RendererOptions;
}

const defaultOptions: ListenOptions = {
  clipboard: true,
  dragDrop: true,
  fileUpload: true,
  postMessage: true,
  postMessageTarget: window.opener || window.parent || window,
  url: true,
  urlParamName: 'load',
};

export class Listener {
  public options: ListenOptions;
  public appDiv: HTMLElement;
  public loadingDiv: HTMLElement;
  public helpDiv: HTMLElement;
  public uploadButton: HTMLElement;
  public fileInput: HTMLElement;
  public textarea: HTMLTextAreaElement;
  public sandbox: Sandbox;
  public rendererOptions: RendererOptions;

  private removeInteractionHandlers: (() => void)[];
  private sandboxReady: boolean = false;

  constructor(options: InitializeOptions) {
    this.options = { ...defaultOptions, ...options?.options };
    this.rendererOptions = { ...options?.rendererOptions };
    this.removeInteractionHandlers = [];

    this.appDiv = getElement(options.app);
    this.loadingDiv = getElement(options.loading);
    this.helpDiv = getElement(options.help);
    this.uploadButton = getElement(options.uploadButton);
    this.fileInput = getElement(options.fileInput);
    this.textarea = getElement<HTMLTextAreaElement>(options.textarea);

    if (!this.appDiv) {
      throw new Error('App container not found');
    }

    show(this.loadingDiv, true);
    show(this.helpDiv, false);

    // Initialize sandbox
    this.createSandbox('');

    // Setup clipboard, drag-drop, upload, and postMessage handling based on options
    if (this.options.clipboard) {
      this.removeInteractionHandlers.push(setupClipboardHandling(this));
    }
    if (this.options.dragDrop) {
      this.removeInteractionHandlers.push(setupDragDropHandling(this));
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
    }
  }

  public createSandbox(markdown: string) {
    if (this.sandbox) {
      this.sandbox.destroy();
    }

    this.sandboxReady = false;

    this.sandbox = new Sandbox(this.appDiv, markdown, {
      onReady: () => {
        this.sandboxReady = true;

        // Send ready message to parent window (if embedded)
        postStatus(this.options.postMessageTarget, { status: 'ready' });
      },
      onError: () => {
        this.errorHandler(new Error('Sandbox initialization failed'), 'Sandbox could not be initialized');
      }
    });
  }

  public errorHandler(error: Error, detailsHtml: string) {
    show(this.loadingDiv, false);
    this.appDiv.innerHTML = `<div style="color: red; padding: 20px;">
    <strong>Error:</strong> ${error.message}<br>
      ${detailsHtml}
    </div>`;
  }

  private bindTextareaToCompiler() {
    const render = () => {
      const json = this.textarea.value;
      try {
        const interactiveDocument = JSON.parse(json) as InteractiveDocumentWithSchema;
        if (typeof interactiveDocument !== 'object') {
          this.errorHandler(new Error('Invalid JSON format'), 'Please provide a valid Interactive Document JSON.');
          return;
        }
        this.renderInteractiveDocument(interactiveDocument);
      } catch (error) {
        this.errorHandler(error, 'Failed to parse Interactive Document JSON');
      }
    };

    this.textarea.addEventListener('input', render);

    render(); // Initial render
  }

  private bindTextareaToMarkdown() {
    const render = () => {
      const markdown = this.textarea.value;
      this.renderMarkdown(markdown);
    };

    this.textarea.addEventListener('input', render);

    render(); // Initial render
  }

  public render(markdown?: string, interactiveDocument?: InteractiveDocument) {
    if (interactiveDocument) {
      if (this.textarea) {
        this.textarea.value = JSON.stringify(interactiveDocument, null, 2);
        this.hideLoadingAndHelp();
        this.bindTextareaToCompiler();
      } else {
        this.renderInteractiveDocument(interactiveDocument);
      }

    } else if (markdown) {
      if (this.textarea) {
        this.textarea.value = markdown;
        this.hideLoadingAndHelp();
        this.bindTextareaToMarkdown();
      } else {
        this.renderMarkdown(markdown);
      }
    } else {
      this.errorHandler(new Error('No content provided'), 'Please provide either markdown or an interactive document to render.');
    }
    //remove interactions that are disruptive (after a document is rendered)
    this.removeInteractionHandlers.forEach(removeHandler => removeHandler());
    this.removeInteractionHandlers = []; // Clear handlers after rendering
  }

  private renderInteractiveDocument(content: InteractiveDocument) {
    postStatus(this.options.postMessageTarget, { status: 'compiling', details: 'Starting interactive document compilation' });
    const markdown = targetMarkdown(content, this.rendererOptions);
    this.renderMarkdown(markdown);
  }

  private hideLoadingAndHelp() {
    show(this.loadingDiv, false);
    show(this.helpDiv, false);
  }

  private renderMarkdown(markdown: string) {
    this.hideLoadingAndHelp();

    try {
      postStatus(this.options.postMessageTarget, { status: 'rendering', details: 'Starting markdown rendering' });
      if (!this.sandbox || !this.sandboxReady) {
        this.createSandbox(markdown);
      } else {
        this.sandbox.send(markdown);
      }
      postStatus(this.options.postMessageTarget, { status: 'rendered', details: 'Markdown rendering completed successfully' });
    } catch (error) {
      this.errorHandler(
        error, 'Error rendering markdown content'
      );
      postStatus(this.options.postMessageTarget, { status: 'error', details: `Rendering failed: ${error.message}` });
    }
  }

}
