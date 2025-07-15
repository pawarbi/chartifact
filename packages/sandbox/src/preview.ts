import { RendererOptions } from '@microsoft/interactive-document-markdown';
import { RenderRequestMessage } from './types.js';

export interface PreviewerOptions {
    onReady?: () => void;
    onError?: (error: Error) => void;
    rendererOptions?: RendererOptions;
    markdown?: string;
}

// Previewer class
export class Previewer {
    public element: HTMLElement;

    constructor(elementOrSelector: string | HTMLElement, public options: PreviewerOptions) {
        if (typeof elementOrSelector === 'string') {
            this.element = document.querySelector(elementOrSelector);
            if (!this.element) {
                throw new Error(`Element not found: ${elementOrSelector}`);
            }
        } else if (elementOrSelector instanceof HTMLElement) {
            this.element = elementOrSelector;
        } else {
            throw new Error('Invalid element type, must be a string selector or HTMLElement');
        }
    }

    send(message: RenderRequestMessage): void {
        throw new Error('Method not implemented.');
    }
}
