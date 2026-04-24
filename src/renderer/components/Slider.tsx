/**
 * Slider — styled replacement for the raw `<input type="range">`.
 *
 * Native range inputs render as a wide gray blob that clashes with the
 * rest of the Bloodborne-inspired UI. This component keeps the native
 * input for accessibility (keyboard, screen reader, touch drag) and
 * restyles both track and thumb to match the game-feel palette:
 *
 *   - Track: recessed dark channel (same groove as `Meter`) with a
 *     gold fill from the left edge to the current value.
 *   - Thumb: a 14px diamond rotated 45°, bordered in gold, filled with
 *     background-secondary. On :active it fills with gold and the
 *     whole slider picks up a subtle `shadow-glow-gold`.
 *   - Tick marks: optional evenly-distributed hairlines behind the
 *     track, matching `Meter.segments`.
 *
 * Styling is applied via a scoped stylesheet injected once (Tailwind
 * cannot target the native pseudo-elements `::-webkit-slider-thumb`
 * etc.; we keep the CSS close to the component that owns it rather
 * than spraying it across `styles.css`).
 */
import { memo, useId } from 'react';

export interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  /** Accessible name — required for screen readers. */
  ariaLabel?: string;
  /** Draws `N-1` ticks behind the track. */
  segments?: number;
  disabled?: boolean;
  className?: string;
}

// Inject the slider stylesheet exactly once. A module-level boolean is
// the cheapest way to do this — no provider, no effect. Safe for SSR
// because we guard on `document`.
let styleInjected = false;
function ensureStyle(): void {
  if (styleInjected || typeof document === 'undefined') return;
  styleInjected = true;
  const el = document.createElement('style');
  el.setAttribute('data-pa-slider', 'true');
  el.textContent = SLIDER_CSS;
  document.head.appendChild(el);
}

const SLIDER_CSS = `
.pa-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 24px;
  background: transparent;
  cursor: pointer;
  outline: none;
}
.pa-slider:disabled { cursor: not-allowed; opacity: 0.45; }

/* ── Track ── */
.pa-slider::-webkit-slider-runnable-track {
  height: 8px;
  border-radius: 2px;
  background:
    linear-gradient(to right, var(--pa-accent-gold, #948161) 0%, var(--pa-accent-gold, #948161) var(--pa-fill, 0%), transparent var(--pa-fill, 0%), transparent 100%),
    var(--pa-bg-tertiary, #242F35);
  border: 1px solid var(--pa-rule, rgba(148,129,97,0.18));
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.6);
}
.pa-slider::-moz-range-track {
  height: 8px;
  border-radius: 2px;
  background: var(--pa-bg-tertiary, #242F35);
  border: 1px solid var(--pa-rule, rgba(148,129,97,0.18));
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.6);
}
.pa-slider::-moz-range-progress {
  height: 8px;
  border-radius: 2px 0 0 2px;
  background: var(--pa-accent-gold, #948161);
}

/* ── Thumb ── Diamond shape: a square rotated 45°. ── */
.pa-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  margin-top: -4px; /* centre 14px thumb on 8px track (=(8-14)/2 = -3px, +1 for border) */
  background: var(--pa-bg-secondary, #131919);
  border: 1.5px solid var(--pa-accent-gold, #948161);
  transform: rotate(45deg);
  transition: background 80ms, box-shadow 80ms;
}
.pa-slider:focus-visible::-webkit-slider-thumb,
.pa-slider:active::-webkit-slider-thumb {
  background: var(--pa-accent-gold, #948161);
  box-shadow: 0 0 12px 0 rgba(148,129,97,0.6);
}
.pa-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: var(--pa-bg-secondary, #131919);
  border: 1.5px solid var(--pa-accent-gold, #948161);
  border-radius: 0;
  transform: rotate(45deg);
}
.pa-slider:focus-visible::-moz-range-thumb,
.pa-slider:active::-moz-range-thumb {
  background: var(--pa-accent-gold, #948161);
  box-shadow: 0 0 12px 0 rgba(148,129,97,0.6);
}

.pa-slider-ticks {
  position: absolute;
  left: 0; right: 0; top: 50%;
  transform: translateY(-50%);
  height: 8px;
  display: flex;
  pointer-events: none;
}
.pa-slider-ticks > span {
  flex: 1;
  border-right: 1px solid rgba(11,16,18,0.6);
}
.pa-slider-ticks > span:last-child { border-right: 0; }
`;

function SliderImpl({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  ariaLabel,
  segments,
  disabled,
  className = '',
}: SliderProps): JSX.Element {
  ensureStyle();
  const id = useId();
  // Compute fill percentage for the WebKit track gradient. Firefox uses
  // ::-moz-range-progress natively so it ignores `--pa-fill`.
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;
  return (
    <div className={`relative ${className}`}>
      <input
        id={id}
        type="range"
        className="pa-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ['--pa-fill' as string]: `${pct}%` }}
      />
      {segments && segments > 1 && (
        <div className="pa-slider-ticks" aria-hidden>
          {Array.from({ length: segments }).map((_, i) => (
            <span key={i} />
          ))}
        </div>
      )}
    </div>
  );
}

export const Slider = memo(SliderImpl);
