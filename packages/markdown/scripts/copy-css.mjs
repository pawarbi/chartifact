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

// Copy the css reset file
fs.copyFileSync('./chartifact-reset.css', './dist/css/chartifact-reset.css');
fs.copyFileSync('./chartifact-reset.css', '../../docs/dist/v1/chartifact-reset.css');

console.log('CSS reset file copied successfully to ../../docs/dist/v1');
