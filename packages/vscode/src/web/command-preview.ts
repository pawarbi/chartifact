import * as vscode from 'vscode';
import { newPanel, WebViewWithUri } from './panel';

/**
 * Manages the preview functionality for Interactive Documents
 */
export class PreviewManager {
	private current: WebViewWithUri | undefined = undefined;

	constructor(private context: vscode.ExtensionContext) {}

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
			}, null, this.context.subscriptions);

			// Handle messages from the webview
			this.current.panel.webview.onDidReceiveMessage(message => {
				this.handleWebviewMessage(message, fileUri, uriFsPath);
			}, undefined, this.context.subscriptions);
		}
	}

	/**
	 * Handles messages from the webview
	 */
	private handleWebviewMessage(message: any, fileUri: vscode.Uri, uriFsPath: string) {
		switch (message.status) {
			case 'ready': {
				vscode.workspace.fs.readFile(fileUri).then(uint8array => {
					if (this.current && this.current.panel.visible) {
						const renderMessage: { markdown?: string } = {};

						// If the file is a markdown file, we can send the markdown content
						if (uriFsPath.endsWith('.idoc.md')) {
							renderMessage['markdown'] = new TextDecoder().decode(uint8array);
						}
						this.current.panel.webview.postMessage(renderMessage);
					}
				});
				break;
			}
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
	}
}
