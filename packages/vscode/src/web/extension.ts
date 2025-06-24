// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { newPanel, WebViewWithUri } from './panel';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	let current: WebViewWithUri | undefined = undefined;

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "interactive-documents-vscode" is now active in the web extension host!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('interactive-documents-vscode.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from interactive-documents-vscode in a web extension host!');
	});

	// Register the preview command for .idoc.md files
	const previewDisposable = vscode.commands.registerCommand('interactive-documents-vscode.previewIdoc', (fileUri: vscode.Uri) => {
		const columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
		const uriFsPath = fileUri.fsPath;
		//only allow one SandDance at a time
		if (current && current.uriFsPath !== uriFsPath) {
			current.panel.dispose();
			current = undefined;
		}
		if (current) {

			//TODO: registerWebviewPanelSerializer to hydrate state

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

				console.log('Received message from webview:', message);

				switch (message.status) {
					case 'ready': {
						vscode.workspace.fs.readFile(fileUri).then(uint8array => {
							if (current && current.panel.visible) {

								const renderMessage: { markdown?: string } = {};

								// If the file is a markdown file, we can send the markdown content
								if (uriFsPath.endsWith('.md')) {
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

	context.subscriptions.push(disposable);
	context.subscriptions.push(previewDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
