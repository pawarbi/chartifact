/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { Listener } from "./listener.js";

export function determineContent(content: string, host: Listener) {
    if (!content) {
        host.errorHandler(
            new Error('Content is empty'),
            'The content was empty. Please use valid markdown content or JSON.'
        );
        return;
    }

    if (typeof content !== 'string') {
        host.errorHandler(
            new Error('Invalid content type'),
            'The content is not a string. Please use valid markdown content or JSON.'
        );
        return;
    }

    content = content.trim();

    if (!content) {
        host.errorHandler(
            new Error('Content is empty'),
            'The content was only whitespace. Please use valid markdown content or JSON.'
        );
        return;
    }

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
