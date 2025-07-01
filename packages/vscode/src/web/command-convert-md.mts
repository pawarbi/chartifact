import * as vscode from 'vscode';
import { targetMarkdown } from '@microsoft/interactive-document-compiler';
import { InteractiveDocument } from 'dsl';

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
		const originalPath = fileUri.path;
		const basePath = originalPath.replace(/\.idoc\.json$/, '.idoc.md');
		let outputUri = fileUri.with({ path: basePath });

		// Check if file exists and find an available filename
		let counter = 1;
		while (true) {
			try {
				await vscode.workspace.fs.stat(outputUri);
				// File exists, try next number
				const pathWithCounter = basePath.replace(/\.idoc\.md$/, `-${counter}.idoc.md`);
				outputUri = fileUri.with({ path: pathWithCounter });
				counter++;
			} catch {
				// File doesn't exist, we can use this name
				break;
			}
		}

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