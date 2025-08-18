import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Define the source and destination directories
const distDir = path.join(__dirname, '../dist/css');

// Ensure the destination directories exist
if (!fs.existsSync(distDir)) {  
    fs.mkdirSync(distDir, { recursive: true });
}

// Copy the css toolbar file
fs.copyFileSync('./chartifact-toolbar.css', './dist/css/chartifact-toolbar.css');
fs.copyFileSync('./chartifact-toolbar.css', '../../docs/dist/v1/chartifact-toolbar.css');

console.log('CSS toolbar file copied successfully to ../../docs/dist/v1');
