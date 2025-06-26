import { extendedElements, InteractiveExplanatoryPage } from 'dsl';
import { targetMarkdown } from './md.js';

export default function compileToMarkdown(page: InteractiveExplanatoryPage<extendedElements>) {
    // Ensure the page is of the correct type
    if (!page || typeof page !== 'object' || !page.groups || !Array.isArray(page.groups)) {
        throw new Error('Invalid page structure');
    }

    // Generate the markdown content
    const markdownContent = targetMarkdown(page);

    // Return the markdown content
    return markdownContent;
}
