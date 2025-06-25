import * as vscode from 'vscode';
import { createNewIdoc } from './command-new';
import { PreviewManager } from './command-preview';

export function activate(context: vscode.ExtensionContext) {
	// Create preview manager
	const previewManager = new PreviewManager(context);

	// Register the new Interactive Document command
	const newDocumentDisposable = vscode.commands.registerCommand('interactive-documents-vscode.newIdoc', async (uri?: vscode.Uri) => {
		try {
			await createNewIdoc(uri);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to create Interactive Document: ${error}`);
		}
	});

	context.subscriptions.push(newDocumentDisposable);

	// Register the preview command for .idoc.md files
	const previewDisposable = vscode.commands.registerCommand('interactive-documents-vscode.previewIdoc', (fileUri: vscode.Uri) => {
		previewManager.showPreview(fileUri);
	});

	context.subscriptions.push(previewDisposable);

	// Ensure preview manager is disposed when extension deactivates
	context.subscriptions.push({
		dispose: () => previewManager.dispose()
	});
}

export function deactivate() { }
