import { defineConfig } from 'vite';

export default defineConfig({
  root: __dirname,

  server: {
    port: 4301,
    host: 'localhost',
    open: true,
  },

  build: {
    emptyOutDir: true,
  },
});
