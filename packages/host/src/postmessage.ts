interface RequestMessage {
    markdown?: string;
}

interface StatusMessage {
    status: 'ready' | 'rendering' | 'rendered' | 'error' | 'loading';
    details?: string;
    timestamp: number;
}

/**
 * Sets up postMessage event handling for markdown content
 * @param onMarkdownReceived - Callback function to handle received markdown content
 * @param onError - Callback function to handle errors
 */
export function setupPostMessageHandling(
    onMarkdownReceived: (content: string) => void,
    onError?: (error: Error, details: string) => void
): void {
    // Listen for postMessage events
    window.addEventListener('message', (event) => {
        try {
            // Validate the message structure
            if (!event.data || typeof event.data !== 'object') {
                return;
            }

            const data: RequestMessage = event.data;

            // Handle markdown content
            if (data.markdown && typeof data.markdown === 'string') {
                onMarkdownReceived(data.markdown);
            }
            // Ignore messages without markdown or error properties
        } catch (error) {
            onError?.(
                error,
                'Error processing postMessage event'
            );
        }
    });
}

/**
 * Sends a message to the parent window
 * @param message - The message to send (without timestamp)
 */
export function postStatus(message: Omit<StatusMessage, 'timestamp'>): void {
    if (window.parent && window.parent !== window) {
        const messageWithTimestamp = {
            ...message,
            timestamp: Date.now()
        };

        window.parent.postMessage(messageWithTimestamp, '*');
    }
}
