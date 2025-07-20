declare const renderRequest: IDocs.sandbox.SandboxedRenderRequestMessage;

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

    function render(request) {
        if (request.markdown) {
            renderer.render(request.markdown);
        } else if (request.html) {
            renderer.reset();
            document.body.innerHTML = request.html;
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