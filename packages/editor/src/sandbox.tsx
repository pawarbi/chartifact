/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import React from 'react';
import { InteractiveDocument } from '@microsoft/chartifact-schema';
import { targetMarkdown } from '@microsoft/chartifact-compiler';
import { Sandbox } from '@microsoft/chartifact-sandbox';
import { SpecReview, SandboxedPreHydrateMessage } from 'common';

export interface SandboxDocumentPreviewProps {
    page: InteractiveDocument;
    sandbox?: typeof Sandbox;
    onApprove: (message: SandboxedPreHydrateMessage) => SpecReview<{}>[];
}

export class SandboxDocumentPreview extends React.Component<SandboxDocumentPreviewProps> {
    containerRef: React.RefObject<HTMLDivElement>;
    sandboxRef: Sandbox | null;
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
                const markdown = targetMarkdown(this.props.page);

                // Initialize sandbox instance
                this.sandboxRef = new (this.props.sandbox || Sandbox)(
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
                        onApprove: this.props.onApprove,
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
                const markdown = targetMarkdown(page);
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
