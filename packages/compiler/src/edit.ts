import { Renderer, RendererOptions } from "@microsoft/interactive-document-markdown";
import { targetMarkdown } from "./md.js";
import { InteractiveDocumentWithSchema } from "dsl";

export function bindTextarea(textarea: HTMLTextAreaElement, outputElement: HTMLElement, options?: RendererOptions) {
    const renderer = new Renderer(outputElement, options);

    const render = () => {
        const json = textarea.value;
        try {
            const page = JSON.parse(json) as InteractiveDocumentWithSchema;
            if (typeof page !== 'object') {
                throw new Error('Invalid JSON format');
            } else {
                const md = targetMarkdown(page);
                renderer.render(md);
            }
        } catch (error) {
            console.error('Error parsing JSON:', error);
            return;
        }
    };

    textarea.addEventListener('input', render);
    // Initial render
    render();
    return renderer;
}
