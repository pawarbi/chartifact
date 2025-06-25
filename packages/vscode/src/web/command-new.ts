import * as vscode from 'vscode';
import { sample } from './template';

/**
 * Handles the creation of new Interactive Documents
 */
export async function createNewIdoc(uri?: vscode.Uri) {
	if (uri) {
		// Called from explorer context menu - create a real file in that folder
		await createFileInFolder(uri);
	} else {
		// Called from command palette - create an untitled document
		await createUntitledDocument();
	}
}

async function createFileInFolder(uri: vscode.Uri) {
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
}

async function createUntitledDocument() {
	const document = await vscode.workspace.openTextDocument({
		content: sample,
		language: 'markdown'
	});

	// Show the document in the editor
	await vscode.window.showTextDocument(document);
}
