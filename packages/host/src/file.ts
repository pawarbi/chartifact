import { Listener } from "./listener.js";

export function readFile(file: File, host: Listener) {
    if (file.name.endsWith('.idoc.json') || file.name.endsWith('.idoc.md')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            let content = e.target?.result as string;
            if (!content) {
                host.errorHandler(
                    new Error('File content is empty'),
                    'The file is empty. Please use a valid markdown or JSON file.'
                );
                return;
            }
            content = content.trim();
            if (!content) {
                host.errorHandler(
                    new Error('File content is empty'),
                    'The file is empty or contains only whitespace. Please use a valid markdown or JSON file.'
                );
                return;
            }
            if (file.name.endsWith('.idoc.json')) {
                try {
                    const idoc = JSON.parse(content);
                    host.render(undefined, idoc);
                    return;
                } catch (jsonError) {
                    host.errorHandler(
                        new Error('Invalid JSON content'),
                        'The file content is not valid JSON.'
                    );
                    return;
                }
            } else if (file.name.endsWith('.idoc.md')) {
                host.render(content);
            }
        };
        reader.onerror = (e) => {
            host.errorHandler(new Error('Failed to read file'), 'Error reading file');
        };
        reader.readAsText(file);
    } else {
        host.errorHandler(
            new Error('Invalid file type'),
            'Only markdown (.idoc.md) or JSON (.idoc.json) files are supported.'
        );
    }
}