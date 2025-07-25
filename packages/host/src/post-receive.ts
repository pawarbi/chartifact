import { Listener } from './listener.js';
import type { HostRenderRequestMessage } from 'common';

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

            const data: HostRenderRequestMessage = event.data;

            if (data.markdown) {
                host.render(data.markdown, undefined);
            } else if (data.interactiveDocument) {
                host.render(undefined, data.interactiveDocument);
            } else {
                //do nothing, as messages may be directed to the page for other purposes
            }
        } catch (error) {
            host.errorHandler(
                error,
                'Error processing postMessage event'
            );
        }
    });
}
