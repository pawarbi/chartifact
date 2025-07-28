import { Renderer } from '@microsoft/interactive-document-markdown';
import { Previewer, PreviewerOptions } from '@microsoft/chartifact-sandbox';

export class DevPreviewer extends Previewer {
    public renderer: Renderer;

    constructor(elementOrSelector: string | HTMLElement, markdown: string, options: PreviewerOptions) {
        super(elementOrSelector, markdown, options);
        try {
            this.renderer = new Renderer(this.element, { useShadowDom: true });

            // Minimal CSS to keep the host from growing wider than its parent
            const style: Partial<CSSStyleDeclaration> = {
                display: 'block',
                width: '100%',
                maxWidth: '100%',
                minWidth: '0',
                contain: 'layout style',
                boxSizing: 'border-box',
            };
            Object.assign(this.element.style, style);

            this.render(markdown);
            options.onReady?.();
        } catch (error) {
            this.displayError('Failed to create renderer');
            options.onError?.(error);
        }
    }

    render(markdown: string) {
        const html = this.renderer.renderHtml(markdown);
        const newHtml = `<style>.tabulator { margin-right: -1px; }</style>
<link href="https://unpkg.com/tabulator-tables@6.3.0/dist/css/tabulator.min.css" rel="stylesheet" />
${html}`;
        this.renderer.element.innerHTML = newHtml;
        const x = this.renderer.hydrateSpecs();
        this.renderer.hydrate(x);
    }

    send(markdown: string) {
        try {
            this.render(markdown);
        } catch (error) {
            this.displayError(error);
            this.options.onError?.(error);
        }
    }

    private displayError(error: unknown) {
        this.element.innerHTML = `<div style="color: red; padding: 10px; border: 1px solid red; background-color: #ffe6e6; border-radius: 4px;">
            <strong>Error:</strong> ${error instanceof Error ? error.message : String(error)}
        </div>`;
    }
}
