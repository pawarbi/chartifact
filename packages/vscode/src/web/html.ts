// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import * as vscode from 'vscode';

export function link(href: vscode.Uri) {
    return `<link rel="stylesheet" type="text/css" href="${href}" />`;
}

export function script(src: vscode.Uri) {
    return `<script src="${src}"></script>`;
}

export function escapeTextareaContent(text: string): string {
    return text
        .replace(/<\/textarea>/gi, '&lt;/textarea&gt;') // Prevent textarea breakage
        .replace(/<script/gi, '&lt;script')            // Block script tags
        .replace(/<\/script>/gi, '&lt;/script&gt;');   // Close script tag
}
