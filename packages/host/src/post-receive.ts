import { Listener } from './listener.js';
import type { HostRenderRequestMessage, SandboxApprovalMessage, SandboxedPreHydrateMessage } from 'common';

export function setupPostMessageHandling(host: Listener) {
    window.addEventListener('message', (event) => {
        try {
            // Validate the message structure
            if (!event.data || typeof event.data !== 'object') {
                host.errorHandler(
                    new Error('Invalid message format'),
                    'Received message is not an object or is undefined.'
                );
                return;
            }

            const message = event.data as HostRenderRequestMessage | SandboxedPreHydrateMessage;
            if (message.type == 'hostRenderRequest') {
                if (message.markdown) {
                    host.render(message.markdown, undefined);
                } else if (message.interactiveDocument) {
                    host.render(undefined, message.interactiveDocument);
                } else {
                    //do nothing, as messages may be directed to the page for other purposes
                }
            } else if (message.type == 'sandboxedPreHydrate') {
                //make sure its from the sandbox iframe
                if (event.source === host.sandbox.iframe.contentWindow) {
                    // TODO check whitelist and do a mutation if needed
                    console.log('TODO: handle sandboxed pre-render message:', message);

                    //approve the sandboxed pre-render
                    const sandboxedApprovalMessage: SandboxApprovalMessage = {
                        type: 'sandboxApproval',
                        transactionId: message.transactionId,
                        approved: true,
                        //todo: mutations
                    };
                    host.sandbox.approve(sandboxedApprovalMessage);
                }
            }
        } catch (error) {
            host.errorHandler(
                error,
                'Error processing postMessage event'
            );
        }
    });
}
