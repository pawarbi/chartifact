import fs from 'fs';

const filePath = 'dist/idoc.d.ts';

// Read the file content
const content = fs.readFileSync(filePath, 'utf8');

const copyrightHeader = `/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/`;

//remove all instances of the copyright header
const updatedContent = content.split(copyrightHeader).join('');

// Split by lines, filter out empty lines, and rejoin
const strippedContent = updatedContent
  .split(/\r?\n/)
  .filter(line => line.trim())
  .join('\n');

//add a single copyright header at the top
const finalContent = `${copyrightHeader}\n${strippedContent}`;

// Write the stripped content back to the file
fs.writeFileSync(filePath, finalContent, 'utf8');

console.log('Blank lines stripped from', filePath);
