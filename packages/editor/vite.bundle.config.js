import { defineConfig } from 'vite';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import react from '@vitejs/plugin-react';

const commonOutputConfig = {
  format: 'umd',
  name: 'IDocs.editor',
  globals: {
    'react': 'React',
    'react-dom': 'ReactDOM',
    'markdown-it': 'markdownit',
    'vega': 'vega',
    'vega-lite': 'vegaLite',
    'sandbox': 'IDocs.sandbox',
  },
  entryFileNames: 'idocs.editor.umd.js',
};

export default defineConfig({
  plugins: [react({
    jsxRuntime: 'classic'
  })],
  build: {
    lib: {
      entry: './src/index.ts',
    },
    minify: false,
    rollupOptions: {
      // External dependencies that the library expects consumers to provide
      external: ['react', 'react-dom', 'vega', 'vega-lite', 'sandbox'],
      output: [
        {
          ...commonOutputConfig,
          dir: './dist/umd',
        },
        {
          ...commonOutputConfig,
          dir: '../../docs/dist',
        },
      ],
      plugins: [
        resolve(),   // Resolves Node modules
        commonjs(),  // Converts CommonJS to ES6
      ],
    },
  },
});
