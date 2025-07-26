import { InteractiveDocument } from "schema";

export interface SandboxRenderMessage {
    type: 'sandboxRender';
    markdown?: string;
}

export interface SandboxedPreHydrateMessage {
    type: 'sandboxedPreHydrate';
    transactionId: number;
    //todo put stuff here for whitelist
}

export type SandboxApprovalMessage = {
    type: 'sandboxApproval';
    transactionId: number;
    approved: boolean;
    //todo: add more fields as needed
};

export interface HostRenderRequestMessage {
    type: 'hostRenderRequest';
    markdown?: string;
    interactiveDocument?: InteractiveDocument
}

export interface HostStatusMessage {
    hostStatus: 'ready' | 'compiling' | 'rendering' | 'rendered' | 'error' | 'loading';
    details?: string;
    timestamp: number;
}
