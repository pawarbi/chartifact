import * as vscode from 'vscode';
import { htmlMarkdownWrapper } from './templates';

/**
 * Handles the conversion of .idoc.md files to HTML
 */
export async function convertToHtml(fileUri: vscode.Uri) {
	try {
		// Read the markdown content from the file
		const markdownContent = await vscode.workspace.fs.readFile(fileUri);
		const markdownText = new TextDecoder().decode(markdownContent);

		// Wrap the markdown content in HTML
		const htmlContent = htmlMarkdownWrapper(markdownText);

		// Generate the output filename with conflict resolution
		const originalPath = fileUri.path;
		const basePath = originalPath.replace(/\.idoc\.md$/, '.idoc.html');
		let outputUri = fileUri.with({ path: basePath });
		
		// Check if file exists and find an available filename
		let counter = 1;
		while (true) {
			try {
				await vscode.workspace.fs.stat(outputUri);
				// File exists, try next number
				const pathWithCounter = basePath.replace(/\.idoc\.html$/, `-${counter}.idoc.html`);
				outputUri = fileUri.with({ path: pathWithCounter });
				counter++;
			} catch {
				// File doesn't exist, we can use this name
				break;
			}
		}

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
