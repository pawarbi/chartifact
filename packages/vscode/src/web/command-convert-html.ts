import * as vscode from 'vscode';
import { getResource } from './resources';
import { escapeTextareaContent } from './html';

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

function htmlMarkdownWrapper(markdown: string) {
	return `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mdv test</title>
    <link href="https://unpkg.com/tabulator-tables@6.3.0/dist/css/tabulator.min.css" rel="stylesheet" />

    <script src="https://cdn.jsdelivr.net/npm/markdown-it/dist/markdown-it.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/vega@5.29.0"></script>
    <script src="https://cdn.jsdelivr.net/npm/vega-lite@5.20.1"></script>
    <script src="https://unpkg.com/tabulator-tables@6.3.0/dist/js/tabulator.min.js"></script>

    <!-- TODO: use CDN version -->
    <script>
${getResource('idocs.umd.js')}
    </script>

</head>

<body>

    <textarea id="markdown-input" style="display:none;min-height:300px;width:100%;">${escapeTextareaContent(markdown)}</textarea>

    <div id="content"></div>

    <script>
        IDocs.bindTextarea(document.getElementById('markdown-input'), document.getElementById('content'));
    </script>

</body>

</html>`;
}
