/**
 * IdeologyCompass — interactive or read-only 2-axis political compass.
 *
 * Coordinates are normalized to [-1, +1] on both axes.
 */
import { useCallback, useRef, type MouseEvent } from 'react';
import type { IdeologyPoint } from '@/types';

export interface IdeologyCompassProps {
  value: IdeologyPoint;
  onChange?: (next: IdeologyPoint) => void;
  size?: number;
  label?: boolean;
}

export function IdeologyCompass(props: IdeologyCompassProps): JSX.Element {
  const { value, onChange, size = 240, label = true } = props;
  const ref = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!onChange || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      onChange({
        x: Math.max(-1, Math.min(1, x)),
        y: Math.max(-1, Math.min(1, y)),
      });
    },
    [onChange],
  );

  // Map [-1,+1] to [0%,100%] for CSS placement.
  const leftPct = ((value.x + 1) / 2) * 100;
  const topPct = ((value.y + 1) / 2) * 100;

  return (
    <div className="inline-block">
      <div
        ref={ref}
        role={onChange ? 'button' : 'img'}
        aria-label="Ideology compass"
        onClick={handleClick}
        style={{ width: size, height: size }}
        className={`relative bg-bg-tertiary rounded border border-bg-tertiary select-none ${
          onChange ? 'cursor-crosshair' : ''
        }`}
      >
        {/* Quadrant backgrounds */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          <div className="bg-accent-blue/10" />
          <div className="bg-accent-red/10" />
          <div className="bg-accent-blue/20" />
          <div className="bg-accent-red/20" />
        </div>
        {/* Axes */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-text-muted/40" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-text-muted/40" />
        {/* Marker */}
        <div
          className="absolute w-3 h-3 rounded-full bg-accent-gold ring-2 ring-accent-gold/40 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${leftPct}%`, top: `${topPct}%` }}
        />
      </div>
      {label && (
        <div className="mt-2 text-xs text-text-secondary grid grid-cols-2 gap-x-4 max-w-[240px]">
          <span>← Economic Left</span>
          <span className="text-right">Economic Right →</span>
          <span>↑ Libertarian</span>
          <span className="text-right">Authoritarian ↓</span>
        </div>
      )}
    </div>
  );
}
