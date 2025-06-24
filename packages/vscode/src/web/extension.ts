import * as vscode from 'vscode';
import { newPanel, WebViewWithUri } from './panel';

export function activate(context: vscode.ExtensionContext) {
	let current: WebViewWithUri | undefined = undefined;

	// Register the preview command for .idoc.md files
	const previewDisposable = vscode.commands.registerCommand('interactive-documents-vscode.previewIdoc', (fileUri: vscode.Uri) => {
		const columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
		const uriFsPath = fileUri.fsPath;
		//only allow one viewer at a time
		if (current && current.uriFsPath !== uriFsPath) {
			current.panel.dispose();
			current = undefined;
		}
		if (current) {
			// If we already have a panel, show it in the target column
			current.panel.reveal(columnToShowIn);

		} else {
			// Otherwise, create a new panel
			current = newPanel(context, uriFsPath);

			current.panel.onDidDispose(() => {
				current = undefined;
			}, null, context.subscriptions);

			// Handle messages from the webview
			current.panel.webview.onDidReceiveMessage(message => {
				switch (message.status) {
					case 'ready': {
						vscode.workspace.fs.readFile(fileUri).then(uint8array => {
							if (current && current.panel.visible) {

								const renderMessage: { markdown?: string } = {};

								// If the file is a markdown file, we can send the markdown content
								if (uriFsPath.endsWith('.idoc.md')) {
									renderMessage['markdown'] = new TextDecoder().decode(uint8array);
								}
								current.panel.webview.postMessage(renderMessage);
							}
						});
						break;
					}
				}
			}, undefined, context.subscriptions);
		}
	});

	context.subscriptions.push(previewDisposable);
}

export function deactivate() { }
