/**
 * Icon — the centralised SVG icon registry.
 *
 * Every icon in the game ships from this module. Emoji are forbidden in
 * any shipped UI surface (see `docs/guides/ICONS_AND_ASSETS.md`); when a
 * component needs a pictogram it imports the `<Icon />` component and
 * passes an icon id string.
 *
 * All icons are inlined as JSX path strings below. This avoids an HTTP
 * round-trip in the web build, keeps them inline-colourable via
 * `currentColor`, and means the TypeScript compiler checks that every
 * id we reference actually exists (`IconName` union).
 *
 * Icon sources:
 *  - Tabler Icons (MIT). See https://tabler.io/icons. Credited in
 *    `docs/about/CREDITS.md`.
 *
 * When adding a new icon:
 *  1. Copy the `<path>` elements from the source SVG.
 *  2. Add a new entry to `ICONS` below.
 *  3. Add the new id to the `IconName` union (the registry key type
 *     is derived automatically from the `ICONS` object).
 *
 * @module renderer/components/Icon
 */
import type { SVGProps } from 'react';

/**
 * Icon paths are JSX fragments so child SVG elements (multiple <path>s,
 * <circle>, <rect>) can coexist in one entry. The renderer wraps whatever
 * is returned in a single <svg> root.
 */
type IconPath = JSX.Element;

const STROKE_COMMON = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/**
 * Central icon catalogue. Keys are the public icon ids; values are inline
 * JSX rendering the icon's shape. All icons are 24×24 viewBox so the
 * stroke thickness reads consistently at any render size.
 */
