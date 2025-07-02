import { resolve, basename } from 'path';
import { existsSync, mkdirSync, unlinkSync, copyFileSync, readdirSync } from 'fs';

const resources = [
    '../../node_modules/vega/build/vega.min.js',
    '../../node_modules/vega-lite/build/vega-lite.min.js',
    '../../node_modules/markdown-it/dist/markdown-it.min.js',
    '../../node_modules/tabulator-tables/dist/js/tabulator.min.js',
    '../../node_modules/tabulator-tables/dist/css/tabulator.min.css',
    '../../packages/host/dist/umd/idocs.host.umd.js',
    '../../packages/markdown/dist/umd/idocs.markdown.umd.js',
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
