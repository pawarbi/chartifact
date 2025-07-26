import { Renderer } from '@microsoft/interactive-document-markdown';
import { Previewer, PreviewerOptions } from '@microsoft/chartifact-sandbox';
import { SandboxApprovalMessage } from 'common';

let transactionIndex = 0;

export class DevPreviewer extends Previewer {
    public renderer: Renderer;
    public transactions: Record<number, Document> = {};

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

        const doc = new DOMParser().parseFromString(html, 'text/html');
        const transactionId = transactionIndex++;
        this.transactions[transactionId] = doc;

        //inline approval
        const sandboxedPreRenderMessage: SandboxApprovalMessage = {
            type: 'sandboxApproval',
            transactionId,
            approved: true,
            // Additional data for whitelist can be added here
        };

        //inline approval
        this.approve(sandboxedPreRenderMessage);

    }

    send(markdown: string) {
        try {
            this.render(markdown);
        } catch (error) {
            this.displayError(error);
            this.options.onError?.(error);
        }
    }

    approve(message: SandboxApprovalMessage): void {
        if (message.approved) {
            //only handle if the transactionId is the latest
            if (message.transactionId === transactionIndex - 1) {

                console.log('Sandbox approval received:', message.transactionId, transactionIndex);
                if (message.transactionId === transactionIndex - 1) {
                    const doc = this.transactions[message.transactionId];
                    if (doc) {
                        const newHtml = `<style>.tabulator { margin-right: -1px; }</style>
<link href="https://unpkg.com/tabulator-tables@6.3.0/dist/css/tabulator.min.css" rel="stylesheet" />
${doc.body.innerHTML}`;
                        this.renderer.element.innerHTML = newHtml;
                        this.renderer.hydrate();
                    }
                }
            } else {
                console.warn('Received sandbox approval for an outdated transaction:', message.transactionId, transactionIndex);
            }
        } else {
            console.warn('Sandbox approval denied:', message.transactionId);
        }
    }

    private displayError(error: unknown) {
        this.element.innerHTML = `<div style="color: red; padding: 10px; border: 1px solid red; background-color: #ffe6e6; border-radius: 4px;">
            <strong>Error:</strong> ${error instanceof Error ? error.message : String(error)}
        </div>`;
    }
}
