import * as vscode from 'vscode';
import { getResource } from './resources';
import { escapeTextareaContent } from './html';
import { findAvailableFileName } from './file.js';

/**
 * Handles the conversion of .idoc.md and .idoc.json files to HTML
 */
export async function convertToHtml(fileUri: vscode.Uri) {
	try {
		// Read the file content
		const fileContent = await vscode.workspace.fs.readFile(fileUri);
		const fileText = new TextDecoder().decode(fileContent);

		// Check file extension to determine how to process
		const fileName = fileUri.fsPath.toLowerCase();
		let htmlContent: string;
		let originalExtension: string;

		if (fileName.endsWith('.idoc.json')) {
			// Handle JSON files
			htmlContent = htmlJsonWrapper(fileText, fileUri);
			originalExtension = '.idoc.json';
		} else if (fileName.endsWith('.idoc.md')) {
			// Handle Markdown files
			htmlContent = htmlMarkdownWrapper(fileText, fileUri);
			originalExtension = '.idoc.md';
		} else {
			throw new Error(`Unsupported file type. Expected .idoc.md or .idoc.json, got: ${fileName}`);
		}

		// Generate the output filename with conflict resolution
		const outputUri = await findAvailableFileName(fileUri, '.idoc.html', originalExtension);

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
	const template = getResource('html-markdown.html');

	//TODO: get this from CDN
	const sandboxUmdJs = getResource('idocs.sandbox.umd.js');

	const result = template
		.replace('{{TITLE}}', () => escapeHtml(getFileNameWithoutExtension(fileUri)))
		.replace('{{SANDBOX_UMD_JS}}', () => `<script>\n${sandboxUmdJs}\n</script>`)
		.replace('{{MARKDOWN_CONTENT}}', () => escapeTextareaContent(markdown));

	return result;
}

function htmlJsonWrapper(json: string, fileUri: vscode.Uri) {
	const template = getResource('html-json.html');

	//TODO: get these from CDN
	const sandboxUmdJs = getResource('idocs.sandbox.umd.js');
	const compilerUmdJs = getResource('idocs.compiler.umd.js');

	const result = template
		.replace('{{TITLE}}', () => escapeHtml(getFileNameWithoutExtension(fileUri)))
		.replace('{{SANDBOX_UMD_JS}}', () => `<script>\n${sandboxUmdJs}\n</script>`)
		.replace('{{COMPILER_UMD_JS}}', () => `<script>\n${compilerUmdJs}\n</script>`)
		.replace('{{JSON_CONTENT}}', () => escapeTextareaContent(json));

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
