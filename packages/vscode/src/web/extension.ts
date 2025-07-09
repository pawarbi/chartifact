import * as vscode from 'vscode';
import { createNewDocument } from './command-new';
import { PreviewManager } from './command-preview';
import { EditManager } from './command-edit';
import { convertToHtml } from './command-convert-html';
import { initializeResources } from './resources';

export async function activate(context: vscode.ExtensionContext) {
	// Initialize all resource contents eagerly
	await initializeResources(context);

	// Create preview manager
	const previewManager = new PreviewManager(context);

	// Create edit manager
	const editManager = new EditManager(context);

	// Register the new Interactive Document command
	const newDocumentDisposable = vscode.commands.registerCommand('interactive-documents-vscode.newIdocMarkdown', async (uri?: vscode.Uri) => {
		try {
			await createNewDocument(uri, 'markdown');
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to create Interactive Document (Markdown): ${error}`);
		}
	});

	context.subscriptions.push(newDocumentDisposable);

	// Register the new Interactive Document (JSON) command
	const newJsonDocumentDisposable = vscode.commands.registerCommand('interactive-documents-vscode.newIdocJson', async (uri?: vscode.Uri) => {
		try {
			await createNewDocument(uri, 'json');
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to create Interactive Document (JSON): ${error}`);
		}
	});

	context.subscriptions.push(newJsonDocumentDisposable);

	// Register the preview command for .idoc.md files
	const previewDisposable = vscode.commands.registerCommand('interactive-documents-vscode.previewIdoc', (fileUri: vscode.Uri) => {
		previewManager.showPreview(fileUri);
	});

	context.subscriptions.push(previewDisposable);

	// Register the edit command for .idoc.md and .idoc.json files
	const editDisposable = vscode.commands.registerCommand('interactive-documents-vscode.editIdoc', (fileUri: vscode.Uri) => {
		editManager.showPreview(fileUri);
	});

	context.subscriptions.push(editDisposable);

	// Register the convert to HTML command for .idoc.md files
	const convertToHtmlDisposable = vscode.commands.registerCommand('interactive-documents-vscode.convertToHtml', async (fileUri: vscode.Uri) => {
		try {
			await convertToHtml(fileUri);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to convert to HTML: ${error}`);
		}
	});

	context.subscriptions.push(convertToHtmlDisposable);

	// Register the convert to Markdown command for .idoc.json files
	const convertToMarkdownDisposable = vscode.commands.registerCommand('interactive-documents-vscode.convertToMarkdown', async (fileUri: vscode.Uri) => {
		try {
			const { convertToMarkdown } = await import('./command-convert-md.mjs');
			await convertToMarkdown(fileUri);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to convert to Markdown: ${error}`);
		}
	});

	context.subscriptions.push(convertToMarkdownDisposable);

	// Ensure preview manager is disposed when extension deactivates
	context.subscriptions.push({
		dispose: () => previewManager.dispose()
	});

	// Ensure edit manager is disposed when extension deactivates
	context.subscriptions.push({
		dispose: () => editManager.dispose()
	});
}

export function deactivate() { }
