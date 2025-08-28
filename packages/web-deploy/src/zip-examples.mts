import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
import AdmZip from 'adm-zip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const outputZip = resolve(__dirname, '../../../docs/assets/chartifact-examples.zip');
const zip = new AdmZip();

// Add folders
zip.addLocalFolder(resolve(__dirname, '../../../docs/assets/examples/json'), 'json');
zip.addLocalFolder(resolve(__dirname, '../../../docs/assets/examples/markdown'), 'markdown');

// Add files to schema folder
zip.addLocalFile(resolve(__dirname, '../../../docs/schema/idoc_v1.d.ts'), 'schema');
zip.addLocalFile(resolve(__dirname, '../../../docs/schema/idoc_v1.json'), 'schema');

// Ensure output directory exists
const outputDir = resolve(__dirname, '../../../docs/assets');
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// Write zip file
zip.writeZip(outputZip);
console.log(`Zip file created: ${outputZip}`);
