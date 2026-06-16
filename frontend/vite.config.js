import { defineConfig } from 'vite';

// Basic Vite config without @vitejs/plugin-react to avoid plugin/vite version conflicts.
export default defineConfig({
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
  },
});