import { targetMarkdown } from '@microsoft/chartifact-compiler';
import { InteractiveDocument } from '@microsoft/chartifact-schema';
import fs from 'node:fs';

function convertToMarkdown(interactiveDocument: InteractiveDocument): string {
    // Convert the Interactive Document to Markdown format
    let markdown = targetMarkdown(interactiveDocument);

    if (!interactiveDocument.style) {
        //remove any line that starts with the group identifier ":::"
        markdown = markdown
            .split('\n')
            .filter(line => !line.startsWith(':::'))
            .join('\n');
    }

    return markdown;
}

//from the ./json folder, recursively traverse for every .json file
//keep track of the deep folder paths because we will be dropping converted files in the same structure in the destination
//destination is ../../docs/examples/markdown
async function convertJsonFilesToMarkdown(sourceDir: string, destDir: string) {
    const files = fs.readdirSync(sourceDir, { withFileTypes: true });

    for (const file of files) {
        const sourcePath = `${sourceDir}/${file.name}`;
        const destPath = `${destDir}/${file.name.replace(/\.json$/, '.md')}`;

        if (file.isDirectory()) {
            // Create the destination directory if it doesn't exist
            if (!fs.existsSync(destPath)) {
                fs.mkdirSync(destPath, { recursive: true });
                console.log(`Created directory: ${destPath}`);
            }
            // Recursively convert files in the subdirectory
            await convertJsonFilesToMarkdown(sourcePath, destPath);
        } else if (file.isFile() && file.name.endsWith('.json')) {
            console.log(`Converting: ${sourcePath} -> ${destPath}`);
            // Read the JSON file
            const jsonContent = fs.readFileSync(sourcePath, 'utf-8');
            const interactiveDocument: InteractiveDocument = JSON.parse(jsonContent);

            // Convert to Markdown
            const markdownContent = convertToMarkdown(interactiveDocument);

            // Write the Markdown file
            fs.writeFileSync(destPath, markdownContent);
            console.log(`Written: ${destPath}`);
        }
    }
}

convertJsonFilesToMarkdown('./json', '../../docs/assets/examples/markdown');
