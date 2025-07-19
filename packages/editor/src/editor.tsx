import { InteractiveDocument } from "schema";
import { EditorMessage, PageMessage, ReadyMessage } from "./types.js";
import { SandboxDocumentPreview } from "./sandbox.js";
import { Previewer } from "sandbox";

export interface EditorProps {
    postMessageTarget?: Window;
    previewer: typeof Previewer;
}

const devmode = false; // Set to true to use DevDocumentPreview, false for SandboxDocumentPreview

export function Editor(props: EditorProps) {
    const postMessageTarget = props.postMessageTarget || window.parent;
    const [page, setPage] = React.useState<InteractiveDocument>(() => ({
        title: "Initializing...",
        layout: {
            css: "",
        },
        dataLoaders: [],
        groups: [
            {
                groupId: "init",
                elements: [
                    "# 🔄 Editor Initializing",
                    "Please wait while the editor loads...",
                    "",
                    "The editor is ready and waiting for content from the host application.",
                    "",
                    "📡 **Status**: Ready to receive documents"
                ]
            }
        ],
        variables: [],
    }));

    React.useEffect(() => {
        const handleMessage = (event: MessageEvent<EditorMessage>) => {
            // Optionally add origin validation here for security
            // if (event.origin !== 'expected-origin') return;

            // Only process messages that are not from us (editor)
            if (event.data && event.data.sender !== 'editor') {
                if (event.data.type === 'page' && event.data.page) {
                    setPage(event.data.page);
                }
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    React.useEffect(() => {
        // Send ready message when the editor is mounted and ready
        const readyMessage: ReadyMessage = {
            type: 'ready',
            sender: 'editor'
        };
        postMessageTarget.postMessage(readyMessage, '*');
    }, []);

    return <EditorView page={page} postMessageTarget={postMessageTarget} previewer={props.previewer} />;
}

export interface EditorViewProps {
    page: InteractiveDocument;
    postMessageTarget: Window;
    previewer: typeof Previewer;
}

export function EditorView(props: EditorViewProps) {
    const { page, postMessageTarget, previewer } = props;

    const sendEditToApp = (newPage: InteractiveDocument) => {
        const pageMessage: PageMessage = {
            type: 'page',
            page: newPage,
            sender: 'editor'
        };
        postMessageTarget.postMessage(pageMessage, '*');
    };

    const deleteElement = (groupIndex: number, elementIndex) => {
        const newPage = {
            ...page,
            groups: page.groups.map((group, gIdx) => {
                if (gIdx === groupIndex) {
                    return {
                        ...group,
                        elements: group.elements.filter((_, eIdx) => eIdx !== elementIndex)
                    };
                }
                return group;
            })
        };

        sendEditToApp(newPage);
    };

    const deleteGroup = (groupIndex) => {
        const newPage = {
            ...page,
            groups: page.groups.filter((_, gIdx) => gIdx !== groupIndex)
        };

        sendEditToApp(newPage);
    };

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '320px 1fr',
            height: '100vh',
            overflow: 'hidden'
        }}>
            <div style={{
                padding: '10px',
                borderRight: '1px solid #ccc',
                overflowY: 'auto'
            }}>
                <h3>Tree View</h3>
                <div>
                    <div>📄 {page.title}</div>
                    <div style={{ marginLeft: '20px' }}>
                        {page.groups.map((group, groupIndex) => (
                            <div key={groupIndex} style={{ marginBottom: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    📁 {group.groupId}
                                    <button
                                        onClick={() => deleteGroup(groupIndex)}
                                        style={{
                                            background: '#ff4444',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '3px',
                                            padding: '2px 6px',
                                            fontSize: '10px',
                                            cursor: 'pointer'
                                        }}
                                        title="Delete group"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div style={{ marginLeft: '20px' }}>
                                    {group.elements.map((element, elementIndex) => (
                                        <div key={elementIndex} style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                                            <span>
                                                {typeof element === 'string'
                                                    ? `📝 ${element.slice(0, 30)}${element.length > 30 ? '...' : ''}`
                                                    : `🎨 ${element.type}`
                                                }
                                            </span>
                                            <button
                                                onClick={() => deleteElement(groupIndex, elementIndex)}
                                                style={{
                                                    background: '#ff4444',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '3px',
                                                    padding: '2px 6px',
                                                    fontSize: '10px',
                                                    cursor: 'pointer'
                                                }}
                                                title="Delete element"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div style={{
                display: 'grid',
                gridTemplateRows: 'auto 1fr',
                padding: '10px',
                overflowY: 'auto'
            }}>
                <h3>Document Preview</h3>
                <SandboxDocumentPreview
                    page={page}
                    previewer={previewer}
                />
            </div>
        </div>
    );
}
