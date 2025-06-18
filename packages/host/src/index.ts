import { Renderer } from '@microsoft/interactive-document-renderer';
import { setupClipboardHandling } from './clipboard.js';
import { setupDragDropHandling } from './dragdrop.js';
import { setupFileUpload } from './upload.js';
import { setupUrlHandling } from './url.js';

console.log('Host index.ts loaded!');

// Get DOM elements
const loadingDiv = document.getElementById('loading') as HTMLElement;
const helpDiv = document.getElementById('help') as HTMLElement;
const appDiv = document.getElementById('app') as HTMLElement;
const uploadBtn = document.getElementById('upload-btn') as HTMLButtonElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;

// Initialize renderer
const renderer = new Renderer(appDiv, {});

// Setup all event handlers
window.addEventListener('DOMContentLoaded', () => {
  // Setup clipboard, drag-drop, and upload handling
  setupClipboardHandling(renderMarkdown);
  setupDragDropHandling(appDiv, renderMarkdown);
  setupFileUpload(uploadBtn, fileInput, renderMarkdown);
});

// Setup URL parameter handling
setupUrlHandling(hideLoadingAndLoadFile, showHelpAndHideLoading);

// Global function for example buttons
(window as any).loadExample = (examplePath: string) => {
  hideHelpAndLoadFile(`docs/assets/examples/${examplePath}`);
};

// Helper functions
function hideLoadingAndLoadFile(filePath: string) {
  loadingDiv.style.display = 'none';
  loadMarkdownFile(filePath);
}

function showHelpAndHideLoading() {
  loadingDiv.style.display = 'none';
  helpDiv.style.display = 'block';
}

function hideHelpAndLoadFile(filePath: string) {
  loadMarkdownFile(filePath);
}

async function loadMarkdownFile(filePath: string) {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to load ${filePath}`);
    }
    const content = await response.text();
    renderMarkdown(content);
  } catch (error) {
    console.error('Error loading markdown file:', error);
    appDiv.innerHTML = `<div style="color: red; padding: 20px;">Error loading file: ${filePath}</div>`;
  }
}

function renderMarkdown(content: string) {
  // Hide loading and help when rendering any content
  if (loadingDiv) {
    loadingDiv.style.display = 'none';
  }
  if (helpDiv) {
    helpDiv.style.display = 'none';
  }
  
  try {
    renderer.destroy(); // Clean up previous renderer instance
    // Use your renderer to process the markdown
    const renderedContent = renderer.render(content);
  } catch (error) {
    console.error('Error rendering markdown:', error);
    appDiv.innerHTML = `<div style="color: red; padding: 20px;">Error rendering markdown content</div>`;
  }
}

/*

TODO:
- check url for param to fetch md file and render it ✓
- add drop handler to render an .md file ✓
- if neither then:
  - link to examples ✓
  - link to documentation ✓
  - show upload button ✓


*/
