import { SandboxApprovalMessage } from 'common';
import { Sandbox } from '../src/index.ts';
const textarea = document.getElementById('md') as HTMLTextAreaElement;
const sandbox = new Sandbox(document.body, textarea.value, {
    onReady: () => {
        console.log('Sandbox is ready');
    },
    onError: (error) => {
        console.error('Sandbox error:', error);
    },
    onApprove: (message) => {
        console.log('Sandbox approval message:', message);
        const approval: SandboxApprovalMessage = {
            type: 'sandboxApproval',
            transactionId: message.transactionId,
            remediated: message.flags,
        };
        return approval;
    }
});

//allow sandbox to be accessed globally for debugging
window['sandbox'] = sandbox;

textarea.addEventListener('input', () => {
    sandbox.send(textarea.value);
});
