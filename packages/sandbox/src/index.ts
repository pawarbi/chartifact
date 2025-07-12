import { rendererHtml } from "./resources/rendererHtml";
import { rendererUmdJs } from "./resources/rendererUmdJs";

interface SandboxOptions {
    onReady?: () => void;
    onError?: (error: Event) => void;
    markdown?: string;
}

export class Sandbox {
    private iframe: HTMLIFrameElement;

    constructor(element: HTMLElement, options?: SandboxOptions) {
        const { iframe, blobUrl } = createIframe(options?.markdown);
        this.iframe = iframe;
        element.appendChild(this.iframe);

        this.iframe.addEventListener('load', () => {
            URL.revokeObjectURL(blobUrl);
            options?.onReady?.();
        });

        this.iframe.addEventListener('error', (error) => {
            console.error("Error loading iframe:", error);
            URL.revokeObjectURL(blobUrl);
            options?.onError?.(error);
        });
    }

    send(markdown: string): void {
        this.iframe.contentWindow?.postMessage({ markdown }, '*');
    }
}

export function createIframe(markdown?: string) {
    const title = 'Interactive Document Sandbox';
    const html = rendererHtml
        .replace('{{MARKDOWN_CONTENT}}', () => markdown || '')
        .replace('{{TITLE}}', () => title)
        .replace('{{RENDERER_SCRIPT}}', () => `<script>${rendererUmdJs}</script>`);

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
