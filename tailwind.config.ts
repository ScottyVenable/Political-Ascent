import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0F1117',
          secondary: '#1A1D27',
          tertiary: '#242836',
        },
        accent: {
          blue: '#3B6FE8',
          red: '#E83B3B',
          gold: '#C9A84C',
        },
        text: {
          primary: '#E8E8EC',
          secondary: '#8A8D9A',
          muted: '#5B5E6B',
        },
        status: {
          success: '#2ECC71',
          warning: '#F39C12',
          danger: '#E74C3C',
        },
      },
      fontFamily: {
        headline: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        flavor: ['Merriweather', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
