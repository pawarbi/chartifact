import { Renderer, RendererOptions } from "./renderer.js";

export function bindTextarea(textarea: HTMLTextAreaElement, outputElement: HTMLElement, options?: RendererOptions) {
    const renderer = new Renderer(outputElement, options);

    const render = () => {
        const content = textarea.value;
        renderer.render(content);
    };

    textarea.addEventListener('input', render);

    render(); // Initial render
    return renderer;
}
