// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import * as vscode from 'vscode';

export interface WebViewWithUri {
    panel: vscode.WebviewPanel;
    uriFsPath: string;
}

export function newPanel(context: vscode.ExtensionContext, uriFsPath: string, uriTabName?: string, viewColumn?: vscode.ViewColumn, titlePrefix?: string) {
    const webViewWithUri: WebViewWithUri = {
        panel: vscode.window.createWebviewPanel(
            'ChartifactPreview',
            `${titlePrefix}: ${(uriTabName || uriFsPath).split(/[/\\]/).pop() || 'Document'}`,
            viewColumn || vscode.ViewColumn.One,
            {
                enableScripts: true,
                // Only allow the webview to access resources in our extension's media directory
                localResourceRoots: [
                    vscode.Uri.file(context.extensionPath + '/resources'),
                ],
                retainContextWhenHidden: true,
            },
        ),
        uriFsPath,
    };
    return webViewWithUri;
}
