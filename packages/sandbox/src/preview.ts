/*!
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { SpecReview, SandboxedPreHydrateMessage } from "common";

export interface PreviewerOptions {
    onReady?: () => void;
    onError?: (error: Error) => void;
    onApprove: (message: SandboxedPreHydrateMessage) => SpecReview<{}>[];
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
}
