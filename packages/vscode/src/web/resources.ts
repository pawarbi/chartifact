import * as vscode from 'vscode';

// Cache for resource contents - can be string content or Error object
const cachedResources: Record<string, string | Error> = {};

// Initialize resource contents (call this during extension activation)
export const initializeResources = async (context: vscode.ExtensionContext): Promise<void> => {
  const resourcesToLoad: [string, string][] = [
    ['resources', 'idocs.renderer.umd.js'],
    ['html', 'template.html'],
    ['html', 'preview.html'],
  ];
  
  for (const [folder, filename] of resourcesToLoad) {
    try {
      const resourceUri = vscode.Uri.joinPath(context.extensionUri, folder, filename);
      const fileData = await vscode.workspace.fs.readFile(resourceUri);
      const content = new TextDecoder().decode(fileData);
      
      cachedResources[filename] = content;
    } catch (error) {
      console.error(`Failed to read ${filename}:`, error);
      cachedResources[filename] = error instanceof Error ? error : new Error(`Failed to load ${filename}`);
    }
  }
};

// Get a cached resource by name
export const getResource = (resourceName: string): string => {
  const resource = cachedResources[resourceName];
  
  if (!resource) {
    throw new Error(`Resource not found: ${resourceName}`);
  }
  
  if (resource instanceof Error) {
    throw resource;
  }
  
  return resource;
};
