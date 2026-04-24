/**
 * ResourcePips — a row of tiny squares representing a bounded resource.
 *
 * Used for Action Points and other small, integer, bounded pools where
 * seeing "3 of 5 filled" reads faster than reading digits. The style is
 * deliberately discrete (gaps between pips) to signal "this is a
 * countable, spendable resource" rather than a continuous bar.
 *
 * Visual language (UI_GAME_FEEL_PROPOSAL §7.3):
 *   - 8px squares, 4px gap, sharp corners (`rounded-[1px]`).
 *   - Filled pips use the tone colour; empty pips use the tertiary bg
 *     with a hairline of rule colour so they still read as slots.
 *   - The most recently filled pip briefly flashes (`pip-flash` keyframe)
 *     — see `styles.css`. Controlled by a numeric `flashIndex` prop; the
 *     caller (store subscription) is responsible for bumping it when a
 *     new pip is added so the flash triggers.
 */
import { memo } from 'react';

export interface ResourcePipsProps {
  /** Number of filled pips. Clamped to `[0, max]`. */
  value: number;
  /** Total number of pips rendered. */
  max: number;
  /** Colour tone of the filled pip. Gold is the default "political" resource. */
  tone?: 'gold' | 'blue' | 'red';
  /** Size of each pip in pixels. Defaults to 8 (matches the top-bar scale). */
  size?: number;
  /** Accessible label prefix, e.g. "Action Points". */
  label?: string;
  className?: string;
}

const TONE_FILLED: Record<NonNullable<ResourcePipsProps['tone']>, string> = {
  gold: 'bg-accent-gold',
  blue: 'bg-accent-blue',
  red: 'bg-accent-red',
};

function ResourcePipsImpl({
  value,
  max,
  tone = 'gold',
  size = 8,
  label,
  className = '',
}: ResourcePipsProps): JSX.Element {
  // Clamp defensively — the store may briefly expose a transient value > max
  // during a mutation (e.g. an over-refund). Rendering more pips than `max`
  // would shift the whole top bar; silently clamping is the right call.
  const filled = Math.max(0, Math.min(max, value));
  const fillCls = TONE_FILLED[tone];
  const pipStyle = { width: size, height: size };

  return (
    <div
      className={`inline-flex items-center gap-1 ${className}`}
      role="meter"
      aria-valuenow={filled}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label ? `${label}: ${filled} of ${max}` : undefined}
    >
      {Array.from({ length: max }, (_, i) => {
        const isFilled = i < filled;
        return (
          <span
            key={i}
            style={pipStyle}
            className={
              'rounded-[1px] transition-colors duration-instant ' +
              (isFilled
                ? `${fillCls}`
                : 'bg-bg-tertiary border border-rule')
            }
          />
        );
      })}
    </div>
  );
}

export const ResourcePips = memo(ResourcePipsImpl);
