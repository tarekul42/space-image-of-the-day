import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        newtab: 'index.html',
        background: 'src/background.ts',
        options: 'options.html'
      },
      output: {
        entryFileNames: '[name].js'
      }
    }
  }
});
