declare const renderRequest: IDocs.common.SandboxRenderMessage;

document.addEventListener('DOMContentLoaded', () => {
    let transactionIndex = 0;

    const transactions: Record<number, Document> = {};

    const renderer = new IDocs.markdown.Renderer(document.body, {
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
            const html = renderer.renderHtml(request.markdown);

            //look at dom elements prior to hydration
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            //todo: get stuff here for whitelist
            const transactionId = transactionIndex++;
            transactions[transactionId] = doc;

            //send message to parent to ask for whitelist
            const sandboxedPreRenderMessage: IDocs.common.SandboxedPreHydrateMessage = {
                type: 'sandboxedPreHydrate',
                transactionId,
                //todo put stuff here for whitelist
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
                if (message.approved) {

                    console.log('Sandbox approval received:', message.transactionId, transactionIndex);

                    //only handle if the transactionId is the latest
                    if (message.transactionId === transactionIndex - 1) {

                        //todo: mutate the document according to approval

                        //hydrate the renderer
                        const doc = transactions[message.transactionId];
                        if (doc) {
                            renderer.element.innerHTML = doc.body.innerHTML;
                            renderer.hydrate();
                        }
                    } else {
                        console.warn('Received sandbox approval for an outdated transaction:', message.transactionId, transactionIndex);
                    }
                }
                break;
            }
        }
    });

});