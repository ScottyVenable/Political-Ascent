/**
 * Hemicycle — semi-circular seating chart for a legislative chamber.
 *
 * Political Ascent previously rendered Congress as a dense flat grid of
 * coloured dots. That read accurately but not *geographically* — no one
 * looks at a chamber and sees a wall of pixels. Real legislative bodies
 * arrange their seats in a half-disc fanning out from the presiding
 * officer. This component reproduces that layout so the player reads
 * the chamber as a room, not a table.
 *
 * ## Layout algorithm
 * Parliament-arc packing (same family as d3-parliament):
 *
 *  1. Given `n` seats, choose `rows = ceil(sqrt(n / π * 2))` as a
 *     starting guess. This yields ~4 rows for a 100-seat Senate and
 *     ~10 rows for a 435-seat House, which matches both historic
 *     floor plans.
 *  2. Each row `k ∈ [0, rows)` sits on an arc of radius
 *     `R_k = innerR + k * rowGap`. The arc spans π radians (180°) from
 *     left to right.
 *  3. Each row's seat *capacity* is proportional to its radius:
 *     `cap_k = floor(π * R_k / seatSpacing)`.
 *  4. Distribute the n seats across rows proportional to capacity,
 *     rounding so the total equals n. Outermost rows fill first
 *     (matches photos of real chambers — front row is smaller).
 *  5. For each row, lay seats at evenly-spaced angles along the arc.
 *     `θ = π - j * (π / (seatsInRow - 1))` → left side first.
 *
 * ## Ordering
 * Seats are sorted left-to-right by `ideology.x` (economic left →
 * right). This both respects the real-world convention ("the left"
 * and "the right" *come from* where parties sat in the 1789 French
 * National Assembly) and lets the player eyeball coalitions at a
 * glance.
 *
 * ## Interaction
 * Click a seat to emit `onSelect(legislator)`. Hovering highlights the
 * seat with a gold ring; the parent is responsible for any tooltip.
 *
 * @module renderer/components/Hemicycle
 */
import { memo, useMemo } from 'react';
import type { Legislator } from '@/types';

export interface HemicycleProps {
  legislators: readonly Legislator[];
  /** Total width of the rendered chart in pixels. Height = width/2. */
  width?: number;
  /** Called when a seat is clicked. */
  onSelect?: (l: Legislator) => void;
  /** Currently highlighted legislator id, if any. */
  highlightId?: string;
  /** Hover callback with client-space cursor coordinates (for floating tooltip). */
  onHoverPos?: (l: Legislator | null, x: number, y: number) => void;
  /**
   * Set of legislator ids that should be dimmed (reduced opacity) in the
   * chart. Seats not in this set remain fully opaque. Used by the member
   * list search/filter to de-emphasise non-matching members without hiding
   * them entirely — matching the GDD §14 "context without clutter" goal.
   * When the set is empty or undefined, all seats are fully opaque.
   */
  dimmedIds?: ReadonlySet<string>;
  className?: string;
}

const PARTY_FILL: Record<string, string> = {
  D: '#5A7A8A', // muted steel-blue
  R: '#A85958', // muted brick
  I: '#948161', // theme gold
};

const PARTY_STROKE: Record<string, string> = {
  D: '#3E5C6B',
  R: '#7D3E3E',
  I: '#6B5B42',
};

interface SeatPosition {
  x: number;
  y: number;
  r: number;
  legislator: Legislator;
}

/**
 * Layout helper — pure, exported for unit testing.
 *
 * Produces one `SeatPosition` per legislator, ordered by ideology. The
 * SVG coordinate system places (0, 0) at the top-left corner of a
 * `width × (width/2 + padding)` viewport, with the hemicycle opening
 * upward.
 */
