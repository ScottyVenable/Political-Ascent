/**
 * IdeologyCompass — interactive 2-axis political compass.
 *
 * Displays the player's ideology on the same coordinate system used by
 * legislators and the seating chart (x = economic axis, y = freedom axis,
 * each in [-1, +1]). The component is two things at once:
 *
 *   1. A *picker* — when `onChange` is supplied, the user can click or drag
 *      anywhere inside the field to set the point. Keyboard arrows nudge it.
 *   2. A *display* — when `onChange` is omitted, it's a static plot of the
 *      player's stance.
 *
 * Visual goals (from the GDD redesign):
 *   - Bigger by default; legibility is the top priority.
 *   - The raw numeric coordinates are NEVER shown — players think in
 *     orientations ("Left-Libertarian"), not in floats.
 *   - A real-time orientation label updates as the marker moves.
 *   - Optional reference-figure ghost markers (FDR, Reagan, Sanders, etc.)
 *     load from `src/data/ideology/reference-figures.json` and tooltip on
 *     hover. They give the player a sense of where their stance sits in
 *     historical context.
 *
 * @module renderer/components/IdeologyCompass
 * @see ideologyLabel
 * @see ../components/Hemicycle (consumes the same axes for seating)
 */
import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { IdeologyPoint } from '@/types';
import { ideologyLabel } from './ideologyLabel';
import figuresData from '@/data/ideology/reference-figures.json';

// ─────────────────────────────────────────────────────────────
// Reference figures
// Loaded once at module evaluation. The JSON file is the single
// source of truth — adding a figure there is enough to plot it.
// ─────────────────────────────────────────────────────────────
interface ReferenceFigure {
  id: string;
  name: string;
  era: string;
  x: number;
  y: number;
}

const REFERENCE_FIGURES: readonly ReferenceFigure[] = (
  figuresData as { figures: ReferenceFigure[] }
).figures;

export interface IdeologyCompassProps {
  /** Current ideology point in normalised [-1, +1] coordinates. */
  value: IdeologyPoint;
  /** When provided, the compass becomes interactive (click + drag + keys). */
  onChange?: (next: IdeologyPoint) => void;
  /** Pixel size of the square plot area. Default 320. */
  size?: number;
  /** Render the axis labels under the compass. Default true. */
  label?: boolean;
  /** Render historical ghost markers. Default true. */
  showReferenceFigures?: boolean;
}

/**
 * IdeologyCompass — see file header for details.
 */
