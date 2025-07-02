import * as vscode from 'vscode';
import { getResource } from './resources';
import { escapeTextareaContent } from './html';
import { findAvailableFileName } from './file.js';

/**
 * Handles the conversion of .idoc.md files to HTML
 */
export async function convertToHtml(fileUri: vscode.Uri) {
	try {
		// Read the markdown content from the file
		const markdownContent = await vscode.workspace.fs.readFile(fileUri);
		const markdownText = new TextDecoder().decode(markdownContent);

		// Wrap the markdown content in HTML
		const htmlContent = htmlMarkdownWrapper(markdownText, fileUri);

		// Generate the output filename with conflict resolution
		const outputUri = await findAvailableFileName(fileUri, '.idoc.html', '.idoc.md');

		// Write the HTML file
		const htmlBytes = new TextEncoder().encode(htmlContent);
		await vscode.workspace.fs.writeFile(outputUri, htmlBytes);

		// Show success message and offer to open the file
		const openAction = 'Open HTML file';
		const result = await vscode.window.showInformationMessage(
			`Successfully converted to HTML: ${outputUri.fsPath}`,
			openAction
		);

		if (result === openAction) {
			const document = await vscode.workspace.openTextDocument(outputUri);
			await vscode.window.showTextDocument(document);
		}
	} catch (error) {
		vscode.window.showErrorMessage(`Failed to convert to HTML: ${error}`);
	}
}

function htmlMarkdownWrapper(markdown: string, fileUri: vscode.Uri) {
	const template = getResource('html.html');
	const rendererScript = getResource('idocs.markdown.umd.js');

	const result = template
		.replace('{{TITLE}}', () => escapeHtml(getFileNameWithoutExtension(fileUri)))
		.replace('{{RENDERER_SCRIPT}}', () => `<script>\n${rendererScript}\n</script>`)
		.replace('{{MARKDOWN_CONTENT}}', () => escapeTextareaContent(markdown));

	return result;
}

function getFileNameWithoutExtension(fileUri: any): any {
	const path = fileUri.path;
	const lastSlashIndex = path.lastIndexOf('/');
	const lastDotIndex = path.lastIndexOf('.');
	if (lastDotIndex > lastSlashIndex) {
		return path.substring(lastSlashIndex + 1, lastDotIndex);
	}
	return path.substring(lastSlashIndex + 1);
}

function escapeHtml(text: string): string {
	return text.replace(/[&<>"']/g, (char) => {
		switch (char) {
			case '&': return '&amp;';
			case '<': return '&lt;';
			case '>': return '&gt;';
			case '"': return '&quot;';
			case "'": return '&#39;';
			default: return char;
		}
	});
}