const ICONS = {
  // ── Navigation (sidebar) ──────────────────────────────────────
  /** Dashboard — situation room / overview. */
  dashboard: (
    <>
      <path d="M4 13a8 8 0 0 1 16 0" />
      <path d="M12 13l4 -3" />
      <circle cx="12" cy="13" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  /** Legislation — bill / document with a wax seal. */
  legislation: (
    <>
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21H7a2 2 0 0 1 -2 -2V5a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
      <path d="M9 9h1M9 13h6M9 17h6" />
    </>
  ),
  /** Congress — pillars of a capitol. */
  congress: (
    <>
      <path d="M3 21h18" />
      <path d="M3 10h18" />
      <path d="M5 6l7 -3l7 3" />
      <path d="M4 10l0 11" />
      <path d="M20 10l0 11" />
      <path d="M8 14l0 3" />
      <path d="M12 14l0 3" />
      <path d="M16 14l0 3" />
    </>
  ),
  /** Population — group of people. */
  population: (
    <>
      <path d="M9 7a3 3 0 1 0 0 6a3 3 0 0 0 0 -6" />
      <path d="M3 21v-1a5 5 0 0 1 5 -5h2a5 5 0 0 1 5 5v1" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <path d="M21 21v-1a4 4 0 0 0 -3 -3.85" />
    </>
  ),
  /** Economy — a stack of coins. */
  economy: (
    <>
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v6a8 3 0 0 0 16 0V6" />
      <path d="M4 12v6a8 3 0 0 0 16 0v-6" />
    </>
  ),
  /** Quests — a scroll with ribbon. */
  quests: (
    <>
      <path d="M8 4h9a3 3 0 0 1 3 3v10a3 3 0 0 1 -3 3h-10a3 3 0 0 1 -3 -3V7" />
      <path d="M4 7a2 2 0 1 1 4 0v13" />
      <path d="M11 8h6M11 12h6M11 16h4" />
    </>
  ),
  /** Cards — two stacked playing cards. */
  cards: (
    <>
      <rect x="4" y="7" width="12" height="14" rx="2" />
      <path d="M8 3h10a2 2 0 0 1 2 2v12" />
    </>
  ),
  /** Skills — a star / experience burst. */
  skills: (
    <>
      <path d="M12 3l2.5 6l6.5 .75l-5 4.25l1.5 6.5l-5.5 -3.5l-5.5 3.5l1.5 -6.5l-5 -4.25l6.5 -.75z" />
    </>
  ),
  /** Character — a shield silhouette. */
  character: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 6 -6h4a6 6 0 0 1 6 6v1" />
    </>
  ),

  // ── Time controls ─────────────────────────────────────────────
  pause: (
    <>
      <rect x="7" y="5" width="3" height="14" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="14" y="5" width="3" height="14" rx="0.5" fill="currentColor" stroke="none" />
    </>
  ),
  play: (
    <>
      <path
        d="M7 5l12 7l-12 7z"
        fill="currentColor"
        stroke="none"
      />
    </>
  ),
  'fast-forward': (
    <>
      <path d="M4 5l8 7l-8 7z" fill="currentColor" stroke="none" />
      <path d="M12 5l8 7l-8 7z" fill="currentColor" stroke="none" />
    </>
  ),
  blazing: (
    <>
      <path d="M3 5l6 7l-6 7z" fill="currentColor" stroke="none" />
      <path d="M10 5l6 7l-6 7z" fill="currentColor" stroke="none" />
      <path d="M17 5l4 7l-4 7z" fill="currentColor" stroke="none" />
    </>
  ),

  // ── Utility ───────────────────────────────────────────────────
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  flag: (
    <>
      <path d="M5 21V4a1 1 0 0 1 1 -1h10l-2 4l2 4H6" />
    </>
  ),
  alert: (
    <>
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <circle cx="12" cy="12" r="9" />
    </>
  ),
  'chevron-left': (
    <>
      <path d="M15 6l-6 6l6 6" />
    </>
  ),
  'chevron-right': (
    <>
      <path d="M9 6l6 6l-6 6" />
    </>
  ),
  'chevron-up': (
    <>
      <path d="M6 15l6 -6l6 6" />
    </>
  ),
  'chevron-down': (
    <>
      <path d="M6 9l6 6l6 -6" />
    </>
  ),
  check: (
    <>
      <path d="M5 12l5 5l10 -10" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12M6 18L18 6" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  // Tabler "book-2" — open book with a centre rule. Used by the
  // Glossary panel nav entry.
  book: (
    <>
      <path d="M19 4v16H7a2 2 0 0 1 -2 -2V6a2 2 0 0 1 2 -2z" />
      <path d="M19 16H7a2 2 0 0 0 -2 2" />
      <path d="M9 8h6" />
    </>
  ),
  // Tabler "search" — magnifier. Used by the glossary search field.
  search: (
    <>
      <circle cx="10" cy="10" r="6" />
      <path d="M21 21l-6 -6" />
    </>
  ),
  // Tabler "circle" — empty ring. Used to mark incomplete objectives.
  circle: (
    <>
      <circle cx="12" cy="12" r="9" />
    </>
  ),
  // Tabler "trophy" — used to indicate quest rewards.
  trophy: (
    <>
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v6a5 5 0 0 1 -10 0z" />
      <path d="M17 4h3v3a3 3 0 0 1 -3 3" />
      <path d="M7 4h-3v3a3 3 0 0 0 3 3" />
    </>
  ),
  // Tabler "lock" — prerequisites not met.
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  // Tabler "news" — folded newspaper. Used by the Patch Notes panel.
  news: (
    <>
      <path d="M16 6h3a1 1 0 0 1 1 1v11a2 2 0 0 1 -4 0V5a1 1 0 0 0 -1 -1H5a1 1 0 0 0 -1 1v13a2 2 0 0 0 2 2h11" />
      <path d="M8 8h4" />
      <path d="M8 12h4" />
      <path d="M8 16h4" />
    </>
  ),
  // Tabler "x" — used for failed/closed states.
  x: (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
  // Tabler "external-link" — used in context menus for "Open detail".
  'external-link': (
    <>
      <path d="M12 6H6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" />
      <path d="M11 13l9 -9" />
      <path d="M15 4h5v5" />
    </>
  ),
  // Tabler "copy" — used in context menus for "Copy …" actions.
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0 -2 -2H6a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2" />
    </>
  ),
  // Tabler "menu-2" — three horizontal bars. Mobile drawer toggle in
  // the TopBar (`md:hidden`).
  menu: (
    <>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </>
  ),
} as const satisfies Record<string, IconPath>;

/** Public union of every valid icon id. Generated from the registry. */
export type IconName = keyof typeof ICONS;

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  /** Pixel size (width + height). Defaults to 16 so icons sit inline with
   *  text without dominating. Nav glyphs override to 18. */
  size?: number;
  /** Accessible label. When omitted, the icon is marked `aria-hidden` so
   *  screen readers skip it — use that when the adjacent text already
   *  carries the meaning (e.g. "[icon] Dashboard"). */
  title?: string;
  className?: string;
}

/**
 * Renders a single icon by id.
 *
 * The SVG uses `currentColor` for its stroke, so the icon inherits the
 * text colour of its parent. Apply Tailwind colour classes on the
 * wrapping element (e.g. `text-accent-gold`) rather than on the icon.
 *
 * @example
 * <Icon name="legislation" size={18} aria-hidden />
 * <Icon name="alert" title="Urgent event pending" />
 */
export function Icon({
  name,
  size = 16,
  title,
  className = '',
  ...rest
}: IconProps): JSX.Element {
  const labelled = Boolean(title);
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role={labelled ? 'img' : undefined}
      aria-hidden={labelled ? undefined : true}
      className={`inline-block shrink-0 ${className}`}
      {...STROKE_COMMON}
      {...rest}
    >
      {title && <title>{title}</title>}
      {ICONS[name]}
    </svg>
  );
}
