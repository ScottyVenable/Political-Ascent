/**
 * Sparkline — a tone-aware inline SVG line chart.
 *
 * This is the canonical sparkline used by Economy "Trends" rows, the
 * Dashboard KPI tooltips (todo#46), and any future place that wants a
 * compact "shape of recent history" indicator. Two earlier copies in
 * `EconomyPanel.tsx` and `DashboardPanel.tsx` were unified into this
 * file as part of todo#66 (graph renderer polish).
 *
 * Visual upgrades vs. the originals:
 *   • Optional area fill below the line, drawn at 18% opacity of the
 *     stroke colour. Helps the eye gauge cumulative trend at a glance.
 *   • Optional baseline tick at the data minimum (subtle dashed line).
 *   • Optional `lastDot` (default true) — places a small filled circle
 *     at the most recent value so the "current" reading stands out.
 *   • Tone palette uses Tailwind tokens by name; callers pass either a
 *     semantic tone ('positive' | 'negative' | 'neutral' | 'gold' |
 *     'blue' | 'red') or a literal hex string.
 *
 * @module renderer/components/charts/Sparkline
 */
import { memo, useId } from 'react';

/** Colour palette keyed by semantic tone. Hex values match Tailwind tokens. */
const TONE_HEX: Record<SparklineTone, string> = {
  positive: '#4caf6e', // status-success
  negative: '#e05252', // status-danger
  neutral: '#8b9ab0',  // text-muted-ish
  gold: '#c9a84c',     // accent-gold
  blue: '#3b6fe8',     // accent-blue
  red: '#e74c3c',      // accent-red (legacy economy tone)
};

/** Built-in tone names. Also accepts a literal `#rrggbb` hex string. */
export type SparklineTone =
  | 'positive'
  | 'negative'
  | 'neutral'
  | 'gold'
  | 'blue'
  | 'red';

export interface SparklineProps {
  /** Data points, oldest → newest. Empty arrays render an empty SVG. */
  values: number[];
  /** Tone name (palette token) OR a literal hex colour like `#3b6fe8`. */
  tone?: SparklineTone | `#${string}`;
  /** Pixel width of the rendered SVG. Default 160. */
  width?: number;
  /** Pixel height of the rendered SVG. Default 40. */
  height?: number;
  /** Inner padding so the line never touches the SVG edge. Default 4. */
  padding?: number;
  /**
   * Draw a subtle area fill below the line. Default `true` — matches
   * the polished look used by EconomyPanel; pass `false` for the very
   * compact tooltip variant.
   */
  area?: boolean;
  /** Place a filled dot at the latest value. Default `true`. */
  lastDot?: boolean;
  /**
   * SVG `preserveAspectRatio`. Default `xMidYMid meet`. Pass `'none'`
   * for sparklines that need to stretch to a CSS-driven container
   * width (the EconomyPanel trend rows do this).
   */
  preserveAspectRatio?: 'xMidYMid meet' | 'none';
  /**
   * When true, the SVG omits its `width`/`height` HTML attributes so a
   * Tailwind `w-full`/`h-N` className can size it via CSS. Default
   * `false` (the SVG renders at its `width`/`height` props).
   */
  responsive?: boolean;
  /** Optional aria-label; sparklines are decorative by default. */
  ariaLabel?: string;
  /** Tailwind className passthrough. */
  className?: string;
}

/**
 * Resolve a tone prop to a hex string. Literal `#rrggbb` values pass
 * through; named tones are looked up in {@link TONE_HEX}.
 */
function resolveColour(tone: SparklineProps['tone']): string {
  if (!tone) return TONE_HEX.neutral;
  if (tone.startsWith('#')) return tone;
  return TONE_HEX[tone as SparklineTone] ?? TONE_HEX.neutral;
}

function SparklineImpl({
  values,
  tone = 'neutral',
  width = 160,
  height = 40,
  padding = 4,
  area = true,
  lastDot = true,
  preserveAspectRatio = 'xMidYMid meet',
  responsive = false,
  ariaLabel,
  className,
}: SparklineProps): JSX.Element {
  // The gradient id must be unique across multiple sparklines on the
  // same page; useId() gives us a stable, collision-free token. Called
  // unconditionally (rules-of-hooks) before any early return.
  const gradId = useId().replace(/[:]/g, '-') + '-spark';

  // ─── Empty-state guard ────────────────────────────────────────────
  // Empty arrays would crash Math.min(...[]) (returns Infinity) and
  // produce NaN points. Render an empty SVG so layout is preserved.
  if (values.length === 0) {
    return (
      <svg
        {...(responsive ? {} : { width, height })}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio={preserveAspectRatio}
        aria-hidden={ariaLabel ? undefined : true}
        aria-label={ariaLabel}
        className={className}
      />
    );
  }

  const stroke = resolveColour(tone);

  // Compute min/max across the series. Range guards against the
  // all-equal case which would otherwise divide by zero.
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  // Project each value into the drawable inner rect. SVG's y-axis
  // grows downward, so we invert.
  const pts = values.map((v, i) => {
    const x = padding + (i / Math.max(values.length - 1, 1)) * (width - padding * 2);
    const y = padding + (1 - (v - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const linePoints = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Area path: same line, then drop to the bottom edge and close.
  // Used for the optional fill underneath.
  const bottomY = height - padding;
  const areaPath =
    `M ${pts[0]!.x.toFixed(1)},${bottomY.toFixed(1)} ` +
    pts.map((p) => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
    ` L ${pts[pts.length - 1]!.x.toFixed(1)},${bottomY.toFixed(1)} Z`;

  const last = pts[pts.length - 1]!;

  return (
    <svg
      {...(responsive ? {} : { width, height })}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio={preserveAspectRatio}
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
      className={className}
    >
      {area && (
        <>
          {/* Vertical gradient: stroke colour at top fading to transparent
              at the bottom. Anchored to userSpaceOnUse so it is not
              re-stretched per-element. */}
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.32" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gradId})`} stroke="none" />
        </>
      )}
      <polyline
        points={linePoints}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {lastDot && <circle cx={last.x} cy={last.y} r={2.5} fill={stroke} />}
    </svg>
  );
}

/**
 * Memoised export. Sparklines often live inside lists where the parent
 * re-renders frequently; memoisation prevents needless reflow when the
 * `values` array reference is stable.
 */
export const Sparkline = memo(SparklineImpl);
