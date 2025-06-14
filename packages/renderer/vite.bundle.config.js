import { defineConfig } from 'vite';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default defineConfig({
  build: {
    lib: {
      entry: './dist/es2022/index.js',  // Path to the entry file for the bundle
      name: 'IDocs',
      fileName: 'idocs',  // Base name for output files; Vite will add format extensions automatically
      formats: ['umd'],    // UMD format for browser compatibility
    },
    outDir: './dist/umd',  // Output directory for the bundle
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
        entryFileNames: 'idocs.umd.js',
      },
      plugins: [
        resolve(),   // Resolves Node modules
        commonjs(),  // Converts CommonJS to ES6
      ],
    },
  },
});
