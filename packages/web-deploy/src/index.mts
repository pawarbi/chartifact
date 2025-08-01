import { readFile, writeFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const frontmatter = `---
layout: default
title: "Chartifact Home"
---
`;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const readmePath = resolve(__dirname, '../../../README.md');
const outputPath = resolve(__dirname, '../../../docs/index.md');

async function generateIndex() {
    const readme = await readFile(readmePath, 'utf-8');
    await writeFile(outputPath, frontmatter + readme, 'utf-8');
}

generateIndex().catch(console.error);