import fs from 'fs';

const filePath = 'dist/idoc.d.ts';

// Read the file content
const content = fs.readFileSync(filePath, 'utf8');

// Split by lines, filter out empty lines, and rejoin
const strippedContent = content
  .split(/\r?\n/)
  .filter(line => line.trim())
  .join('\n');

// Write the stripped content back to the file
fs.writeFileSync(filePath, strippedContent);

console.log('Blank lines stripped from', filePath);
