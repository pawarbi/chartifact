import { InteractiveDocument } from "schema";
import { DocumentPreview } from './preview.js';
import { EditorMessage, PageMessage, ReadyMessage } from "./types.js";

export interface Props {
    postMessageTarget?: Window;
}

export function Editor(props: Props) {
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
                    const totalElements = event.data.page.groups.reduce((total, group) => total + group.elements.length, 0);
                    console.log('Editor received page from app:', {
                        title: event.data.page.title,
                        totalElements,
                        groups: event.data.page.groups.length
                    });
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

    return <EditorView page={page} postMessageTarget={postMessageTarget} />;
}

export interface EditorViewProps {
    page: InteractiveDocument;
    postMessageTarget: Window;
}

export function EditorView(props: EditorViewProps) {
    const { page, postMessageTarget } = props;

    const sendEditToApp = (newPage: InteractiveDocument) => {
        const pageMessage: PageMessage = {
            type: 'page',
            page: newPage,
            sender: 'editor'
        };
        postMessageTarget.postMessage(pageMessage, '*');
    };

    const deleteElement = (groupIndex: number, elementIndex: number) => {
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

        const totalElements = newPage.groups.reduce((total, group) => total + group.elements.length, 0);
        console.log('Editor sending delete result:', {
            title: newPage.title,
            totalElements,
            groups: newPage.groups.length,
            deletedFrom: { groupIndex, elementIndex }
        });

        sendEditToApp(newPage);
    };

    const deleteGroup = (groupIndex: number) => {
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
                padding: '10px',
                overflowY: 'auto'
            }}>
                <h3>Document Preview</h3>
                <DocumentPreview page={page} />
            </div>
        </div>
    );
}
