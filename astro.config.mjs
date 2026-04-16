// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://iFor-Lux.github.io',
  base: '/License-Generator-Luxury',
  integrations: [react()],
  vite: {
    build: {
      cssMinify: true,
      minify: 'esbuild',
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'firebase/database', 'motion/react']
    }
  }
});