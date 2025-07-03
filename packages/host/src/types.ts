// Pure type definitions without DOM dependencies
// This module can be safely imported by VS Code extensions

import { InteractiveDocument } from "dsl";

export interface ListenOptions {
  clipboard?: boolean;
  dragDrop?: boolean;
  fileUpload?: boolean;
  postMessage?: boolean;
  postMessageTarget?: any; // Using any to avoid Window DOM dependency in VS Code extensions
  url?: boolean;
  urlParamName?: string;
}

export interface RenderRequestMessage {
    markdown?: string;
    interactiveDocument?: InteractiveDocument
}

export interface StatusMessage {
    status: 'ready' | 'compiling' | 'rendering' | 'rendered' | 'error' | 'loading';
    details?: string;
    timestamp: number;
}
