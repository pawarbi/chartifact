import { Previewer, PreviewerOptions } from './preview.js';
import { rendererHtml } from './resources/rendererHtml.js';
import { rendererUmdJs } from './resources/rendererUmdJs.js';
import { RenderRequestMessage } from './types.js';
import { RendererOptions } from '@microsoft/interactive-document-markdown';

export class Sandbox extends Previewer {
    private iframe: HTMLIFrameElement;

    constructor(elementOrSelector: string | HTMLElement, options?: PreviewerOptions) {
        super(elementOrSelector, options);
        
        const { iframe, blobUrl } = createIframe(this.getDependencies(), options?.markdown, options?.rendererOptions);
        this.iframe = iframe;
        this.element.appendChild(this.iframe);

        this.iframe.addEventListener('load', () => {
            URL.revokeObjectURL(blobUrl);
            options?.onReady?.();
        });

        this.iframe.addEventListener('error', (error) => {
            console.error('Error loading iframe:', error);
            URL.revokeObjectURL(blobUrl);
            options?.onError?.(new Error('Failed to load iframe'));
        });
    }

    send(message: RenderRequestMessage): void {
        this.iframe.contentWindow?.postMessage(message, '*');
    }

    getDependencies() {
        return `
<link href="https://unpkg.com/tabulator-tables@6.3.0/dist/css/tabulator.min.css" rel="stylesheet" />
<script src="https://cdn.jsdelivr.net/npm/markdown-it/dist/markdown-it.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vega@5.29.0"></script>
<script src="https://cdn.jsdelivr.net/npm/vega-lite@5.20.1"></script>
<script src="https://unpkg.com/tabulator-tables@6.3.0/dist/js/tabulator.min.js"></script>
`;
    }
}

function createIframe(dependencies: string, markdown: string = '', rendererOptions: RendererOptions = {}) {
    const title = 'Interactive Document Sandbox';
    const html = rendererHtml
        .replace('{{TITLE}}', () => title)
        .replace('{{DEPENDENCIES}}', () => dependencies)
        .replace('{{RENDERER_SCRIPT}}', () => `<script>${rendererUmdJs}</script>`)
        .replace('{{RENDERER_OPTIONS}}', () => `<script>const rendererOptions = ${JSON.stringify(rendererOptions)};</script>`)
        .replace('{{MARKDOWN_SCRIPT}}', () => `<script>const markdown = ${JSON.stringify(markdown)};</script>`)
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
