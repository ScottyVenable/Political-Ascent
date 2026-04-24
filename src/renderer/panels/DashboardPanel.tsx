import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useCharacterStore } from '@/store/characterStore';
import { useWorldStore } from '@/store/worldStore';
import { Card } from '../components/Card';
import { Bar } from '../components/Bar';
import { IdeologyCompass } from '../components/IdeologyCompass';

/**
 * Dashboard — top-level overview.
 */
export function DashboardPanel(): JSX.Element {
  const news = useWorldStore((s) => s.news);
  const population = useWorldStore((s) => s.population);
  const economy = useWorldStore((s) => s.economy);
  const pc = useGameStore((s) => s.politicalCapital);
  const ap = useGameStore((s) => s.actionPoints.current);
  const apMax = useGameStore((s) => s.actionPoints.max);

  const char = useCharacterStore((s) => ({ name: s.name, ideology: s.ideology, level: s.level, xp: s.xp }));

  const avgHappiness = useMemo(
    () =>
      population.length > 0
        ? Math.round(population.reduce((a, g) => a + g.happiness, 0) / population.length)
        : 0,
    [population],
  );

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card title="Resources" accent="gold">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-text-muted">Political Capital</div>
            <div className="text-2xl font-headline text-accent-gold">{pc}</div>
          </div>
          <div>
            <div className="text-xs text-text-muted">Action Points</div>
            <div className="text-2xl font-headline text-accent-blue">{ap}/{apMax}</div>
          </div>
          <div>
            <div className="text-xs text-text-muted">Approval (avg)</div>
            <div className="text-2xl font-headline text-text-primary">{avgHappiness}</div>
            <Bar value={avgHappiness} tone={avgHappiness > 55 ? 'success' : avgHappiness < 40 ? 'danger' : 'neutral'} />
          </div>
          <div>
            <div className="text-xs text-text-muted">Level</div>
            <div className="text-2xl font-headline text-text-primary">
              {char.level} <span className="text-xs text-text-muted">({char.xp} XP)</span>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Economy snapshot" accent="blue">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Row label="GDP Growth" value={`${economy.gdpGrowth.toFixed(2)}%`} />
          <Row label="Unemployment" value={`${economy.unemployment.toFixed(1)}%`} />
          <Row label="Inflation" value={`${economy.inflation.toFixed(1)}%`} />
          <Row label="Deficit" value={`$${Math.round(economy.deficit)}B`} />
          <Row label="Debt" value={`$${Math.round(economy.debt)}B`} />
          <Row label="Trade" value={`$${Math.round(economy.trade)}B`} />
        </div>
      </Card>

      <Card title="Ideology">
        <div className="flex gap-4">
          <IdeologyCompass value={char.ideology} size={180} label={false} />
          <div className="text-xs text-text-secondary">
            <p className="italic">"{char.name}"</p>
            <p className="mt-2">x: {char.ideology.x.toFixed(2)}</p>
            <p>y: {char.ideology.y.toFixed(2)}</p>
          </div>
        </div>
      </Card>

      <Card title="Latest news">
        {news.length === 0 ? (
          <p className="text-sm text-text-muted italic">The press is quiet… for now.</p>
        ) : (
          <ul className="space-y-2 max-h-60 overflow-y-auto text-sm">
            {news.slice(-12).reverse().map((n) => (
              <li key={n.id} className="border-l-2 border-bg-tertiary pl-2">
                <div className={`font-headline ${
                  n.severity === 'warning'
                    ? 'text-status-warning'
                    : n.severity === 'danger'
                      ? 'text-status-danger'
                      : 'text-text-primary'
                }`}>
                  {n.headline}
                </div>
                {n.body && <p className="text-xs text-text-secondary mt-0.5">{n.body}</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="flex justify-between border-b border-bg-tertiary/50 py-1">
      <span className="text-text-secondary">{label}</span>
      <span className="text-text-primary font-mono">{value}</span>
    </div>
  );
}
