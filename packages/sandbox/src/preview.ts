import { SandboxApprovalMessage, SandboxedPreHydrateMessage } from "common/dist/esnext/messages.js";

export interface PreviewerOptions {
    onReady?: () => void;
    onError?: (error: Error) => void;
    onApprove?: (message: SandboxedPreHydrateMessage) => SandboxApprovalMessage;
}

// Previewer class
export class Previewer {
    public element: HTMLElement;

    constructor(elementOrSelector: string | HTMLElement, markdown: string, public options: PreviewerOptions) {
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

    send(markdown: string): void {
        throw new Error('Method not implemented.');
    }

    approve(message: SandboxApprovalMessage) {
        throw new Error('Method not implemented.');
    }
}
