/**
 * SeatGrid — 535-seat virtualized visualization of Congress.
 *
 * Rendered as a dense grid of coloured dots; hovering a dot reveals the
 * legislator's name, party, and state. Memoized so it only re-renders when
 * the underlying legislator list changes, not on every daily tick.
 */
import { memo, useState } from 'react';
import type { Legislator } from '@/types';

export interface SeatGridProps {
  senate: readonly Legislator[];
  house: readonly Legislator[];
  onSelect?: (legislator: Legislator) => void;
  chamber: 'senate' | 'house' | 'both';
}

const PARTY_COLOR: Record<string, string> = {
  D: 'bg-accent-blue',
  R: 'bg-accent-red',
  I: 'bg-accent-gold',
};

function SeatDot({
  legislator,
  onHover,
  onSelect,
}: {
  legislator: Legislator;
  onHover: (l: Legislator | null) => void;
  onSelect?: (l: Legislator) => void;
}): JSX.Element {
  const cls = PARTY_COLOR[legislator.party] ?? 'bg-text-muted';
  return (
    <button
      type="button"
      aria-label={`${legislator.name} (${legislator.party}-${legislator.state})`}
      onMouseEnter={() => onHover(legislator)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(legislator)}
      onBlur={() => onHover(null)}
      onClick={() => onSelect?.(legislator)}
      className={`w-2.5 h-2.5 rounded-full ${cls} hover:scale-150 hover:ring-2 hover:ring-text-primary transition-transform`}
    />
  );
}

function SeatGridImpl(props: SeatGridProps): JSX.Element {
  const { senate, house, chamber, onSelect } = props;
  const [hover, setHover] = useState<Legislator | null>(null);

  const renderChamber = (list: readonly Legislator[], label: string): JSX.Element => (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <h4 className="font-headline text-sm text-text-secondary">{label}</h4>
        <span className="text-xs text-text-muted">{list.length} seats</span>
      </div>
      <div className="flex flex-wrap gap-[3px]">
        {list.map((l) => (
          <SeatDot key={l.id as unknown as string} legislator={l} onHover={setHover} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 relative">
      {(chamber === 'senate' || chamber === 'both') && renderChamber(senate, 'Senate')}
      {(chamber === 'house' || chamber === 'both') && renderChamber(house, 'House of Representatives')}
      {hover && (
        <div className="sticky bottom-0 text-xs font-mono bg-bg-tertiary rounded p-2 border border-bg-tertiary">
          <span className="text-accent-gold">{hover.name}</span>{' '}
          <span className={hover.party === 'D' ? 'text-accent-blue' : hover.party === 'R' ? 'text-accent-red' : 'text-accent-gold'}>
            ({hover.party}-{hover.state}
            {hover.district !== undefined ? `-${hover.district}` : ''})
          </span>
          <span className="text-text-muted"> · relationship {hover.relationship}</span>
        </div>
      )}
    </div>
  );
}

export const SeatGrid = memo(SeatGridImpl);
