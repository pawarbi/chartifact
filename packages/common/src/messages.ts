import { InteractiveDocument } from "schema";

export interface SandboxRenderMessage {
    type: 'sandboxRender';
    markdown?: string;
}

export interface SpecReview<T> {
    pluginName: string;
    containerId: string;
    approvedSpec: T;
    blockedSpec?: T;
    reason?: string;
}

export interface SandboxedPreHydrateMessage {
    type: 'sandboxedPreHydrate';
    transactionId: number;
    specs: SpecReview<{}>[];
}

export type SandboxApprovalMessage = {
    type: 'sandboxApproval';
    transactionId: number;
    specs: SpecReview<{}>[];
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
