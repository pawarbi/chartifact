import * as vscode from 'vscode';
import { createNewDocument } from './command-new';
import { PreviewManager } from './command-preview';
import { convertToHtml } from './command-convert-html';
import { initializeResources } from './resources';

export function activate(context: vscode.ExtensionContext) {
	// Initialize all resource contents eagerly
	initializeResources(context);

	// Create preview manager
	const previewManager = new PreviewManager(context);

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
}

export function deactivate() { }
