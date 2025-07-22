import fs from 'fs';
import path from 'path';

// Create the schema directory if it doesn't exist
fs.mkdirSync('../../docs/schema', { recursive: true });

// Copy the schema file
fs.copyFileSync('dist/idoc.schema.json', '../../docs/schema/idoc_v1.json');

fs.copyFileSync('dist/idoc.d.ts', '../../docs/schema/idoc_v1.d.ts');

console.log('Schema copied successfully to ../../docs/schema');
