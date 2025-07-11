import { InteractiveDocument } from "schema";

export interface BaseMessage {
    sender: 'app' | 'editor';
}

export interface PageMessage extends BaseMessage {
    type: 'page';
    page: InteractiveDocument;
}

export interface ReadyMessage extends BaseMessage {
    type: 'ready';
}

export type EditorMessage = PageMessage | ReadyMessage;
