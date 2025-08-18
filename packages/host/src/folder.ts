/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { Folder } from "@microsoft/chartifact-schema-folder";
import { Listener } from "./listener.js";
import { loadViaUrl } from "./url.js";

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

    const folderSpan = host.toolbar.toolbarElement.querySelector('#folderSpan') as HTMLSpanElement;
    folderSpan.style.display = '';

    folderSpan.innerText = `Folder: ${folder.title} (${folder.docs.length} documents)`;

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

    function getHashParam(key: string): string | undefined {
        const params = new URLSearchParams(window.location.hash.slice(1));
        return params.get(key) ?? undefined;
    }

    function setHashParam(key: string, value: string | number) {
        const params = new URLSearchParams(window.location.hash.slice(1));
        params.set(key, value.toString());
        window.location.hash = params.toString();
    }

    function updatePage(newDocIndex: number, setHash: boolean = false) {
        docIndex = newDocIndex;
        if (setHash) {
            setHashParam('page', docIndex + 1);
        }
        prevBtn.disabled = docIndex === 0;
        nextBtn.disabled = docIndex === folder.docs.length - 1;
        pageSelect.value = (docIndex + 1).toString();
        resolveUrl(folderUrl, folder.docs[docIndex].href, host);
    }

    pageSelect.onchange = () => {
        const selectedPage = parseInt(pageSelect.value, 10);
        if (selectedPage >= 1 && selectedPage <= folder.docs.length) {
            updatePage(selectedPage - 1, true);
        }
    };

    // Button click handlers
    prevBtn.onclick = () => {
        if (docIndex > 0) {
            updatePage(docIndex - 1, true);
        }
    };

    nextBtn.onclick = () => {
        if (docIndex < folder.docs.length - 1) {
            updatePage(docIndex + 1, true);
        }
    };

    // Set initial hash and handle hash navigation
    function goToPageFromHash() {
        const pageStr = getHashParam('page');
        let newIndex = 0;
        if (pageStr) {
            const page = parseInt(pageStr, 10);
            if (page >= 1 && page <= folder.docs.length) {
                newIndex = page - 1;
            }
        }
        updatePage(newIndex, false);
    }

    window.addEventListener('hashchange', goToPageFromHash);

    // Only set hash param if not already present
    if (!getHashParam('page')) {
        setHashParam('page', docIndex + 1);
    }
    goToPageFromHash();

    // Add buttons and dropdown to the toolbar
    folderSpan.appendChild(prevBtn);
    folderSpan.appendChild(pageSelect);
    folderSpan.appendChild(nextBtn);

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
    const result = await loadViaUrl(url, host, false);
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
