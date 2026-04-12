// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://iFor-Lux.github.io',
  base: '/License-Generator-Luxury',
  integrations: [react()],
});