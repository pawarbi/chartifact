import { defineConfig } from 'vite';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const commonOutputConfig = {
  format: 'umd',
  name: 'IDocs',
  globals: {
    'markdown-it': 'markdownit',
    'vega': 'vega',
    'vega-lite': 'vegaLite',
  },
  entryFileNames: 'idocs.umd.js',
};

export default defineConfig({
  build: {
    lib: {
      entry: './dist/esnext/index.js',
    },
    minify: false,
    rollupOptions: {
      // External dependencies that the library expects consumers to provide
      external: ['markdown-it', 'vega', 'vega-lite', 'tabulator-tables'],
      output: [
        {
          ...commonOutputConfig,
          dir: './dist/umd',
        },
      ],
      plugins: [
        resolve(),   // Resolves Node modules
        commonjs(),  // Converts CommonJS to ES6
      ],
    },
  },
});
