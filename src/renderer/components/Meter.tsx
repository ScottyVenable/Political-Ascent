/**
 * Meter — the project's custom progress bar / value indicator.
 *
 * Where the existing `Bar` is a minimal two-colour strip (keep for dense
 * tables where every pixel counts), `Meter` is the richer "game-feel"
 * variant used wherever a value deserves weight: approval ratings, bill
 * progress, influence, quest objectives.
 *
 * Visual language (UI_GAME_FEEL_PROPOSAL §6):
 *   - Tall (10px default) with a 1px inner shadow groove, so the track
 *     reads as carved rather than drawn.
 *   - Optional tick marks (`segments`) for "this feels like a unit
 *     readout, not a generic bar" — think HP pips, committee stages.
 *   - Optional threshold caret (`threshold`) for "passing grade at 60%"
 *     style callouts; a thin gold wedge above the bar.
 *   - No CSS transition on the fill when `animate=false` (prevents the
 *     bar from sliding during rapid sim ticks).
 *
 * The component is purely visual — it emits no events and holds no
 * state. Pair it with text elsewhere in the layout; do not cram labels
 * inside the Meter.
 */
import { memo } from 'react';

export type MeterTone = 'gold' | 'success' | 'warning' | 'danger' | 'neutral' | 'blue';

export interface MeterProps {
  /** Current value. Clamped to [0, max]. */
  value: number;
  /** Upper bound. Defaults to 100 (percentage-style). */
  max?: number;
  /** Colour of the filled portion. */
  tone?: MeterTone;
  /** Height in pixels. Default 10. */
  height?: number;
  /**
   * Draw `N-1` tick marks evenly across the track (e.g. segments=5
   * draws 4 ticks). Useful for stage trackers and discrete resources.
   */
  segments?: number;
  /**
   * Value (in the same units as `value`) at which to draw a thin caret
   * above the track. Useful for "pass threshold" indicators.
   */
  threshold?: number;
  /** Animate the fill width transition. Default true. */
  animate?: boolean;
  /** Accessible label read by screen readers. */
  ariaLabel?: string;
  className?: string;
}

// Solid fill class per tone. We use raw Tailwind utility classes (not
// CSS variables) so the JIT scanner emits them.
const TONE_FILL: Record<MeterTone, string> = {
  gold: 'bg-accent-gold',
  blue: 'bg-accent-blue',
  success: 'bg-status-success',
  warning: 'bg-status-warning',
  danger: 'bg-status-danger',
  neutral: 'bg-accent-gold',
};

function MeterImpl({
  value,
  max = 100,
  tone = 'gold',
  height = 10,
  segments,
  threshold,
  animate = true,
  ariaLabel,
  className = '',
}: MeterProps): JSX.Element {
  // Clamp once so the derived pct and threshold-pct both stay in range.
  const clamped = Math.max(0, Math.min(max, value));
  const pct = max === 0 ? 0 : (clamped / max) * 100;
  const thresholdPct =
    threshold !== undefined && max > 0
      ? Math.max(0, Math.min(100, (threshold / max) * 100))
      : null;

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* Threshold caret — a 6px-wide gold wedge pointing down at the
          threshold line. Sits just above the track so it doesn't
          compete visually with the fill. */}
      {thresholdPct !== null && (
        <div
          aria-hidden
          className="absolute -top-[4px] w-0 h-0"
          style={{
            left: `calc(${thresholdPct}% - 3px)`,
            borderLeft: '3px solid transparent',
            borderRight: '3px solid transparent',
            borderTop: '4px solid var(--pa-accent-gold, #948161)',
          }}
        />
      )}

      {/* Track — dark recessed base with a subtle inner shadow so the
          bar reads as a carved channel rather than a flat rectangle. */}
      <div
        className="w-full h-full rounded-sm bg-bg-tertiary overflow-hidden border border-rule"
        style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.6)' }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={clamped}
        aria-label={ariaLabel}
      >
        {/* Fill — transitions width at 300ms with arrive easing. The
            top 1px is a lighter stripe (inset highlight) to suggest a
            lit-from-above surface on the filled portion. */}
        <div
          className={`h-full ${TONE_FILL[tone]} ${animate ? 'transition-[width] duration-300 ease-[cubic-bezier(0,0,0.2,1)]' : ''}`}
          style={{
            width: `${pct}%`,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
          }}
        />
      </div>

      {/* Tick marks — rendered as vertical hairlines overlaying the
          track. Drawn after the fill so they remain visible on both
          filled and unfilled regions. */}
      {segments && segments > 1 && (
        <div
          aria-hidden
          className="absolute inset-0 flex pointer-events-none"
        >
          {Array.from({ length: segments - 1 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 border-r border-bg-primary/60 last:border-r-0"
            />
          ))}
        </div>
      )}
    </div>
  );
}

export const Meter = memo(MeterImpl);
