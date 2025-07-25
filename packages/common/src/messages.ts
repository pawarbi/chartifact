import { InteractiveDocument } from "schema";

export interface MarkdownRenderRequestMessage {
    markdown?: string;
}

export interface HostRenderRequestMessage extends MarkdownRenderRequestMessage {
    interactiveDocument?: InteractiveDocument
}

export interface HostStatusMessage {
    hostStatus: 'ready' | 'compiling' | 'rendering' | 'rendered' | 'error' | 'loading';
    details?: string;
    timestamp: number;
}
