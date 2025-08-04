/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { Folder } from "@microsoft/chartifact-schema-folder";
import { Listener } from "./listener.js";
import { loadDocViaUrl } from "./url.js";

export function loadFolder(folderUrl: string, folder: Folder, host: Listener) {
    if (!folder || !folder.docUrls) {
        host.errorHandler(
            'Invalid folder format',
            'Please provide a valid folder JSON.'
        );
        return;
    }

    if (folder.docUrls.length === 0) {
        host.errorHandler(
            'Empty folder',
            'The folder does not contain any documents.'
        );
        return;
    }

    if (!host.toolbar) {
        host.errorHandler(
            'Toolbar not found',
            'The toolbar element is required to load folder content.'
        );
        return;
    }

    let docIndex = 0;

    host.toolbar.innerHTML = folder.title + `(${folder.docUrls.length} documents)`;
    host.toolbar.style.display = 'block';

    // Create Previous and Next buttons
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Previous';
    prevBtn.disabled = docIndex === 0;

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = docIndex === folder.docUrls.length - 1;

    // Button click handlers
    prevBtn.onclick = () => {
        if (docIndex > 0) {
            docIndex--;
            resolveUrl(folderUrl, folder.docUrls[docIndex], host);
            prevBtn.disabled = docIndex === 0;
            nextBtn.disabled = docIndex === folder.docUrls.length - 1;
        }
    };

    nextBtn.onclick = () => {
        if (docIndex < folder.docUrls.length - 1) {
            docIndex++;
            resolveUrl(folderUrl, folder.docUrls[docIndex], host);
            prevBtn.disabled = docIndex === 0;
            nextBtn.disabled = docIndex === folder.docUrls.length - 1;
        }
    };

    // Add buttons to the toolbar
    host.toolbar.appendChild(prevBtn);
    host.toolbar.appendChild(nextBtn);

    resolveUrl(folderUrl, folder.docUrls[docIndex], host);
}

async function resolveUrl(base: string, relativeOrAbsolute: string, host: Listener) {
    const url = base ? new URL(relativeOrAbsolute, base).href : relativeOrAbsolute;
    try {
        const result = await loadDocViaUrl(url, host, false);
        if (result.error) {
            host.errorHandler(
                result.error,
                result.errorDetail
            );
            return;
        }
        if (result.idoc) {
            host.render(undefined, result.idoc);
        } else if (result.markdown) {
            host.render(result.markdown, undefined);
        } else if (result.folder) {
            host.render('Nested folders are not supported', undefined);
        } else {
            host.errorHandler(
                'Invalid document format',
                'The document could not be loaded from the folder.'
            );
        }
    } catch (error) {
        host.errorHandler(
            'Invalid URL',
            `Invalid URL: ${relativeOrAbsolute} relative to ${base}`
        );
    }
}
