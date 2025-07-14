import React from 'react';
import { InteractiveDocument } from "schema";
import { targetMarkdown } from '@microsoft/interactive-document-compiler';
import { RendererOptions } from '@microsoft/interactive-document-markdown';
import { Sandbox } from 'sandbox';

export interface SandboxDocumentPreviewProps {
    page: InteractiveDocument;
    options?: RendererOptions;
}

export class SandboxDocumentPreview extends React.Component<SandboxDocumentPreviewProps> {
    containerRef: React.RefObject<HTMLDivElement>;
    sandboxRef: Sandbox | null;
    isSandboxReady: boolean;
    pendingUpdate: { page: InteractiveDocument; options?: RendererOptions } | null;

    constructor(props: SandboxDocumentPreviewProps) {
        super(props);
        this.containerRef = React.createRef();
        this.sandboxRef = null;
        this.isSandboxReady = false;
        this.pendingUpdate = null;
    }

    componentDidMount() {
        if (this.containerRef.current && !this.sandboxRef) {
            try {
                const markdown = targetMarkdown(this.props.page, this.props.options);

                console.log(`[init] Markdown ${markdown.includes('editor') ? 'contains' : 'does not contain'} "editor"`);

                // Initialize sandbox instance
                this.sandboxRef = new Sandbox(this.containerRef.current, {
                    onReady: () => {
                        console.log('Sandbox ready');
                        this.isSandboxReady = true;

                        // Process pending update
                        if (this.pendingUpdate) {
                            this.processUpdate(this.pendingUpdate.page, this.pendingUpdate.options);
                            this.pendingUpdate = null; // Clear the pending update
                        }
                    },
                    onError: (error) => console.error('Sandbox initialization failed:', error),
                    markdown,
                });
            } catch (error) {
                console.error('Failed to initialize sandbox:', error);
            }
        }
    }

    componentDidUpdate(prevProps: SandboxDocumentPreviewProps) {
        if (this.props.page !== prevProps.page || this.props.options !== prevProps.options) {
            if (this.isSandboxReady) {
                this.processUpdate(this.props.page, this.props.options);
            } else {
                // Store the latest update if sandbox is not ready
                this.pendingUpdate = { page: this.props.page, options: this.props.options };
            }
        }
    }

    processUpdate(page: InteractiveDocument, options?: RendererOptions) {
        if (this.sandboxRef) {
            try {
                const markdown = targetMarkdown(page, options);

                console.log(`[send] Markdown ${markdown.includes('editor') ? 'contains' : 'does not contain'} "editor"`);

                console.log('Rendering sandbox');
                this.sandboxRef.send({ markdown });
            } catch (error) {
                console.error('Error rendering document:', error);
                if (this.containerRef.current) {
                    this.containerRef.current.innerHTML = `<div style="color: red; padding: 10px; border: 1px solid red; background-color: #ffe6e6; border-radius: 4px;">
                        <strong>Error:</strong> ${error instanceof Error ? error.message : String(error)}
                    </div>`;
                }
            }
        }
    }

    componentWillUnmount() {
        if (this.sandboxRef) {
            this.sandboxRef = null;
        }
    }

    render() {
        return <div
            style={{ display: "grid" }}
            ref={this.containerRef}
        />;
    }
}
