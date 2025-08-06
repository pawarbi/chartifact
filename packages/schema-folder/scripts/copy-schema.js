import fs from 'fs';

// Copy the schema file
fs.copyFileSync('dist/folder.schema.json', '../../docs/schema/folder_v1.json');

fs.copyFileSync('dist/folder.d.ts', '../../docs/schema/folder_v1.d.ts');

console.log('Schema copied successfully to ../../docs/schema');
