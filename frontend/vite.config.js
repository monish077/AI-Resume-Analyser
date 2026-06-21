import { defineConfig } from 'vite';

// Basic Vite config without @vitejs/plugin-react to avoid plugin/vite version conflicts.
export default defineConfig({
  server: {
    port: 3000,
    open: true,
    // Proxy /api/* requests to the backend during local development
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});