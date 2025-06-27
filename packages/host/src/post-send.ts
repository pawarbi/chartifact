export interface StatusMessage {
    status: 'ready' | 'compiling' | 'rendering' | 'rendered' | 'error' | 'loading';
    details?: string;
    timestamp: number;
}

export function postStatus(target: Window, message: Omit<StatusMessage, 'timestamp'>): void {
    if (target) {
        const messageWithTimestamp = {
            ...message,
            timestamp: Date.now()
        };

        target.postMessage(messageWithTimestamp, '*');
    }
}
