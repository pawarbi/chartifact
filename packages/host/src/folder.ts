/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { Folder } from "@microsoft/chartifact-schema-folder";
import { Listener } from "./listener.js";
import { loadDocViaUrl } from "./url.js";

export function loadFolder(folderUrl: string, folder: Folder, host: Listener) {
    if (!folder || !folder.docs) {
        host.errorHandler(
            'Invalid folder format',
            'Please provide a valid folder JSON.'
        );
        return;
    }

    if (folder.docs.length === 0) {
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

    host.toolbar.innerHTML = folder.title + `(${folder.docs.length} documents)`;
    host.toolbar.style.display = 'block';

    // Create Previous and Next buttons
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Previous';
    prevBtn.disabled = docIndex === 0;

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = docIndex === folder.docs.length - 1;

    // Create dropdown for page selection
    const pageSelect = document.createElement('select');
    for (let i = 0; i < folder.docs.length; i++) {
        const option = document.createElement('option');
        option.value = (i + 1).toString();
        option.textContent = folder.docs[i].title ? folder.docs[i].title : `Page ${i + 1}`;
        pageSelect.appendChild(option);
    }
    pageSelect.value = (docIndex + 1).toString();

    pageSelect.onchange = () => {
        const selectedPage = parseInt(pageSelect.value, 10);
        if (selectedPage >= 1 && selectedPage <= folder.docs.length) {
            docIndex = selectedPage - 1;
            window.location.hash = `page=${docIndex + 1}`;
            prevBtn.disabled = docIndex === 0;
            nextBtn.disabled = docIndex === folder.docs.length - 1;
            resolveUrl(folderUrl, folder.docs[docIndex].href, host);
        }
    };

    // Button click handlers
    prevBtn.onclick = () => {
        if (docIndex > 0) {
            docIndex--;
            window.location.hash = `page=${docIndex + 1}`;
            pageSelect.value = (docIndex + 1).toString();
            resolveUrl(folderUrl, folder.docs[docIndex].href, host);
            prevBtn.disabled = docIndex === 0;
            nextBtn.disabled = docIndex === folder.docs.length - 1;
        }
    };

    nextBtn.onclick = () => {
        if (docIndex < folder.docs.length - 1) {
            docIndex++;
            window.location.hash = `page=${docIndex + 1}`;
            pageSelect.value = (docIndex + 1).toString();
            resolveUrl(folderUrl, folder.docs[docIndex].href, host);
            prevBtn.disabled = docIndex === 0;
            nextBtn.disabled = docIndex === folder.docs.length - 1;
        }
    };

    // Set initial hash and handle hash navigation
    function goToPageFromHash() {
        const match = window.location.hash.match(/page=(\d+)/);
        if (match) {
            const page = parseInt(match[1], 10);
            if (page >= 1 && page <= folder.docs.length) {
                docIndex = page - 1;
            } else {
                docIndex = 0; // fallback to first page if out of range
            }
        }
        prevBtn.disabled = docIndex === 0;
        nextBtn.disabled = docIndex === folder.docs.length - 1;
        pageSelect.value = (docIndex + 1).toString();
        resolveUrl(folderUrl, folder.docs[docIndex].href, host);
    }

    window.addEventListener('hashchange', goToPageFromHash);

    // Only set hash if not already present
    if (!window.location.hash.match(/page=(\d+)/)) {
        window.location.hash = `page=${docIndex + 1}`;
    }
    goToPageFromHash();

    // Add buttons and dropdown to the toolbar
    host.toolbar.appendChild(prevBtn);
    host.toolbar.appendChild(pageSelect);
    host.toolbar.appendChild(nextBtn);

    //resolveUrl(folderUrl, folder.docUrls[docIndex], host);
}

async function resolveUrl(base: string, relativeOrAbsolute: string, host: Listener) {
    let url: string;
    try {
        url = base ? new URL(relativeOrAbsolute, base).href : relativeOrAbsolute;
    } catch (error) {
        host.errorHandler(
            'Invalid URL',
            `Invalid URL: ${relativeOrAbsolute} relative to ${base}`
        );
        return;
    }
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
}