export function IdeologyCompass(props: IdeologyCompassProps): JSX.Element {
  const {
    value,
    onChange,
    size = 320,
    label = true,
    showReferenceFigures = true,
  } = props;

  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hoverFigureId, setHoverFigureId] = useState<string | null>(null);

  const interactive = !!onChange;

  // Derive coordinates from a pointer position relative to the plot box.
  const pointToValue = useCallback((clientX: number, clientY: number): IdeologyPoint | null => {
    if (!ref.current) return null;
    const rect = ref.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((clientY - rect.top) / rect.height) * 2 - 1;
    return {
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
    };
  }, []);

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!onChange) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging(true);
      const next = pointToValue(e.clientX, e.clientY);
      if (next) onChange(next);
    },
    [onChange, pointToValue],
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!onChange || !dragging) return;
      const next = pointToValue(e.clientX, e.clientY);
      if (next) onChange(next);
    },
    [onChange, dragging, pointToValue],
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!onChange) return;
      e.currentTarget.releasePointerCapture(e.pointerId);
      setDragging(false);
    },
    [onChange],
  );

  // Keyboard accessibility: arrow keys nudge by 5% per press, shift = 15%.
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (!onChange) return;
      const step = e.shiftKey ? 0.15 : 0.05;
      let dx = 0;
      let dy = 0;
      switch (e.key) {
        case 'ArrowLeft':  dx = -step; break;
        case 'ArrowRight': dx =  step; break;
        case 'ArrowUp':    dy = -step; break;
        case 'ArrowDown':  dy =  step; break;
        default: return;
      }
      e.preventDefault();
      onChange({
        x: Math.max(-1, Math.min(1, value.x + dx)),
        y: Math.max(-1, Math.min(1, value.y + dy)),
      });
    },
    [onChange, value],
  );

  // Map [-1, +1] → [0, 100] for CSS percentage placement.
  const toPct = (n: number): number => ((n + 1) / 2) * 100;
  const leftPct = toPct(value.x);
  const topPct = toPct(value.y);

  const orientation = ideologyLabel(value);
  const hoveredFigure = hoverFigureId
    ? REFERENCE_FIGURES.find((f) => f.id === hoverFigureId) ?? null
    : null;

  return (
    <div className="inline-block">
      <div
        ref={ref}
        // 2D compass: a single `slider` role would require scalar
        // aria-valuenow/min/max which don't model two axes. WAI-ARIA's
        // recommendation for 2D, keyboard-driven custom widgets is
        // `application`, which tells assistive tech the page handles
        // arrow-key navigation. We keep `img` for the read-only case.
        role={interactive ? 'application' : 'img'}
        tabIndex={interactive ? 0 : -1}
        aria-label={
          interactive
            ? `Ideology compass — ${orientation}. Use arrow keys to adjust.`
            : `Ideology compass — ${orientation}`
        }
        aria-valuetext={orientation}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onKeyDown={handleKeyDown}
        style={{ width: size, height: size }}
        className={`relative bg-bg-tertiary rounded border border-bg-tertiary select-none touch-none ${
          interactive ? 'cursor-crosshair focus:outline focus:outline-2 focus:outline-accent-gold' : ''
        }`}
        data-testid="ideology-compass"
      >
        {/* Quadrant tints — economic-left in cool blue, economic-right in warm red. */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none">
          <div className="bg-accent-blue/10" />
          <div className="bg-accent-red/10" />
          <div className="bg-accent-blue/20" />
          <div className="bg-accent-red/20" />
        </div>

        {/* Quadrant labels — small, inset, low contrast so they don't fight the marker. */}
        <div className="absolute inset-0 pointer-events-none text-[10px] uppercase tracking-wider text-text-muted/70 font-headline">
          <span className="absolute top-1.5 left-1.5">Lib-Left</span>
          <span className="absolute top-1.5 right-1.5">Lib-Right</span>
          <span className="absolute bottom-1.5 left-1.5">Auth-Left</span>
          <span className="absolute bottom-1.5 right-1.5">Auth-Right</span>
        </div>

        {/* Centre cross-hairs */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-text-muted/40 pointer-events-none" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-text-muted/40 pointer-events-none" />

        {/* Reference-figure ghost markers */}
        {showReferenceFigures &&
          REFERENCE_FIGURES.map((fig) => (
            <button
              key={fig.id}
              type="button"
              tabIndex={-1}
              onMouseEnter={() => setHoverFigureId(fig.id)}
              onMouseLeave={() => setHoverFigureId((cur) => (cur === fig.id ? null : cur))}
              onFocus={() => setHoverFigureId(fig.id)}
              onBlur={() => setHoverFigureId((cur) => (cur === fig.id ? null : cur))}
              className="absolute w-2 h-2 rounded-full bg-text-muted/70 ring-1 ring-bg-primary -translate-x-1/2 -translate-y-1/2 hover:bg-accent-gold hover:scale-150 transition-transform"
              style={{ left: `${toPct(fig.x)}%`, top: `${toPct(fig.y)}%` }}
              aria-label={`${fig.name} — ${fig.era}`}
              data-testid={`ref-figure-${fig.id}`}
            />
          ))}

        {/* Player marker — drawn last so it's always on top. */}
        <div
          className="absolute w-4 h-4 rounded-full bg-accent-gold ring-2 ring-accent-gold/50 -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-lg"
          style={{ left: `${leftPct}%`, top: `${topPct}%` }}
          data-testid="ideology-marker"
        />

        {/* Hover tooltip for a reference figure */}
        {hoveredFigure && (
          <div
            className="absolute z-10 px-2 py-1 rounded bg-bg-primary border border-accent-gold/40 text-xs whitespace-nowrap pointer-events-none -translate-x-1/2 -translate-y-full"
            style={{
              left: `${toPct(hoveredFigure.x)}%`,
              top: `calc(${toPct(hoveredFigure.y)}% - 10px)`,
            }}
            role="tooltip"
          >
            <div className="font-headline text-accent-gold">{hoveredFigure.name}</div>
            <div className="text-text-muted">{hoveredFigure.era}</div>
          </div>
        )}
      </div>

      {/* Live orientation readout — gated behind `label` so compact call
          sites (DashboardPanel mini-compass) don't render redundant
          text below the puck. The dashboard already shows the player's
          ideology in a separate identity card. */}
      {label && (
        <div
          className="mt-2 text-sm font-headline text-accent-gold text-center"
          data-testid="ideology-orientation"
          aria-live="polite"
        >
          {orientation}
        </div>
      )}

      {label && (
        <div
          className="mt-1 text-xs text-text-secondary grid grid-cols-2 gap-x-4"
          style={{ width: size }}
        >
          <span>← Economic Left</span>
          <span className="text-right">Economic Right →</span>
          <span>↑ Libertarian</span>
          <span className="text-right">Authoritarian ↓</span>
        </div>
      )}
    </div>
  );
}
