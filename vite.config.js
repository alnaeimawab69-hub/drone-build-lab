import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const page = f => resolve(import.meta.dirname, f);

export default defineConfig({
  plugins: [react()],
  // relative asset paths, so the build also works from a sub-folder (for example GitHub Pages)
  base: './',
  build: {
    // the lab engine chunk is mostly Three.js (about 600 kB minified, 160 kB gzipped)
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      input: { home: page('index.html'), lab: page('lab.html'), guide: page('guide.html') },
    },
  },
});
