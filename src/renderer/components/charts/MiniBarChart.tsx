/**
 * MiniBarChart — vertical bar chart for compact discrete series.
 *
 * Used wherever a small set of categorical values needs visual
 * comparison (cohort happiness side-by-side, vote tallies by party,
 * etc.). Designed to fit in tooltip-sized footprints.
 *
 * Accepts a list of `{label, value, tone?}` items and renders them as
 * vertical bars with axis labels below. Heights scale to the largest
 * value so the tallest bar always reaches the top of the drawable
 * area.
 *
 * Visual choices:
 *   • Bars are rendered as `<rect>` with rounded top corners (rx=1.5)
 *     for a friendlier silhouette than blunt rectangles.
 *   • A faint baseline rule sits at y=max so the eye registers the
 *     ground without needing a full axis.
 *   • Optional value labels render above each bar in a tabular numeric
 *     font so they line up vertically.
 *
 * @module renderer/components/charts/MiniBarChart
 */
import { memo } from 'react';

/** Tone palette keyed by name; mirrors {@link Sparkline} for consistency. */
const TONE_HEX: Record<MiniBarTone, string> = {
  neutral: '#8b9ab0',
  positive: '#4caf6e',
  negative: '#e05252',
  gold: '#c9a84c',
  blue: '#3b6fe8',
};

/** Built-in tone names. Each item may also pass a literal hex. */
export type MiniBarTone = 'neutral' | 'positive' | 'negative' | 'gold' | 'blue';

export interface MiniBarItem {
  /** Short label displayed beneath the bar (e.g. "D", "R", "I"). */
  label: string;
  /** Numeric value. Negative values render as zero-height bars. */
  value: number;
  /** Optional per-bar tone or hex. */
  tone?: MiniBarTone | `#${string}`;
}

export interface MiniBarChartProps {
  /** Series to render. Empty arrays produce an empty SVG. */
  data: MiniBarItem[];
  /** Pixel width. Default 200. */
  width?: number;
  /** Pixel height (excluding labels). Default 60. */
  height?: number;
  /** Default tone applied when an item omits one. Default 'neutral'. */
  tone?: MiniBarTone | `#${string}`;
  /** Show numeric value above each bar. Default `false`. */
  showValueLabels?: boolean;
  /** Optional aria-label. */
  ariaLabel?: string;
  /** Tailwind className passthrough. */
  className?: string;
}

/** Resolve tone prop → hex. Hexes pass through. */
function resolveColour(tone: MiniBarTone | `#${string}` | undefined, fallback: string): string {
  if (!tone) return fallback;
  if (tone.startsWith('#')) return tone;
  return TONE_HEX[tone as MiniBarTone] ?? fallback;
}

function MiniBarChartImpl({
  data,
  width = 200,
  height = 60,
  tone = 'neutral',
  showValueLabels = false,
  ariaLabel,
  className,
}: MiniBarChartProps): JSX.Element {
  // Empty data → empty SVG. Preserves layout in cards that expect a
  // chart-shaped placeholder while history is still being collected.
  if (data.length === 0) {
    return (
      <svg
        width={width}
        height={height + 16}
        viewBox={`0 0 ${width} ${height + 16}`}
        aria-hidden={ariaLabel ? undefined : true}
        aria-label={ariaLabel}
        className={className}
      />
    );
  }

  const defaultColour = resolveColour(tone, TONE_HEX.neutral);

  // Bar geometry. We split the drawable width into N equal slots and
  // render each bar at 70% of slot width, centred. Min 4px gap between
  // bars enforces visual breathing room on tight charts.
  const slotW = width / data.length;
  const barW = Math.max(2, slotW * 0.7);
  const labelOffset = 12; // reserved space at the bottom for axis labels
  const valueLabelOffset = showValueLabels ? 12 : 0;
  const drawH = height - valueLabelOffset;

  // Scale: largest value → full bar height. Negative/zero values render
  // as zero-height stubs so the layout never breaks.
  const peak = Math.max(...data.map((d) => Math.max(0, d.value)));
  const scale = peak > 0 ? drawH / peak : 0;

  return (
    <svg
      width={width}
      height={height + labelOffset}
      viewBox={`0 0 ${width} ${height + labelOffset}`}
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
      className={className}
    >
      {/* Baseline — single subtle rule at the bottom of the bars area. */}
      <line
        x1={0}
        x2={width}
        y1={drawH + valueLabelOffset}
        y2={drawH + valueLabelOffset}
        stroke="rgba(139, 154, 176, 0.25)"
        strokeWidth={0.5}
      />
      {data.map((d, i) => {
        const v = Math.max(0, d.value);
        const h = v * scale;
        const cx = i * slotW + slotW / 2;
        const x = cx - barW / 2;
        const y = drawH + valueLabelOffset - h;
        const fill = resolveColour(d.tone, defaultColour);
        return (
          <g key={`${d.label}-${i}`}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={1.5}
              ry={1.5}
              fill={fill}
            />
            {showValueLabels && (
              <text
                x={cx}
                y={y - 2}
                textAnchor="middle"
                fontSize={9}
                fill="currentColor"
                className="fill-text-secondary font-mono tabular-nums"
              >
                {d.value}
              </text>
            )}
            <text
              x={cx}
              y={height + labelOffset - 2}
              textAnchor="middle"
              fontSize={10}
              className="fill-text-muted"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Memoised export — see {@link MiniBarChart}. */
export const MiniBarChart = memo(MiniBarChartImpl);
