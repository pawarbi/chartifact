// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import * as vscode from 'vscode';

export function getWebviewContent(webView: vscode.Webview, extensionPath: string, fileUriFsPath: string) {

    function resourceUrl(resource: string) {
        // Get path to resource on disk
        const onDiskPath = vscode.Uri.file(extensionPath + '/resources/' + resource);

        // And get the special URI to use with the webview
        return webView.asWebviewUri(onDiskPath);
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive Document Host</title>
    ${link(resourceUrl('tabulator.min.css'))}
    ${script(resourceUrl('markdown-it.min.js'))}
    ${script(resourceUrl('vega.js'))}
    ${script(resourceUrl('vega-lite.min.js'))}
    ${script(resourceUrl('tabulator.min.js'))}
</head>
<body>
    <div id="loading" style="text-align: center; padding: 50px;">
        Loading...
    </div>

    <div id="help" style="display: none;">
    </div>

    <div id="app"></div>
    ${script(resourceUrl('idocshost.umd.js'))}

    <script>
    console.log('Interactive Documents Host loaded');
    const vscode = acquireVsCodeApi();
    IDocsHost.setPostMessageTarget(vscode);
    </script>
</body>
</html>`;
}

function link(href: vscode.Uri) {
    return `<link rel="stylesheet" type="text/css" href="${href}" />`;
}

function script(src: vscode.Uri) {
    return `<script src="${src}"></script>`;
}
