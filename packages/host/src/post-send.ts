import type { HostStatusMessage } from 'common';

export function postStatus(target: Window, message: Omit<HostStatusMessage, 'timestamp'>): void {
    if (target) {
        const messageWithTimestamp = {
            ...message,
            timestamp: Date.now()
        };

        target.postMessage(messageWithTimestamp, '*');
    }
}
