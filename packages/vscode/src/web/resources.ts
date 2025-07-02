import * as vscode from 'vscode';

// Cache for resource contents
const cachedResources: Record<string, string> = {};

// Initialize resource contents (call this during extension activation)
export const initializeResources = async (context: vscode.ExtensionContext): Promise<void> => {
  const resourcesToLoad = [
    'idocs.renderer.umd.js',
  ];

  for (const resourceName of resourcesToLoad) {
    try {
      const resourceUri = vscode.Uri.joinPath(context.extensionUri, 'resources', resourceName);
      const fileData = await vscode.workspace.fs.readFile(resourceUri);
      cachedResources[resourceName] = new TextDecoder().decode(fileData);
    } catch (error) {
      console.error(`Failed to read ${resourceName}:`, error);
      cachedResources[resourceName] = `// Error loading ${resourceName}`;
    }
  }
};

// Get a cached resource by name
export const getResource = (resourceName: string): string => {
  return cachedResources[resourceName] || `// Error: ${resourceName} not found`;
};
