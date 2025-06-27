import { Host } from "./index.js";

export function determineContent(content: string, host: Host) {
    // Check if the content is valid markdown or JSON
    if (content.startsWith('{') && content.endsWith('}')) {
        // Try to parse as JSON
        try {
            const idoc = JSON.parse(content);
            host.render(undefined, idoc);
        } catch (jsonError) {
            host.errorHandler(
                new Error('Invalid JSON content in clipboard'),
                'The pasted content is not valid JSON. Please copy a valid interactive document JSON file.'
            );
            return;
        }
    } else {
        host.render(content);
    }

}
