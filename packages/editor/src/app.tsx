import { InteractiveDocument } from "schema";
import { Editor, EditorMessage, PageMessage, ReadyMessage } from './editor.js';

export interface AppProps {
}

// Alternative implementation using same-origin communication
export function App(props: AppProps) {
    const initialPage: InteractiveDocument = {
        title: "Sample Page",
        layout: { css: "" },
        dataLoaders: [],
        groups: [
            {
                groupId: "main",
                elements: [
                    "# Welcome to Interactive Documents",
                    "1 This is a sample page loaded via postMessage.",
                    "2 This is a sample page loaded via postMessage.",
                    "3 This is a sample page loaded via postMessage.",
                    "The App component controls what content is displayed."
                ]
            }
        ],
        variables: []
    };

    const [history, setHistory] = React.useState<InteractiveDocument[]>([initialPage]);
    const [historyIndex, setHistoryIndex] = React.useState(0);
    const [currentPage, setCurrentPage] = React.useState<InteractiveDocument>(initialPage);

    const editorContainerRef = React.useRef<HTMLDivElement>(null);
    const [isEditorReady, setIsEditorReady] = React.useState(false);

    const undo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            const page = history[newIndex];
            setCurrentPage(page);
            sendPageToEditor(page);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            const page = history[newIndex];
            setCurrentPage(page);
            sendPageToEditor(page);
        }
    };

    const sendPageToEditor = (page: InteractiveDocument, skipReadyCheck = false) => {
        // Only send page if editor is ready (unless we're skipping the check)
        if (!skipReadyCheck && !isEditorReady) {
            console.log('Editor not ready, page will be sent when ready');
            return;
        }

        // Post message to the editor within the same window
        const pageMessage: PageMessage = {
            type: 'page',
            page: page,
            sender: 'app'
        };
        window.postMessage(pageMessage, '*');
    };

    React.useEffect(() => {
        // Listen for messages from the editor
        const handleMessage = (event: MessageEvent<EditorMessage>) => {
            // Only process messages from editor, ignore our own messages
            if (event.data && event.data.sender === 'editor') {
                if (event.data.type === 'ready') {
                    const readyMessage = event.data as ReadyMessage;
                    console.log('Editor is ready');
                    setIsEditorReady(true);
                    // Send initial page when editor is ready
                    sendPageToEditor(currentPage);
                } else if (event.data.type === 'page' && event.data.page) {
                    const pageMessage = event.data as PageMessage;
                    const totalElements = pageMessage.page.groups.reduce((total, group) => total + group.elements.length, 0);
                    console.log('Received edit from editor:', pageMessage.page.title, 'Total elements:', totalElements, 'Groups:', pageMessage.page.groups.length);
                    
                    // Use functional updates to avoid closure issues
                    setHistoryIndex(prevIndex => {
                        setHistory(prevHistory => {
                            console.log('Current history length:', prevHistory.length, 'current index:', prevIndex);
                            // Truncate history after current index and add new page
                            const newHistory = prevHistory.slice(0, prevIndex + 1);
                            newHistory.push(pageMessage.page);
                            console.log('New history length will be:', newHistory.length);
                            return newHistory;
                        });
                        
                        setCurrentPage(pageMessage.page);
                        // Send the updated page back to the editor (skip ready check since editor just sent us a message)
                        sendPageToEditor(pageMessage.page, true);
                        return prevIndex + 1; // New index will be the last item
                    });
                }
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []); // Remove the dependencies that were causing stale closures

    React.useEffect(() => {
        // This effect runs when isEditorReady changes
        // If editor becomes ready, send current page
        if (isEditorReady) {
            sendPageToEditor(currentPage);
        }
    }, [isEditorReady]);

    React.useEffect(() => {
        // Remove the old effect that sent initial page immediately
        // Now we wait for the ready message
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            {/* Control Panel */}
            <div style={{
                padding: '10px',
                backgroundColor: '#f5f5f5',
                borderBottom: '1px solid #ccc',
                display: 'flex',
                gap: '10px',
                alignItems: 'center'
            }}>
                <h2 style={{ margin: 0 }}>Document Editor</h2>
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <button
                        onClick={undo}
                        disabled={historyIndex <= 0}
                        style={{
                            padding: '5px 10px',
                            backgroundColor: historyIndex <= 0 ? '#ccc' : '#007acc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer'
                        }}
                    >
                        ↶ Undo
                    </button>
                    <button
                        onClick={redo}
                        disabled={historyIndex >= history.length - 1}
                        style={{
                            padding: '5px 10px',
                            backgroundColor: historyIndex >= history.length - 1 ? '#ccc' : '#007acc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer'
                        }}
                    >
                        ↷ Redo
                    </button>
                    <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>
                        History: {historyIndex + 1} / {history.length}
                    </span>
                </div>
            </div>

            {/* Editor */}
            <div ref={editorContainerRef} style={{ flex: 1 }}>
                <Editor />
            </div>
        </div>
    );
}

