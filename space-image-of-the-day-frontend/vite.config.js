import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'url';
import fs from 'fs';
import path from 'path';

// ESM-safe __dirname equivalent
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Browser target ──────────────────────────────────────────────────────────
// Set BROWSER=firefox or BROWSER=chrome (default) when building.
// e.g.  BROWSER=firefox vite build
const browser = process.env.BROWSER === 'firefox' ? 'firefox' : 'chrome';
const outDir = browser === 'firefox' ? 'dist-firefox' : 'dist-chrome';

// ─── Manifest copy plugin ────────────────────────────────────────────────────
// Copies the correct manifest.json into the output directory after the build.
function copyManifest() {
  return {
    name: 'copy-manifest',
    closeBundle() {
      const src =
        browser === 'firefox'
          ? path.resolve(__dirname, 'public/manifest.firefox.json')
          : path.resolve(__dirname, 'public/manifest.json');
      const dest = path.resolve(__dirname, outDir, 'manifest.json');
      fs.copyFileSync(src, dest);
      console.log(`[copy-manifest] Copied ${path.basename(src)} → ${outDir}/manifest.json`);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), copyManifest()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        newtab: 'index.html',
        background: 'src/background.ts',
        options: 'options.html',
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
});
