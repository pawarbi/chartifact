import { extendedElements, InteractiveDocument } from "schema";
import { Component, MutableRefObject } from "react";
import { Renderers } from "vega-typings";
import { targetMarkdown } from '@microsoft/interactive-document-compiler';

export interface RendererOptions {
    vegaRenderer?: Renderers;
    dataSignalPrefix?: string;
    classList?: string[];
}

export interface CustomWindow extends Window {
    addStyle?: (css: string) => void;
    getUIState?: () => { [key: string]: unknown };
    getDataRowCounts?: () => { [key: string]: number };
    getPriorityPeerValue?: (signalName) => any;
    getDataSignals?: () => string[];
    create: (options: RendererOptions) => void;
    render: (markdown?: string) => void;
    mdVegaError: (error: Error, plugin: string, index: number, phase: string, container: Element, details?: string) => void;
    anyError: (error: Error) => void;
}

export type UIStateRef = MutableRefObject<CustomWindow | null>;

export interface Props {
    page: InteractiveDocument<extendedElements>;
    stateRef: UIStateRef;
}

export class Iframe extends Component<Props> {
    private iframe: HTMLIFrameElement | null = null;

    componentDidMount() {
        this.iframe = document.createElement('iframe');
        this.iframe.title = this.props.page?.title;
        this.iframe.style.height = '100%';
        this.iframe.style.width = '100%';
        this.iframe.style.border = 'none';
        this.iframe.style.minHeight = '64vh';
        this.iframe.src = 'data:text/plain;charset=utf-8,' + encodeURIComponent(`iframe`);

        this.iframe.onload = () => {
            const customWindow = this.iframe?.contentWindow as CustomWindow;
            if (!customWindow) return;

            customWindow.mdVegaError = (error: Error, plugin: string, index: number, phase: string, container: Element, details?: string) => {
                console.error(`(iframe.tsx) Error in ${plugin} at index ${index} during ${phase}:`, error, container, details);
            };

            customWindow.anyError = (error: Error) => {
                console.log('Error:', error);
            };

            // Store getUIState in the parent's ref
            if (customWindow.getUIState) {
                this.props.stateRef.current = customWindow;
            }
        };

        const container = document.getElementById('iframe-container');
        if (container && this.iframe) {
            container.appendChild(this.iframe);
        }
    }

    componentDidUpdate(prevProps: Props) {
        if (this.props.page !== prevProps.page) {
            this.updateText();
        }
    }

    componentWillUnmount() {
        const container = document.getElementById('iframe-container');
        if (container && this.iframe) {
            container.removeChild(this.iframe);
            this.iframe = null;
        }
    }

    updateText() {
        const customWindow = this.iframe?.contentWindow as CustomWindow;
        if (!customWindow?.render) return;

        if (!this.props.page) return;

        const markdown = targetMarkdown(this.props.page) as string
        customWindow.addStyle(this.props.page.layout?.css);
        customWindow.render(markdown);
    }

    render() {
        return <div id="iframe-container" style={{ lineHeight: '0', border: '1px solid black', height: '100%' }} />;
    }
}
