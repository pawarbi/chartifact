
import { InteractiveDocument } from "schema";

export interface RenderRequestMessage {
    markdown?: string;
    interactiveDocument?: InteractiveDocument
}
