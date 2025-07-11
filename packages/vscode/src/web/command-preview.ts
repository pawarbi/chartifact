import * as vscode from 'vscode';
import { newPanel, WebViewWithUri } from './panel';
import { link, script } from './html';
import { getResource } from './resources';
import type { ListenOptions, RenderRequestMessage } from '@microsoft/interactive-document-host/types' with { 'resolution-mode': 'import' };

/**
 * Manages the preview functionality for Interactive Documents
 */
export class PreviewManager {
	private current: WebViewWithUri | undefined = undefined;
	private fileWatcher: vscode.FileSystemWatcher | undefined = undefined;

	constructor(private context: vscode.ExtensionContext) { }

	/**
	 * Shows the preview for the given file URI
	 */
	showPreview(fileUri: vscode.Uri) {
		this.showPreviewInternal(fileUri, false);
	}

	/**
	 * Shows the preview for the given file URI in split view
	 */
	showPreviewSplit(fileUri: vscode.Uri) {
		this.showPreviewInternal(fileUri, true);
	}

	/**
	 * Internal method to show the preview with optional split view
	 */
	private showPreviewInternal(fileUri: vscode.Uri, splitView: boolean) {
		const columnToShowIn = splitView ? vscode.ViewColumn.Beside : 
			(vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined);
		const uriFsPath = fileUri.fsPath;

		// Only allow one viewer at a time
		if (this.current && this.current.uriFsPath !== uriFsPath) {
			this.current.panel.dispose();
			this.current = undefined;
		}

		if (this.current) {
			// If we already have a panel, show it in the target column
			this.current.panel.reveal(columnToShowIn);
		} else {
			// Otherwise, create a new panel
			this.current = newPanel(this.context, uriFsPath, undefined, columnToShowIn);
			const { panel } = this.current;

			panel.webview.html = getWebviewContent(panel.webview, this.context);

			panel.onDidDispose(() => {
				this.current = undefined;
				this.disposeFileWatcher();
			}, null, this.context.subscriptions);

			// Handle messages from the webview
			panel.webview.onDidReceiveMessage(message => {
				this.handleWebviewMessage(message, fileUri, uriFsPath);
			}, undefined, this.context.subscriptions);

			// Set up file watcher for auto-refresh
			this.setupFileWatcher(fileUri);
		}
	}

	/**
	 * Handles messages from the webview
	 */
	private handleWebviewMessage(message: any, fileUri: vscode.Uri, uriFsPath: string) {
		switch (message.status) {
			case 'ready': {
				this.getFileContentAndRender(fileUri, uriFsPath);
				break;
			}
		}
	}

	private getFileContentAndRender(fileUri: vscode.Uri, uriFsPath: string) {
		vscode.workspace.fs.readFile(fileUri).then(uint8array => {

			// If the file is a markdown file, we can send the markdown content
			if (uriFsPath.endsWith('.idoc.md')) {
				const markdown = new TextDecoder().decode(uint8array);
				this.render({ markdown });
			} else if (uriFsPath.endsWith('.idoc.json')) {
				// If the file is a JSON file, we can send the JSON content
				const jsonContent = new TextDecoder().decode(uint8array);
				try {
					const interactiveDocument = JSON.parse(jsonContent);
					this.render({ interactiveDocument });
				} catch (error) {
					vscode.window.showErrorMessage(`Failed to parse JSON: ${error}`);
				}
			}

		});
	}

	public render(renderRequestMessage: RenderRequestMessage) {
		if (this.current && this.current.panel.visible) {
			this.current.panel.webview.postMessage(renderRequestMessage);
		}
	}

	/**
	 * Disposes of any current preview panel
	 */
	dispose() {
		if (this.current) {
			this.current.panel.dispose();
			this.current = undefined;
		}
		this.disposeFileWatcher();
	}

	/**
	 * Sets up a file system watcher for the given file URI
	 */
	private setupFileWatcher(fileUri: vscode.Uri) {
		// Dispose existing watcher if any
		this.disposeFileWatcher();

		// Create a file watcher for the specific file
		this.fileWatcher = vscode.workspace.createFileSystemWatcher(fileUri.fsPath);

		// Listen for file changes
		this.fileWatcher.onDidChange(() => {
			this.refreshPreview(fileUri);
		});

		// Add to context subscriptions for cleanup
		this.context.subscriptions.push(this.fileWatcher);
	}

	/**
	 * Disposes of the current file watcher
	 */
	private disposeFileWatcher() {
		if (this.fileWatcher) {
			this.fileWatcher.dispose();
			this.fileWatcher = undefined;
		}
	}

	/**
	 * Refreshes the preview by re-reading the file and rendering
	 */
	private refreshPreview(fileUri: vscode.Uri) {
		if (this.current && this.current.panel.visible) {
			this.getFileContentAndRender(fileUri, this.current.uriFsPath);
		}
	}
}

function getWebviewContent(webView: vscode.Webview, context: vscode.ExtensionContext) {

	function resourceUrl(resource: string) {
		// Get path to resource on disk
		const onDiskPath = vscode.Uri.file(context.extensionPath + '/resources/' + resource);

		// And get the special URI to use with the webview
		return webView.asWebviewUri(onDiskPath);
	}

	const hostOptions: ListenOptions = {
		clipboard: false,
		dragDrop: false,
		fileUpload: false,
		url: false,
	};

	// Build the resource links block
	const resourceLinks = [
		link(resourceUrl('tabulator.min.css')),
		script(resourceUrl('markdown-it.min.js')),
		script(resourceUrl('vega.min.js')),
		script(resourceUrl('vega-lite.min.js')),
		script(resourceUrl('tabulator.min.js')),
	].join('\n    ');

	const hostScript = script(resourceUrl('idocs.host.umd.js'));
	
	const template = getResource('preview.html');
	
	return template
		.replace('{{RESOURCE_LINKS}}', () => resourceLinks)
		.replace('{{HOST_SCRIPT}}', () => hostScript)
		.replace('{{HOST_OPTIONS}}', () => `<script>const hostOptions = ${JSON.stringify(hostOptions)};</script>`);
}
