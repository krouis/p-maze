import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.VITE_BASE || '/p-maze/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
});
