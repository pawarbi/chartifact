import { InteractiveDocument } from 'dsl';
import { ContentHandler, ErrorHandler } from './index.js';

interface RequestMessage {
    markdown?: string;
    interactiveDocument?: InteractiveDocument;
}

export function setupPostMessageHandling(contentHandler: ContentHandler, errorHandler: ErrorHandler) {
    window.addEventListener('message', (event) => {
        try {
            // Validate the message structure
            if (!event.data || typeof event.data !== 'object') {
                errorHandler(
                    new Error('Invalid message format'),
                    'Received message is not an object or is undefined.'
                );
                return;
            }

            const data: RequestMessage = event.data;

            if (data.markdown) {
                contentHandler(data.markdown, undefined);
            } else if (data.interactiveDocument) {
                contentHandler(undefined, data.interactiveDocument);
            } else {
                //do nothing, as messages may be directed to the page for other purposes
            }
        } catch (error) {
            errorHandler(
                error,
                'Error processing postMessage event'
            );
        }
    });
}
