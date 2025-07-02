import * as vscode from 'vscode';
import { targetMarkdown } from '@microsoft/interactive-document-compiler';
import { InteractiveDocument } from 'dsl';
import { findAvailableFileName } from './file.js';

/**
 * Handles the conversion of .idoc.json files to markdown
 */
export async function convertToMarkdown(fileUri: vscode.Uri) {
	try {
		// Read the JSON content from the file
		const jsonContent = await vscode.workspace.fs.readFile(fileUri);
		const jsonText = new TextDecoder().decode(jsonContent);

		// Parse the Interactive Document
		let interactiveDocument: InteractiveDocument;
		try {
			interactiveDocument = JSON.parse(jsonText);
		} catch (parseError) {
			vscode.window.showErrorMessage(`Failed to parse JSON: ${parseError}`);
			return;
		}

		// Convert to markdown using the compiler
		const markdownContent = targetMarkdown(interactiveDocument);

		// Generate the output filename with conflict resolution
		const outputUri = await findAvailableFileName(fileUri, '.idoc.md', '.idoc.json');

		// Write the markdown file
		const markdownBytes = new TextEncoder().encode(markdownContent);
		await vscode.workspace.fs.writeFile(outputUri, markdownBytes);

		// Show success message and offer to open the file
		const openAction = 'Open Markdown file';
		const result = await vscode.window.showInformationMessage(
			`Successfully converted to Markdown: ${outputUri.fsPath}`,
			openAction
		);

		if (result === openAction) {
			const document = await vscode.workspace.openTextDocument(outputUri);
			await vscode.window.showTextDocument(document);
		}
	} catch (error) {
		vscode.window.showErrorMessage(`Failed to convert to Markdown: ${error}`);
	}
}