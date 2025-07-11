import { InteractiveDocument } from "schema";
import { targetMarkdown } from '@microsoft/interactive-document-compiler';
import { Renderer, RendererOptions } from '@microsoft/interactive-document-markdown';

export interface DocumentPreviewProps {
    page: InteractiveDocument;
    options?: RendererOptions;
}

export function DocumentPreview({ page, options }: DocumentPreviewProps) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const rendererRef = React.useRef<Renderer | null>(null);

    React.useEffect(() => {
        if (containerRef.current && !rendererRef.current) {
            try {
                // Create persistent renderer instance
                rendererRef.current = new Renderer(containerRef.current, options);
            } catch (error) {
                console.error('Failed to create renderer:', error);
            }
        }
    }, [options]);

    React.useEffect(() => {
        if (rendererRef.current && page) {
            try {
                const md = targetMarkdown(page, rendererRef.current.options);
                rendererRef.current.render(md);
            } catch (error) {
                console.error('Error rendering document:', error);
                if (containerRef.current) {
                    containerRef.current.innerHTML = `<div style="color: red; padding: 10px; border: 1px solid red; background-color: #ffe6e6; border-radius: 4px;">
                        <strong>Error:</strong> ${error instanceof Error ? error.message : String(error)}
                    </div>`;
                }
            }
        }
    }, [page]);

    return <div ref={containerRef} />;
}
