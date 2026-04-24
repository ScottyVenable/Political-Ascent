import { useMemo, useState } from 'react';
import { useWorldStore } from '@/store/worldStore';
import { Card } from '../components/Card';
import { SeatGrid } from '../components/SeatGrid';

export function CongressPanel(): JSX.Element {
  const congress = useWorldStore((s) => s.congress);
  const [filter, setFilter] = useState<'all' | 'D' | 'R' | 'I'>('all');

  const senate = useMemo(
    () => (filter === 'all' ? congress.senate : congress.senate.filter((l) => l.party === filter)),
    [congress.senate, filter],
  );
  const house = useMemo(
    () => (filter === 'all' ? congress.house : congress.house.filter((l) => l.party === filter)),
    [congress.house, filter],
  );

  const seats = useMemo(() => {
    const count = (chamber: typeof congress.senate): Record<string, number> => ({
      D: chamber.filter((l) => l.party === 'D').length,
      R: chamber.filter((l) => l.party === 'R').length,
      I: chamber.filter((l) => l.party === 'I').length,
    });
    return { senate: count(congress.senate), house: count(congress.house) };
  }, [congress]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['all', 'D', 'R', 'I'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            className={`text-xs px-3 py-1 rounded font-headline ${
              filter === p ? 'bg-accent-gold text-bg-primary' : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'
            }`}
          >
            {p === 'all' ? 'All' : p}
          </button>
        ))}
      </div>

      <Card title="Senate" subtitle={`D ${seats.senate.D} · R ${seats.senate.R} · I ${seats.senate.I}`}>
        <SeatGrid senate={senate} house={[]} chamber="senate" />
      </Card>
      <Card title="House" subtitle={`D ${seats.house.D} · R ${seats.house.R} · I ${seats.house.I}`}>
        <SeatGrid senate={[]} house={house} chamber="house" />
      </Card>
    </div>
  );
}
