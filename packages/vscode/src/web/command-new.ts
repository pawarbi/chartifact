import * as vscode from 'vscode';
import { findAvailableFileName } from './file';
import { getResource } from './resources';

/**
 * Generic function to create new Interactive Documents
 */
export async function createNewDocument(uri: vscode.Uri | undefined, format: 'markdown' | 'json') {
	if (uri) {
		// Called from explorer context menu - create a real file in that folder
		await createFileInFolder(uri, format);
	} else {
		// Called from command palette - create an untitled document
		await createUntitledDocument(format);
	}
}

async function createFileInFolder(uri: vscode.Uri, format: 'markdown' | 'json') {
	let targetFolder: vscode.Uri;
	const stat = await vscode.workspace.fs.stat(uri);
	if (stat.type === vscode.FileType.Directory) {
		targetFolder = uri;
	} else {
		// If it's a file, use its parent directory
		targetFolder = vscode.Uri.joinPath(uri, '..');
	}

	// Generate filename and content based on format
	const extension = format === 'json' ? '.idoc.json' : '.idoc.md';
	const baseFileUri = vscode.Uri.joinPath(targetFolder, `untitled${extension}`);
	const fileUri = await findAvailableFileName(baseFileUri, extension, extension);
	const { sampleInteractiveDocumentWithSchema, sampleMarkdown } = getSamples();

	// Create the file with the appropriate sample content
	let content: Uint8Array;
	if (format === 'json') {
		content = new TextEncoder().encode(sampleInteractiveDocumentWithSchema);
	} else {
		content = new TextEncoder().encode(sampleMarkdown);
	}
	
	await vscode.workspace.fs.writeFile(fileUri, content);

	// Open the file in the editor
	const document = await vscode.workspace.openTextDocument(fileUri);
	await vscode.window.showTextDocument(document);
}

async function createUntitledDocument(format: 'markdown' | 'json') {
	const { sampleInteractiveDocumentWithSchema, sampleMarkdown } = getSamples();

	let content: string;
	let language: string;

	if (format === 'json') {
		content = sampleInteractiveDocumentWithSchema;
		language = 'json';
	} else {
		content = sampleMarkdown;
		language = 'markdown';
	}

	const document = await vscode.workspace.openTextDocument({
		content,
		language
	});

	// Show the document in the editor
	await vscode.window.showTextDocument(document);
}

function getSamples() {
	const sampleInteractiveDocumentWithSchema = getResource('grocery-list.idoc.json');
	const sampleMarkdown = getResource('1.idoc.md');
	return { sampleInteractiveDocumentWithSchema, sampleMarkdown };
}
