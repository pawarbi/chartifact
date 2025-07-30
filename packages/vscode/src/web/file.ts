/*!
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import * as vscode from 'vscode';

/**
 * Finds an available filename by appending a counter if the original filename already exists.
 * 
 * @param originalUri The original file URI
 * @param targetExtension The target file extension (e.g., '.idoc.md', '.idoc.html')
 * @param sourceExtension The source file extension to replace (e.g., '.idoc.json', '.idoc.md')
 * @returns A URI for an available filename
 */
export async function findAvailableFileName(
	originalUri: vscode.Uri,
	targetExtension: string,
	sourceExtension: string
): Promise<vscode.Uri> {
	// Generate the base output filename
	const originalPath = originalUri.path;
	const basePath = originalPath.replace(new RegExp(`${escapeRegExp(sourceExtension)}$`), targetExtension);
	let outputUri = originalUri.with({ path: basePath });

	// Check if file exists and find an available filename
	let counter = 1;
	while (true) {
		try {
			await vscode.workspace.fs.stat(outputUri);
			// File exists, try next number
			const pathWithCounter = basePath.replace(
				new RegExp(`${escapeRegExp(targetExtension)}$`),
				`-${counter}${targetExtension}`
			);
			outputUri = originalUri.with({ path: pathWithCounter });
			counter++;
		} catch {
			// File doesn't exist, we can use this name
			break;
		}
	}

	return outputUri;
}

/**
 * Escapes special regex characters in a string
 */
function escapeRegExp(string: string): string {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
