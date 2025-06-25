import * as vscode from 'vscode';
import { newPanel, WebViewWithUri } from './panel';
import { sample } from './template';

export function activate(context: vscode.ExtensionContext) {
	let current: WebViewWithUri | undefined = undefined;

	// Register the new Interactive Document command
	const newDocumentDisposable = vscode.commands.registerCommand('interactive-documents-vscode.newIdoc', async (uri?: vscode.Uri) => {
		try {
			if (uri) {
				// Called from explorer context menu - create a real file in that folder
				let targetFolder: vscode.Uri;
				
				const stat = await vscode.workspace.fs.stat(uri);
				if (stat.type === vscode.FileType.Directory) {
					targetFolder = uri;
				} else {
					// If it's a file, use its parent directory
					targetFolder = vscode.Uri.joinPath(uri, '..');
				}

				// Generate a unique filename
				let counter = 1;
				let fileName = 'untitled.idoc.md';
				let fileUri = vscode.Uri.joinPath(targetFolder, fileName);

				// Find an available filename
				while (true) {
					try {
						await vscode.workspace.fs.stat(fileUri);
						// File exists, try next number
						fileName = `untitled-${counter}.idoc.md`;
						fileUri = vscode.Uri.joinPath(targetFolder, fileName);
						counter++;
					} catch {
						// File doesn't exist, we can use this name
						break;
					}
				}

				// Create the file with the sample content
				const content = new TextEncoder().encode(sample);
				await vscode.workspace.fs.writeFile(fileUri, content);

				// Open the file in the editor
				const document = await vscode.workspace.openTextDocument(fileUri);
				await vscode.window.showTextDocument(document);
			} else {
				// Called from command palette - create an untitled document
				const document = await vscode.workspace.openTextDocument({
					content: sample,
					language: 'markdown'
				});

				// Show the document in the editor
				await vscode.window.showTextDocument(document);
			}

		} catch (error) {
			vscode.window.showErrorMessage(`Failed to create Interactive Document: ${error}`);
		}
	});

	context.subscriptions.push(newDocumentDisposable);

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
