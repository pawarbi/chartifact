import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const examplesDir = join(__dirname, '../../../docs/assets/examples');

function makefiles(files: string[], outputFile: string, mode: string) {
  let htmlContent = `---
layout: default
title: Chartifact Examples
---
<a href="/chartifact/">Chartifact home</a>
<a id="github-repo" href="https://github.com/microsoft/chartifact">GitHub Repository</a>

<h1>Chartifact Examples (${mode} format)</h1>

<p>Explore these interactive documents to see what's possible with Chartifact. <a href="./prompt">Want to create your own? Use AI to get started!</a></p>

`;

  files.forEach(file => {
    const filePath = join(examplesDir, file);
    const folderData = JSON.parse(readFileSync(filePath, 'utf-8'));

    htmlContent += `<h2>${folderData.title}</h2>\n`;
    htmlContent += `<a href="/chartifact/view?load=../assets/examples/${file}">view all</a>\n<ul>\n`;

    folderData.docs.forEach(doc => {
      const link = `/chartifact/view/?load=../assets/examples/${doc.href}`;
      htmlContent += `<li><a href="${link}">${doc.title}</a>`;
      if (doc.description) {
        htmlContent += `: ${doc.description}`;
      }
      htmlContent += `</li>\n`;
    });

    htmlContent += `</ul>\n`;
  });

  htmlContent += `
<h2>Downloads</h2>
<ul>
  <li><a href="/chartifact/assets/chartifact-examples.zip" download>Download All Examples (ZIP)</a></li>
  <li><a href="/chartifact/assets/chartifact-markdown-examples.zip" download>Download Markdown Only (ZIP)</a></li>
  <li><a href="/chartifact/assets/chartifact-json-examples.zip" download>Download JSON + Schema (ZIP)</a></li>
</ul>

${linkToOtherFormat(mode)}

</body>`;

  writeFileSync(outputFile, htmlContent, 'utf-8');

  console.log(`HTML file generated at ${outputFile}`);
}

function linkToOtherFormat(currentMode: string): string {
  if (currentMode === 'markdown') {
    return `<p>Want to see JSON examples? <a href="/chartifact/examples-json.html">Click here for JSON format examples</a></p>`;
  } else if (currentMode === 'json') {
    return `<p>Want to see Markdown examples? <a href="/chartifact/examples.html">Click here for Markdown format examples</a></p>`;
  }
  return '';
}

const markdownfiles = readdirSync(examplesDir).filter(file => file.endsWith('.markdown.folder.json'));
makefiles(markdownfiles, join(__dirname, '../../../docs/examples.html'), 'markdown');

const jsonfiles = readdirSync(examplesDir).filter(file => file.endsWith('.json.folder.json'));
makefiles(jsonfiles, join(__dirname, '../../../docs/examples-json.html'), 'json');
