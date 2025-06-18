import { defineConfig } from 'vite';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',  // Path to the entry file for the bundle
      name: 'IDocsHost',
      fileName: 'idocshost',  // Base name for output files; Vite will add format extensions automatically
      formats: ['umd'],    // UMD format for browser compatibility
    },
    outDir: '../../docs/host',  // Output directory for the bundle
    minify: false,
    rollupOptions: {
      // External dependencies that the library expects consumers to provide
      external: ['markdown-it', 'vega', 'vega-lite', 'tabulator-tables'],
      output: {
        globals: {
          'markdown-it': 'markdownit',
          'vega': 'vega',
          'vega-lite': 'vegaLite',
        },
        entryFileNames: 'idocshost.umd.js',
      },
      plugins: [
        resolve(),   // Resolves Node modules
        commonjs(),  // Converts CommonJS to ES6
      ],
    },
  },
});
