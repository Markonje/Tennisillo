import type { Config } from 'tailwindcss';
import tailwindPreset from '@tennisillo/ui/tailwind';

const config: Config = {
  presets: [tailwindPreset as Config],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
