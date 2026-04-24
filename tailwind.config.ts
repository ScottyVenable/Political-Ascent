import type { Config } from 'tailwindcss';

/**
 * Political Ascent — Tailwind theme.
 *
 * Palette source: `docs/reference images/UI-UX/UI Theme - 1.png` (Bloodborne
 * fan-made UI restyle by Jennifer Bertaggia). The game's visual north-star
 * is a dark, institutional, restrained look — gold as the single action
 * accent, a cool muted gray for body text, and deep teal-blacks for panels.
 *
 * Colour tokens retain their previous semantic names (`accent.blue`,
 * `accent.red`, `accent.gold`) so existing components keep compiling, but
 * the underlying hex values have been remapped to the reference palette:
 *
 *   #040605  deepest background (near-black)
 *   #131919  primary background panel
 *   #242F35  elevated / tertiary panel
 *   #1B353F  cool blue-teal (used for informational accents, Democrat seats)
 *   #948161  signature gold (primary action accent)
 *   #989A8F  cool muted gray (body text, secondary labels)
 *
 * Typography: the reference specifies Inria Serif for BOTH titles and body.
 * We keep IBM Plex Mono for technical readouts and expose `font-title` as a
 * semantic alias for the serif so components can self-document intent.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          // Remapped to the reference palette. Keeping the same token names
          // means existing `bg-bg-primary` usages continue to work unchanged.
          primary: '#0B1012', // slightly lifted from #040605 so drop-shadows read
          secondary: '#131919',
          tertiary: '#242F35',
        },
        accent: {
          // `blue` is now the cool teal from the reference (#1B353F). It is
          // darker and more institutional than the old #3B6FE8; it is still
          // used for the Democrat party colour and informational toasts, but
          // it is NEVER the primary action colour — gold is.
          blue: '#1B353F',
          red: '#8C2F2F', // muted from #E83B3B to sit on the same tonal plane
          gold: '#948161',
        },
        text: {
          primary: '#D8D6CC', // warm off-white; pairs with gold without clashing
          secondary: '#989A8F',
          muted: '#5F6158',
        },
        status: {
          success: '#6B8F5A',
          warning: '#C9A84C',
          danger: '#8C2F2F',
        },
      },
      fontFamily: {
        // Inria Serif is the primary face for titles AND body copy per the
        // reference. The `headline` alias stays for backward compatibility.
        title: ['"Inria Serif"', 'Georgia', 'serif'],
        headline: ['"Inria Serif"', 'Georgia', 'serif'],
        body: ['"Inria Serif"', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        flavor: ['"Inria Serif"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
