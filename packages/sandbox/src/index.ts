import { defaultDependencies } from './dependencies.js';
import { rendererHtml } from './resources/rendererHtml.js';
import { rendererUmdJs } from './resources/rendererUmdJs.js';
import { RenderRequestMessage } from './types.js';
import { RendererOptions } from '@microsoft/interactive-document-markdown';

interface SandboxOptions {
    onReady?: () => void;
    onError?: (error: Event) => void;
    rendererOptions?: RendererOptions;
    markdown?: string;
    dependencies?: string;
}

export class Sandbox {
    private iframe: HTMLIFrameElement;

    constructor(elementOrSelector: string | HTMLElement, options?: SandboxOptions) {
        const { iframe, blobUrl } = createIframe(options?.markdown, options?.dependencies, options?.rendererOptions);
        this.iframe = iframe;

        let element: HTMLElement;

        if (typeof elementOrSelector === 'string') {
            element = document.querySelector(elementOrSelector);
            if (!element) {
                throw new Error(`Element not found: ${elementOrSelector}`);
            }
        } else if (elementOrSelector instanceof HTMLElement) {
            element = elementOrSelector;
        } else {
            throw new Error('Invalid element type, must be a string selector or HTMLElement');
        }
        element.appendChild(this.iframe);

        this.iframe.addEventListener('load', () => {
            URL.revokeObjectURL(blobUrl);
            options?.onReady?.();
        });

        this.iframe.addEventListener('error', (error) => {
            console.error('Error loading iframe:', error);
            URL.revokeObjectURL(blobUrl);
            options?.onError?.(error);
        });
    }

    send(message: RenderRequestMessage): void {
        this.iframe.contentWindow?.postMessage(message, '*');
    }
}

function createIframe(markdown?: string, dependencies: string = defaultDependencies, rendererOptions: RendererOptions = {}) {
    const title = 'Interactive Document Sandbox';
    const html = rendererHtml
        .replace('{{TITLE}}', () => title)
        .replace('{{DEPENDENCIES}}', () => dependencies)
        .replace('{{RENDERER_SCRIPT}}', () => `<script>${rendererUmdJs}</script>`)
        .replace('{{RENDERER_OPTIONS}}', () => `<script>const rendererOptions = ${JSON.stringify(rendererOptions)};</script>`)
        .replace('{{MARKDOWN_SCRIPT}}', () => `<script>const markdown = ${JSON.stringify(markdown || '')};</script>`)
        ;

    const htmlBlob = new Blob([html], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(htmlBlob);

    const iframe = document.createElement('iframe');
    iframe.sandbox = 'allow-scripts';
    iframe.src = blobUrl;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.title = title;

    return { iframe, blobUrl };
}
