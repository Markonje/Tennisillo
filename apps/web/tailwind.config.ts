import type { Config } from 'tailwindcss';
import tailwindPreset from '@tennisillo/ui/tailwind';

const config: Config = {
  presets: [tailwindPreset as Config],
  content: [
    './src/**/*.{ts,tsx}',
    // Scan ui package so Tailwind picks up classes used in components
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
