import * as vscode from 'vscode';
import { newPanel, WebViewWithUri } from './panel';

interface HostMessage {
	markdown?: string;
}

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
		const columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
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
			this.current = newPanel(this.context, uriFsPath);

			this.current.panel.onDidDispose(() => {
				this.current = undefined;
				this.disposeFileWatcher();
			}, null, this.context.subscriptions);

			// Handle messages from the webview
			this.current.panel.webview.onDidReceiveMessage(message => {
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
				vscode.workspace.fs.readFile(fileUri).then(uint8array => {

					// If the file is a markdown file, we can send the markdown content
					if (uriFsPath.endsWith('.idoc.md')) {
						const markdown = new TextDecoder().decode(uint8array);
						this.renderMarkdown(markdown);
					}

				});
				break;
			}
		}
	}

	public renderMarkdown(markdown: string) {
		if (this.current && this.current.panel.visible) {
			const renderMessage: HostMessage = {};
			renderMessage.markdown = markdown;
			this.current.panel.webview.postMessage(renderMessage);
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
			vscode.workspace.fs.readFile(fileUri).then(uint8array => {
				const markdown = new TextDecoder().decode(uint8array);
				this.renderMarkdown(markdown);
			});
		}
	}
}
