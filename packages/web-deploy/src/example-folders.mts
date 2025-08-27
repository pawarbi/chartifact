import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const examplesDir = join(__dirname, '../../../docs/assets/examples');
const outputFile = join(__dirname, '../../../docs/examples.md');

const files = readdirSync(examplesDir).filter(file => file.endsWith('.folder.json'));

let markdownContent = `---
layout: default
title: "Examples"
---

# Examples

`;

files.forEach(file => {
  const filePath = join(examplesDir, file);
  const folderData = JSON.parse(readFileSync(filePath, 'utf-8'));

  markdownContent += `## ${folderData.title}\n\n`;

  folderData.docs.forEach(doc => {
    const link = `https://microsoft.github.io/chartifact/view/?load=../assets/examples/${doc.href}`;
    markdownContent += `- [${doc.title}](${link})`;
    if (doc.description) {
      markdownContent += `: ${doc.description}`;
    }
    markdownContent += `\n`;
  });

  markdownContent += '\n';
});

writeFileSync(outputFile, markdownContent, 'utf-8');

console.log(`Markdown file generated at ${outputFile}`);

