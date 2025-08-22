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

    //replace all '(https://microsoft.github.io/chartifact' with '(.' for local testing
    const updatedReadme = readme.replace(/\(https:\/\/microsoft\.github\.io\/chartifact/g, () => '(.');

    await writeFile(outputPath, frontmatter + updatedReadme, 'utf-8');
}

generateIndex().catch(console.error);