import { resolve, basename } from 'path';
import { existsSync, mkdirSync, unlinkSync, copyFile } from 'fs';

const resources = [
    '../../node_modules/vega/build/vega.min.js',
    '../../node_modules/vega-lite/build/vega-lite.min.js',
    '../../node_modules/markdown-it/dist/markdown-it.min.js',
    '../../node_modules/tabulator-tables/dist/js/tabulator.min.js',
    '../../node_modules/tabulator-tables/dist/css/tabulator.min.css',
];

const errors = [];
const resourcesPath = 'resources';

if (!existsSync(resourcesPath)) {
    mkdirSync(resourcesPath);
}

resources.forEach(resource => {
    const dest = resolve(resourcesPath, basename(resource));
    if (existsSync(dest)) {
        unlinkSync(dest);
    }
    if (existsSync(resource)) {
        copyFile(resource, dest, err => errors.push({ err, resource }));
    } else { 
        errors.push('file does not exist', resource);
    }
});

if (errors.length) {
    console.log(errors);
    process.exitCode = 1;
}
