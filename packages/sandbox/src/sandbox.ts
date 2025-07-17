import { Previewer, PreviewerOptions } from './preview.js';
import { rendererHtml } from './resources/rendererHtml.js';
import { rendererUmdJs } from './resources/rendererUmdJs.js';
import { Renderer, RendererOptions } from '@microsoft/interactive-document-markdown';

interface RenderRequestMessage {
    markdown?: string;
    html?: string;
}

export class Sandbox extends Previewer {
    private iframe: HTMLIFrameElement;
    private renderer: Renderer;

    constructor(elementOrSelector: string | HTMLElement, markdown: string, options?: PreviewerOptions) {
        super(elementOrSelector, markdown, options);

        //create a renderer for decompilation, not to render in this DOM context
        this.renderer = new Renderer(null, { ...options?.rendererOptions, useShadowDom: false });

        const renderRequest = this.createRenderRequest(markdown);

        const { iframe, blobUrl } = createIframe(this.getDependencies(), renderRequest, options?.rendererOptions);
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

    destroy() {
        //remove all iframe listeners
        this.iframe.removeEventListener('load', () => {});
        this.iframe.removeEventListener('error', () => {});
        this.iframe?.remove();
    }

    createRenderRequest(markdown: string): RenderRequestMessage {
        //render into a document to ensure it is sanitized
        const html = this.renderer.renderHtml(markdown);
        const doc = new DOMParser().parseFromString(html, 'text/html');
        //TODO: sanitize the document
        return { html: doc.body.innerHTML };
    }

    send(markdown: string): void {
        //TODO get html and ensure it is sanitized
        this.iframe.contentWindow?.postMessage(this.createRenderRequest(markdown), '*');
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

function createIframe(dependencies: string, renderRequest: RenderRequestMessage, rendererOptions: RendererOptions = {}) {
    const title = 'Interactive Document Sandbox';
    const html = rendererHtml
        .replace('{{TITLE}}', () => title)
        .replace('{{DEPENDENCIES}}', () => dependencies)
        .replace('{{RENDERER_SCRIPT}}', () => `<script>${rendererUmdJs}</script>`)
        .replace('{{RENDERER_OPTIONS}}', () => `<script>const rendererOptions = ${JSON.stringify(rendererOptions)};</script>`)
        .replace('{{RENDER_REQUEST}}', () => `<script>const renderRequest = ${JSON.stringify(renderRequest)};</script>`)
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
