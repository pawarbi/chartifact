declare const renderRequest: IDocs.common.RenderRequestMessage;

document.addEventListener('DOMContentLoaded', () => {
    const renderer = new IDocs.markdown.Renderer(document.body, {
        errorHandler: (error: Error, pluginName: string, instanceIndex: number, phase: string, container: Element, detail?: string) => {
            console.error(`Error in plugin ${pluginName} at instance ${instanceIndex} during ${phase}:`, error);
            if (detail) {
                console.error('Detail:', detail);
            }
            container.innerHTML = `<div style="color: red;">Error: ${error.message}</div>`;
        }
    });

    function render(request: IDocs.common.RenderRequestMessage) {
        if (request.markdown) {
            renderer.reset();
            const html = renderer.renderHtml(request.markdown);
            //todo: look at dom elements prior to hydration
            renderer.element.innerHTML = html;
            //todo: send message to parent to ask for whitelist
            //todo: asynchronously hydrate the renderer
            renderer.hydrate();
        }
    }

    render(renderRequest);

    //add listener for postMessage
    window.addEventListener('message', (event) => {
        if (!event.data) return;
        render(event.data);
    });

});