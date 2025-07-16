import React from 'react';
import { InteractiveDocument } from "schema";
import { targetMarkdown } from '@microsoft/interactive-document-compiler';
import { RendererOptions } from '@microsoft/interactive-document-markdown';
import { Previewer, Sandbox } from 'sandbox';

export interface SandboxDocumentPreviewProps {
    page: InteractiveDocument;
    options?: RendererOptions;
    previewer?: typeof Previewer;
}

export class SandboxDocumentPreview extends React.Component<SandboxDocumentPreviewProps> {
    containerRef: React.RefObject<HTMLDivElement>;
    sandboxRef: Previewer | null;
    isSandboxReady: boolean;
    pendingUpdate: InteractiveDocument;

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

                // Initialize sandbox instance
                this.sandboxRef = new (this.props.previewer || Sandbox)(
                    this.containerRef.current,
                    markdown,
                    {
                        onReady: () => {
                            this.isSandboxReady = true;

                            // Process pending update
                            if (this.pendingUpdate) {
                                this.processUpdate(this.pendingUpdate);
                                this.pendingUpdate = null; // Clear the pending update
                            }
                        },
                        onError: (error) => console.error('Sandbox initialization failed:', error),
                    }
                );
            } catch (error) {
                console.error('Failed to initialize sandbox:', error);
            }
        }
    }

    componentDidUpdate(prevProps: SandboxDocumentPreviewProps) {
        if (this.props.page !== prevProps.page) {
            if (this.isSandboxReady) {
                this.processUpdate(this.props.page);
            } else {
                // Store the latest update if sandbox is not ready
                this.pendingUpdate = this.props.page;
            }
        }
    }

    processUpdate(page: InteractiveDocument) {
        if (this.sandboxRef) {
            try {
                const markdown = targetMarkdown(page, this.props.options);
                this.sandboxRef.send(markdown);
            } catch (error) {
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
