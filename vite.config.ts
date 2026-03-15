import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Relative paths so HTML can reference JS/CSS as siblings in web resources
  base: './',
  resolve: {
    alias: {
      '@': import.meta.dirname + '/src',
    },
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'dataverse-devtools.js',
        assetFileNames: 'dataverse-devtools.[ext]',
        manualChunks: undefined,
      },
    },
    cssCodeSplit: false,
    outDir: 'dist',
  },
});
