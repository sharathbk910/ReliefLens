import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve('./src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    open: false,
    watch: {
      ignored: ['**/.temp_edge_verify/**', '**/docs/screenshots/**'],
    },
  },
  test: {
    testTimeout: 15000,
  },
});
