import { resolve, basename } from 'path';
import { existsSync, mkdirSync, unlinkSync, copyFileSync, readdirSync } from 'fs';

const resources = [
    '../../node_modules/react/umd/react.production.min.js',
    '../../node_modules/react-dom/umd/react-dom.production.min.js',
    '../../node_modules/vega/build/vega.min.js',
    '../../node_modules/vega-lite/build/vega-lite.min.js',
    '../../node_modules/markdown-it/dist/markdown-it.min.js',
    '../../node_modules/tabulator-tables/dist/js/tabulator.min.js',
    '../../node_modules/tabulator-tables/dist/css/tabulator.min.css',
    '../../packages/host/dist/umd/idocs.host.umd.js',
    '../../packages/sandbox/dist/umd/idocs.sandbox.umd.js',
    '../../packages/compiler/dist/umd/idocs.compiler.umd.js',
    '../../packages/editor/dist/umd/idocs.editor.umd.js',
    '../../docs/assets/examples/grocery-list.idoc.json',
    '../../docs/assets/examples/seattle-weather/1.idoc.md',
    '../../packages/vscode-resources/dist/edit.js',
    '../../packages/vscode-resources/dist/html-json.js',
    '../../packages/vscode-resources/dist/html-markdown.js',
    '../../packages/vscode-resources/dist/preview.js',
    '../../packages/vscode-resources/html/preview.html',
    '../../packages/vscode-resources/html/edit.html',
    '../../packages/vscode-resources/html/html-json.html',
    '../../packages/vscode-resources/html/html-markdown.html',
];

const errors = [];
const resourcesPath = 'resources';

if (!existsSync(resourcesPath)) {
    mkdirSync(resourcesPath);
} else {
    // Empty the directory
    for (const file of readdirSync(resourcesPath)) {
        unlinkSync(resolve(resourcesPath, file));
    }
}

resources.forEach(resource => {
    const dest = resolve(resourcesPath, basename(resource));
    if (existsSync(resource)) {
        try {
            copyFileSync(resource, dest);
        } catch (err) {
            errors.push({ err, resource });
        }
    } else { 
        errors.push('file does not exist', resource);
    }
});

if (errors.length) {
    console.log(errors);
    process.exitCode = 1;
}
