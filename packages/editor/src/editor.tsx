import { InteractiveDocument } from "schema";
import { DocumentPreview } from './preview.js';

export interface Props {
}

export function Editor(props: Props) {
    const page: InteractiveDocument = {
        title: "Sample Page",
        layout: {
            css: "",
        },
        dataLoaders: [],
        groups: [
            {
                groupId: "main",
                elements: [
                    "# Sample Interactive Document",
                    "This is a test content to see if rendering works.",
                    "Here are some interactive elements:",
                    {
                        type: "chart",
                        chart: {
                            dataSourceBase: {
                                dataSourceName: "testData"
                            },
                            chartTemplateKey: "bar",
                            chartIntent: "A simple test chart",
                            spec: {
                                "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
                                "data": {
                                    "values": [
                                        {"category": "A", "value": 28},
                                        {"category": "B", "value": 55},
                                        {"category": "C", "value": 43}
                                    ]
                                },
                                "mark": "bar",
                                "encoding": {
                                    "x": {"field": "category", "type": "nominal"},
                                    "y": {"field": "value", "type": "quantitative"}
                                }
                            }
                        }
                    }
                ]
            }
        ],
        variables: [],
    };
    
    console.log('Editor rendering with page:', page);
    
    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            <div style={{ width: '300px', padding: '10px', borderRight: '1px solid #ccc' }}>
                <h3>Tree View</h3>
                <div>
                    <div>📄 {page.title}</div>
                    <div style={{ marginLeft: '20px' }}>
                        {page.groups.map((group, i) => (
                            <div key={i}>
                                📁 {group.groupId}
                                <div style={{ marginLeft: '20px' }}>
                                    {group.elements.map((element, j) => (
                                        <div key={j}>
                                            {typeof element === 'string' 
                                                ? `📝 ${element.slice(0, 30)}${element.length > 30 ? '...' : ''}`
                                                : `🎨 ${element.type}`
                                            }
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div style={{ flex: 1, padding: '10px' }}>
                <h3>Document Preview</h3>
                <DocumentPreview page={page} />
            </div>
        </div>
    );
}
