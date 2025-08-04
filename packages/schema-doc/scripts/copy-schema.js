import fs from 'fs';

// Copy the schema file
fs.copyFileSync('dist/idoc.schema.json', '../../docs/schema/idoc_v1.json');

fs.copyFileSync('dist/idoc.d.ts', '../../docs/schema/idoc_v1.d.ts');

console.log('Schema copied successfully to ../../docs/schema');
