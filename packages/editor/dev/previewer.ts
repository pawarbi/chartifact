import { Renderer } from '@microsoft/interactive-document-markdown';
import { Previewer, PreviewerOptions, RenderRequestMessage } from 'sandbox';

export class DevPreviewer extends Previewer {
    private renderer: Renderer | null = null;

    constructor(elementOrSelector: string | HTMLElement, options: PreviewerOptions) {
        super(elementOrSelector, options);
        try {
            this.renderer = new Renderer(this.element, { useShadowDom: true });
            this.renderer.render(options.markdown!);
            options.onReady?.();
        } catch (error) {
            this.displayError('Failed to create renderer');
            options.onError?.(error);
        }
    }

    send(message: RenderRequestMessage): void {
        if (!this.renderer) {
            this.displayError('Renderer is not initialized');
            this.options.onError?.(new Error('Renderer is not initialized'));
            return;
        }
        try {
            this.renderer.render(message.markdown!);
        } catch (error) {
            this.displayError(error);
            this.options.onError?.(error);
        }
    }

    private displayError(error: unknown): void {
        this.element.innerHTML = `<div style="color: red; padding: 10px; border: 1px solid red; background-color: #ffe6e6; border-radius: 4px;">
            <strong>Error:</strong> ${error instanceof Error ? error.message : String(error)}
        </div>`;
    }
}
