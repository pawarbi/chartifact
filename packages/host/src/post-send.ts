import type { HostStatusMessage } from 'common';

export function postStatus(target: Window, message: HostStatusMessage): void {
    if (target) {
        target.postMessage(message, '*');
    }
}
