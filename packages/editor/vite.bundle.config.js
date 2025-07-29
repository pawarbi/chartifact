import { defineConfig } from 'vite';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import react from '@vitejs/plugin-react';

const commonOutputConfig = {
  format: 'umd',
  name: 'IDocs',
  extend: true,
  globals: {
    'react': 'React',
    'react-dom': 'ReactDOM',
    'markdown-it': 'markdownit',
    'vega': 'vega',
    'vega-lite': 'vegaLite',
  },
  entryFileNames: 'idocs.editor.umd.js',
};

export default defineConfig({
  plugins: [react({
    jsxRuntime: 'classic'
  })],
  build: {
    lib: {
      entry: './umd.ts',
    },
    minify: false,
    emptyOutDir: false,
    rollupOptions: {
      // External dependencies that the library expects consumers to provide
      external: ['react', 'react-dom', 'vega', 'vega-lite'],
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
