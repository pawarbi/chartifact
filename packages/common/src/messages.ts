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
    type: 'hostStatus';
    hostStatus: 'ready' | 'compiling' | 'rendering' | 'rendered' | 'error' | 'loading';
    details?: string;
}

export interface EditorReadyMessage {
    type: 'editorReady';
    sender: string;
}

export interface EditorPageMessage {
    type: 'editorPage';
    sender: string;
    page: InteractiveDocument;
}

export interface EditorGetOfflineDependenciesMessage {
    type: 'editorGetOfflineDependencies';
    sender: string;
}

export interface EditorSetOfflineDependenciesMessage {
    type: 'editorSetOfflineDependencies';
    sender: string;
    offlineDeps: string;
}
