/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { Sandbox } from '@microsoft/chartifact-sandbox';
import { targetMarkdown } from '@microsoft/chartifact-compiler';
import { setupClipboardHandling } from './clipboard.js';
import { setupDragDropHandling } from './dragdrop.js';
import { setupFileUpload } from './upload.js';
import { checkUrlForFile } from './url.js';
import { setupPostMessageHandling } from './post-receive.js';
import { InteractiveDocument, InteractiveDocumentWithSchema } from '@microsoft/chartifact-schema';
import { postStatus } from './post-send.js';
import { ListenOptions } from './types.js';
import { SpecReview, SandboxedPreHydrateMessage } from 'common';
import { Toolbar } from 'toolbar';

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
  toolbar?: string | HTMLElement;
  options?: ListenOptions;
  onApprove: (message: SandboxedPreHydrateMessage) => SpecReview<{}>[];
  sandboxConstructor?: typeof Sandbox;
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
  public toolbar: Toolbar;
  public sandbox: Sandbox;
  public sandboxReady: boolean = false;
  public onApprove: (message: SandboxedPreHydrateMessage) => SpecReview<{}>[];

  private removeInteractionHandlers: (() => void)[];
  private sandboxConstructor?: typeof Sandbox;

  constructor(options: InitializeOptions) {
    this.sandboxConstructor = options.sandboxConstructor || Sandbox;
    this.options = { ...defaultOptions, ...options?.options };
    this.onApprove = options.onApprove;
    this.removeInteractionHandlers = [];

    this.appDiv = getElement(options.app);
    this.loadingDiv = getElement(options.loading);
    this.helpDiv = getElement(options.help);
    this.uploadButton = getElement(options.uploadButton);
    this.fileInput = getElement(options.fileInput);
    this.textarea = getElement<HTMLTextAreaElement>(options.textarea);

    if (options.toolbar) {
      this.toolbar = new Toolbar(options.toolbar);
    }

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

    this.sandbox = new (this.sandboxConstructor)(this.appDiv, markdown, {
      onReady: () => {
        this.sandboxReady = true;

        // Send ready message to parent window (if embedded)
        postStatus(this.options.postMessageTarget, { type: 'hostStatus', hostStatus: 'ready' });
      },
      onError: () => {
        this.errorHandler(
          'Sandbox initialization failed',
          'Sandbox could not be initialized'
        );
      },
      onApprove: this.onApprove,
    });

    if (!markdown) {
      show(this.sandbox.element, false);
    }
  }

  public errorHandler(error: Error | string, details: string) {
    show(this.loadingDiv, false);
    show(this.helpDiv, false);
    show(this.appDiv, true);

    let message: string;
    if (typeof error === 'string') {
      message = error;
    } else if (typeof error.message === 'string') {
      message = error.message;
    } else {
      try {
        message = error.toString();
      } catch {
        message = 'Unknown error';
      }
    }

    //try to show the message in the sandbox, since it works well with paging folder content
    if (this.sandboxReady) {
      const markdown = `# Error:\n${message}\n\n${details}`;
      this.render(markdown, undefined);
    } else {
      // Clear previous content
      this.appDiv.innerHTML = '';
      const h1 = document.createElement('h1');
      h1.textContent = 'Error';
      const pMessage = document.createElement('p');
      pMessage.textContent = message;
      const pDetails = document.createElement('p');
      pDetails.textContent = details;
      this.appDiv.appendChild(h1);
      this.appDiv.appendChild(pMessage);
      this.appDiv.appendChild(pDetails);
    }
  }

  private bindTextareaToCompiler() {
    const render = () => {
      const json = this.textarea.value;
      try {
        const interactiveDocument = JSON.parse(json) as InteractiveDocumentWithSchema;
        if (typeof interactiveDocument !== 'object') {
          this.errorHandler(
            'Invalid JSON format',
            'Please provide a valid Interactive Document JSON.'
          );
          return;
        }
        this.renderInteractiveDocument(interactiveDocument);
      } catch (error) {
        this.errorHandler(
          error,
          'Failed to parse Interactive Document JSON'
        );
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
      this.errorHandler(
        'No content provided',
        'Please provide either markdown or an interactive document to render.'
      );
    }
    //remove interactions that are disruptive (after a document is rendered)
    this.removeInteractionHandlers.forEach(removeHandler => removeHandler());
    this.removeInteractionHandlers = []; // Clear handlers after rendering
  }

  private renderInteractiveDocument(content: InteractiveDocument) {
    postStatus(this.options.postMessageTarget, { type: 'hostStatus', hostStatus: 'compiling', details: 'Starting interactive document compilation' });
    const markdown = targetMarkdown(content);
    this.renderMarkdown(markdown);
  }

  private hideLoadingAndHelp() {
    show(this.loadingDiv, false);
    show(this.helpDiv, false);
  }

  private renderMarkdown(markdown: string) {
    this.hideLoadingAndHelp();

    try {
      postStatus(this.options.postMessageTarget, { type: 'hostStatus', hostStatus: 'rendering', details: 'Starting markdown rendering' });
      if (!this.sandbox || !this.sandboxReady) {
        this.createSandbox(markdown);
      } else {
        this.sandbox.send(markdown);
      }
      show(this.sandbox.element, true);
      postStatus(this.options.postMessageTarget, { type: 'hostStatus', hostStatus: 'rendered', details: 'Markdown rendering completed successfully' });
    } catch (error) {
      this.errorHandler(
        error,
        'Error rendering markdown content'
      );
      postStatus(this.options.postMessageTarget, { type: 'hostStatus', hostStatus: 'error', details: `Rendering failed: ${error.message}` });
    }
  }

}
