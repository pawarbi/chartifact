import { Renderer, RendererOptions } from "@microsoft/interactive-document-markdown";
import { targetMarkdown } from "./md.js";
import { InteractiveDocumentWithSchema } from "schema";

export function bindTextarea(textarea: HTMLTextAreaElement, outputElement: HTMLElement, options?: RendererOptions) {
    const renderer = new Renderer(outputElement, options);

    const showError = (error: unknown) => {
        console.error('Error parsing JSON:', error);
        outputElement.innerHTML = `<div style="color: red; padding: 10px; border: 1px solid red; background-color: #ffe6e6; border-radius: 4px;">
            <strong>Error:</strong> ${error instanceof Error ? error.message : String(error)}
        </div>`;
    };

    const render = () => {
        const json = textarea.value;
        try {
            const page = JSON.parse(json) as InteractiveDocumentWithSchema;
            if (typeof page !== 'object') {
                showError(new Error('Invalid JSON format'));
                return;
            }
            const md = targetMarkdown(page, renderer.options);
            renderer.render(md);
        } catch (error) {
            showError(error);
        }
    };

    textarea.addEventListener('input', render);

    render(); // Initial render
    return renderer;
}
