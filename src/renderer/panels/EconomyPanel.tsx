import { useMemo } from 'react';
import { useWorldStore } from '@/store/worldStore';
import { Card } from '../components/Card';

/**
 * EconomyPanel — snapshot + sparkline of GDP/unemployment/inflation.
 *
 * Uses inline SVG rather than a charting library to keep the bundle tight.
 */
export function EconomyPanel(): JSX.Element {
  const economy = useWorldStore((s) => s.economy);
  const history = economy.history;

  const series = useMemo(() => {
    const gdp = history.map((h) => h.metrics.gdpGrowth);
    const unemp = history.map((h) => h.metrics.unemployment);
    const infl = history.map((h) => h.metrics.inflation);
    return { gdp, unemp, infl };
  }, [history]);

  return (
    <div className="grid md:grid-cols-2 gap-3">
      <Card title="Current" accent="blue">
        <ul className="divide-y divide-bg-tertiary text-sm">
          <Row label="GDP Growth" value={`${economy.gdpGrowth.toFixed(2)}%`} />
          <Row label="Unemployment" value={`${economy.unemployment.toFixed(1)}%`} />
          <Row label="Inflation" value={`${economy.inflation.toFixed(1)}%`} />
          <Row label="Deficit" value={`$${Math.round(economy.deficit)}B`} />
          <Row label="Debt" value={`$${Math.round(economy.debt)}B`} />
          <Row label="Trade balance" value={`$${Math.round(economy.trade)}B`} />
          <Row label="Gini" value={economy.gini.toFixed(2)} />
        </ul>
      </Card>
      <Card title="Trends (monthly)" accent="gold">
        {history.length === 0 ? (
          <p className="text-sm text-text-muted italic">
            No history yet — a few months need to pass before trends appear.
          </p>
        ) : (
          <div className="space-y-4">
            <Sparkline label="GDP Growth (%)" color="#3B6FE8" data={series.gdp} />
            <Sparkline label="Unemployment (%)" color="#E74C3C" data={series.unemp} />
            <Sparkline label="Inflation (%)" color="#C9A84C" data={series.infl} />
          </div>
        )}
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <li className="flex justify-between py-1.5">
      <span className="text-text-secondary">{label}</span>
      <span className="text-text-primary font-mono">{value}</span>
    </li>
  );
}

function Sparkline({ label, color, data }: { label: string; color: string; data: number[] }): JSX.Element {
  if (data.length === 0) return <div className="text-xs text-text-muted">{label}: no data</div>;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / Math.max(1, data.length - 1)) * 100;
      const y = 100 - ((v - min) / range) * 100;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-text-secondary">{label}</span>
        <span className="font-mono text-text-muted">
          min {min.toFixed(2)} · max {max.toFixed(2)}
        </span>
      </div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-16 bg-bg-tertiary rounded">
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.2" />
      </svg>
    </div>
  );
}
