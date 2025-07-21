import { Renderer } from '@microsoft/interactive-document-markdown';
import { Previewer, PreviewerOptions } from '@microsoft/chartifact-sandbox';

export class DevPreviewer extends Previewer {
    private renderer: Renderer;

    constructor(elementOrSelector: string | HTMLElement, markdown: string, options: PreviewerOptions) {
        super(elementOrSelector, markdown, options);
        try {
            this.renderer = new Renderer(this.element, { useShadowDom: true });
            this.render(markdown);
            options.onReady?.();
        } catch (error) {
            this.displayError('Failed to create renderer');
            options.onError?.(error);
        }
    }

    render(markdown: string) {
        const html = this.renderer.renderHtml(markdown);
        this.renderer.element.innerHTML = html;
        this.renderer.hydrate().catch(error => {
            this.displayError('Failed to hydrate components');
            this.options.onError?.(error);
        });
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
