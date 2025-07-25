import { Previewer, PreviewerOptions } from './preview.js';
import { rendererHtml } from './resources/rendererHtml.js';
import { rendererUmdJs } from './resources/rendererUmdJs.js';
import { sandboxedJs } from './resources/sandboxedJs.js';
import type { RenderRequestMessage } from 'common';

export class Sandbox extends Previewer {
    private iframe: HTMLIFrameElement;

    constructor(elementOrSelector: string | HTMLElement, markdown: string, options?: PreviewerOptions) {
        super(elementOrSelector, markdown, options);

        const renderRequest: RenderRequestMessage = { markdown };

        const { iframe } = createIframe(this.getDependencies(), renderRequest);
        this.iframe = iframe;
        this.element.appendChild(this.iframe);

        this.iframe.addEventListener('load', () => {
            options?.onReady?.();
        });

        this.iframe.addEventListener('error', (error) => {
            console.error('Error loading iframe:', error);
            options?.onError?.(new Error('Failed to load iframe'));
        });
    }

    destroy() {
        //remove all iframe listeners
        this.iframe.removeEventListener('load', () => { });
        this.iframe.removeEventListener('error', () => { });
        this.iframe?.remove();
    }

    send(markdown: string): void {
        const message: RenderRequestMessage = { markdown };
        this.iframe.contentWindow?.postMessage(message, '*');
    }

    getDependencies() {
        return `
<link href="https://unpkg.com/tabulator-tables@6.3.0/dist/css/tabulator.min.css" rel="stylesheet" />
<script src="https://cdn.jsdelivr.net/npm/markdown-it/dist/markdown-it.min.js"></script>
<script src="https://unpkg.com/css-tree/dist/csstree.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vega@5.29.0"></script>
<script src="https://cdn.jsdelivr.net/npm/vega-lite@5.20.1"></script>
<script src="https://unpkg.com/tabulator-tables@6.3.0/dist/js/tabulator.min.js"></script>
`;
    }
}

function createIframe(dependencies: string, renderRequest: RenderRequestMessage) {
    const title = 'Interactive Document Sandbox';
    const html = rendererHtml
        .replace('{{TITLE}}', () => title)
        .replace('{{DEPENDENCIES}}', () => dependencies)
        .replace('{{RENDERER_SCRIPT}}', () => `<script>${rendererUmdJs}</script>`)
        .replace('{{RENDER_REQUEST}}', () => `<script>const renderRequest = ${JSON.stringify(renderRequest)};</script>`)
        .replace('{{SANDBOX_JS}}', () => `<script>${sandboxedJs}</script>`)
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
