import type { StatusMessage } from './types.js';

export function postStatus(target: Window, message: Omit<StatusMessage, 'timestamp'>): void {
    if (target) {
        const messageWithTimestamp = {
            ...message,
            timestamp: Date.now()
        };

        target.postMessage(messageWithTimestamp, '*');
    }
}