export function layoutHemicycle(
  legislators: readonly Legislator[],
  width: number,
): { seats: SeatPosition[]; viewHeight: number; seatR: number } {
  const n = legislators.length;
  if (n === 0) return { seats: [], viewHeight: width / 2, seatR: 4 };

  // Origin: bottom-centre of the SVG (the speaker's bench).
  const cx = width / 2;
  const cy = width / 2; // radius of the arc equals half the width

  // Tune rows so the arc looks roughly square when drawn. For 100
  // seats 4 rows work well; for 435 we need ~10. sqrt is a
  // well-behaved heuristic here.
  const rows = Math.max(3, Math.round(Math.sqrt(n / 3.2)));
  const innerRFrac = 0.45; // innermost row as a fraction of cy
  const outerRFrac = 0.95;
  const rowGap = (outerRFrac - innerRFrac) / Math.max(1, rows - 1);

  // Compute each row's circumference-based capacity (half-circle).
  // seatSpacing is picked such that outer row seats don't touch.
  const radii: number[] = [];
  for (let k = 0; k < rows; k++) radii.push((innerRFrac + k * rowGap) * cy);
  const caps = radii.map((r) => Math.floor((Math.PI * r) / 10));
  const capTotal = caps.reduce((a, b) => a + b, 0);

  // Proportional distribution with Hamilton remainder method to ensure
  // the total exactly equals n.
  const raw = caps.map((c) => (c / capTotal) * n);
  const base = raw.map((x) => Math.floor(x));
  let placed = base.reduce((a, b) => a + b, 0);
  const remainders = raw
    .map((x, i) => ({ i, rem: x - Math.floor(x) }))
    .sort((a, b) => b.rem - a.rem);
  let ri = 0;
  while (placed < n) {
    base[remainders[ri % rows]!.i]! += 1;
    placed++;
    ri++;
  }
  const seatsPerRow = base;

  // Seat radius grows slightly for smaller chambers so Senate reads
  // chunkier than House without swamping detail.
  const seatR = n <= 120 ? 7 : n <= 250 ? 5 : 4;

  // Sort legislators by ideology.x so seating respects left/right.
  // Stable secondary by relationship so adjacent seats within the same
  // party cluster by most-allied inward (cosmetic only).
  const ordered = [...legislators].sort((a, b) => {
    const dx = a.ideology.x - b.ideology.x;
    if (dx !== 0) return dx;
    return b.relationship - a.relationship;
  });

  // Phase 1 — compute all (x, y) positions without legislators. We
  // fill rows outer-first so the smallest row sits at the front.
  // Within a row, angle θ runs π (left) → 0 (right).
  const positions: { x: number; y: number }[] = [];
  for (let k = rows - 1; k >= 0; k--) {
    const count = seatsPerRow[k] ?? 0;
    const r = radii[k] ?? 0;
    for (let j = 0; j < count; j++) {
      const theta =
        count === 1 ? Math.PI / 2 : Math.PI - j * (Math.PI / (count - 1));
      positions.push({ x: cx + r * Math.cos(theta), y: cy - r * Math.sin(theta) });
    }
  }

  // Phase 2 — sort the positions left-to-right (ascending x, then y
  // for the tie-break so a consistent order is produced for seats
  // that share an x coordinate across rows). Assign `ordered[i]` to
  // `sortedPositions[i]`: the leftmost physical seat receives the
  // most-left-wing legislator, the rightmost gets the most-right.
  const sortedPositions = positions
    .map((p, idx) => ({ ...p, idx }))
    .sort((a, b) => (a.x - b.x) || (a.y - b.y));

  const seats: SeatPosition[] = sortedPositions.map((p, i) => ({
    x: p.x,
    y: p.y,
    r: seatR,
    legislator: ordered[i]!,
  }));

  // viewHeight adds seatR + small padding so circles on the outer arc
  // aren't clipped.
  const viewHeight = cy + seatR + 2;
  return { seats, viewHeight, seatR };
}

function HemicycleImpl({
  legislators,
  width = 520,
  onSelect,
  onHoverPos,
  highlightId,
  dimmedIds,
  className = '',
}: HemicycleProps): JSX.Element {
  const { seats, viewHeight } = useMemo(
    () => layoutHemicycle(legislators, width),
    [legislators, width],
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${viewHeight}`}
      className={`w-full h-auto ${className}`}
      role="img"
      aria-label={`${legislators.length}-seat chamber hemicycle`}
    >
      {seats.map((s) => {
        const party = s.legislator.party;
        const fill = PARTY_FILL[party] ?? '#5F6158';
        const stroke = PARTY_STROKE[party] ?? '#3A3B36';
        const isHighlighted = highlightId === (s.legislator.id as unknown as string);
        const isDimmed = dimmedIds !== undefined && dimmedIds.size > 0 &&
          dimmedIds.has(s.legislator.id as unknown as string);
        return (
          <circle
            key={s.legislator.id as unknown as string}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill={fill}
            stroke={isHighlighted ? '#D8D6CC' : stroke}
            strokeWidth={isHighlighted ? 1.5 : 0.5}
            opacity={isDimmed ? 0.18 : 1}
            style={{ cursor: onSelect ? 'pointer' : 'default', transition: 'opacity 0.15s' }}
            onClick={onSelect ? () => onSelect(s.legislator) : undefined}
            onMouseEnter={
              onHoverPos
                ? (e) => onHoverPos(s.legislator, e.clientX, e.clientY)
                : undefined
            }
            onMouseLeave={onHoverPos ? (e) => onHoverPos(null, e.clientX, e.clientY) : undefined}
          >
            <title>
              {s.legislator.name} ({party}-{s.legislator.state}
              {s.legislator.district !== undefined ? `-${s.legislator.district}` : ''})
            </title>
          </circle>
        );
      })}
    </svg>
  );
}

export const Hemicycle = memo(HemicycleImpl);
