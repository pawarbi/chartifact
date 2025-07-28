declare const renderRequest: IDocs.common.SandboxRenderMessage;

let renderer: IDocs.markdown.Renderer;

document.addEventListener('DOMContentLoaded', () => {
    let transactionIndex = 0;

    const transactions: Record<number, IDocs.common.SpecReview<{}>[]> = {};

    renderer = new IDocs.markdown.Renderer(document.body, {
        errorHandler: (error: Error, pluginName: string, instanceIndex: number, phase: string, container: Element, detail?: string) => {
            console.error(`Error in plugin ${pluginName} at instance ${instanceIndex} during ${phase}:`, error);
            if (detail) {
                console.error('Detail:', detail);
            }
            container.innerHTML = `<div style="color: red;">Error: ${error.message}</div>`;
        }
    });

    function render(request: IDocs.common.SandboxRenderMessage) {
        if (request.markdown) {
            renderer.reset();

            //debugger;

            const html = renderer.renderHtml(request.markdown);
            renderer.element.innerHTML = html;
            const flags = renderer.hydrateSpecs();

            //todo: get stuff here for whitelist
            const transactionId = transactionIndex++;
            transactions[transactionId] = flags;

            //send message to parent to ask for whitelist
            const sandboxedPreRenderMessage: IDocs.common.SandboxedPreHydrateMessage = {
                type: 'sandboxedPreHydrate',
                transactionId,
                flags,
            };
            window.parent.postMessage(sandboxedPreRenderMessage, '*');
        }
    }

    render(renderRequest);

    //add listener for postMessage
    window.addEventListener('message', (event) => {
        if (!event.data) return;

        const message = event.data as IDocs.common.SandboxApprovalMessage | IDocs.common.SandboxRenderMessage;

        switch (message.type) {
            case 'sandboxRender': {
                render(message);
                break;
            }
            case 'sandboxApproval': {

                //debugger;

                //only handle if the transactionId is the latest
                if (message.transactionId === transactionIndex - 1) {

                    //todo: console.warn of unapproved

                    //hydrate the renderer
                    const flags = transactions[message.transactionId];
                    if (flags) {
                        renderer.hydrate(flags);
                    }
                } else {
                    console.warn('Received sandbox approval for an outdated transaction:', message.transactionId, transactionIndex);
                }
                break;
            }
        }
    });

});