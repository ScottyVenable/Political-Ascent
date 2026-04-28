import { useMemo } from 'react';
import { useWorldStore } from '@/store/worldStore';
import { Card } from '../components/Card';
import { Term } from '../components/tooltip';

/**
 * Map a Row label to its glossary term id. Keeps the label-to-term wiring
 * declarative — adding a new economic indicator only requires extending
 * this map plus an entry in `glossary.ts`.
 */
const ECON_TERMS: Record<string, string> = {
  'GDP Growth': 'gdp',
  Unemployment: 'unemployment',
  Inflation: 'inflation',
  Deficit: 'deficit',
};

/**
 * For each metric, define the direction of "good news". `up` means
 * higher values are improvements (GDP growth, trade surplus). `down`
 * means lower values are improvements (unemployment, deficit).
 *
 * Used to colour the trend chip green/red per metric, so the player
 * does not have to mentally invert the sign for half of them.
 */
const TREND_DIRECTION: Record<string, 'up' | 'down'> = {
  gdpGrowth: 'up',
  unemployment: 'down',
  inflation: 'down',
  deficit: 'down',
  debt: 'down',
  trade: 'up',
  gini: 'down',
};

/**
 * Format a numeric delta with a sign, given a precision. We always
 * show the sign (including `+0.00`) so the chip sits at a stable
 * width on the layout grid.
 */
function formatDelta(delta: number, digits: number): string {
  if (delta > 0) return `+${delta.toFixed(digits)}`;
  if (delta < 0) return delta.toFixed(digits);
  return `±${(0).toFixed(digits)}`;
}

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

  /**
   * Compute deltas between the latest snapshot and a snapshot ~12
   * weeks back (≈ a quarter). When history is too short we fall back
   * to the oldest entry; when there is no history we report null and
   * the UI hides the chips.
   */
  const deltas = useMemo(() => {
    if (history.length < 2) return null;
    const latest = history[history.length - 1].metrics;
    const lookback = history[Math.max(0, history.length - 13)].metrics;
    return {
      gdpGrowth: latest.gdpGrowth - lookback.gdpGrowth,
      unemployment: latest.unemployment - lookback.unemployment,
      inflation: latest.inflation - lookback.inflation,
      deficit: latest.deficit - lookback.deficit,
      debt: latest.debt - lookback.debt,
      trade: latest.trade - lookback.trade,
      gini: latest.gini - lookback.gini,
    };
  }, [history]);

  // Debt-to-GDP is the canonical fiscal pressure ratio. We do not
  // track GDP in dollars yet, so we approximate via a $25T baseline
  // (≈ 2024 US GDP) scaled by recent GDP growth. This is a display
  // aid only — when the engine grows a real GDP value, swap this.
  const approxGdpTrillion = 25 * (1 + (economy.gdpGrowth / 100) * 0.25);
  const debtToGdpPct = (economy.debt / 1000 / approxGdpTrillion) * 100;
  const giniPct = Math.max(0, Math.min(100, economy.gini * 100));

  return (
    <div className="space-y-3" data-testid="economy-panel">
      <div className="grid md:grid-cols-2 gap-3">
        <Card title="Current" accent="blue">
          <ul className="divide-y divide-bg-tertiary text-sm">
            <Row
              label="GDP Growth"
              value={`${economy.gdpGrowth.toFixed(2)}%`}
              delta={deltas ? { value: deltas.gdpGrowth, suffix: 'pp', digits: 2, key: 'gdpGrowth' } : null}
            />
            <Row
              label="Unemployment"
              value={`${economy.unemployment.toFixed(1)}%`}
              delta={deltas ? { value: deltas.unemployment, suffix: 'pp', digits: 1, key: 'unemployment' } : null}
            />
            <Row
              label="Inflation"
              value={`${economy.inflation.toFixed(1)}%`}
              delta={deltas ? { value: deltas.inflation, suffix: 'pp', digits: 1, key: 'inflation' } : null}
            />
            <Row
              label="Deficit"
              value={`$${Math.round(economy.deficit)}B`}
              delta={deltas ? { value: deltas.deficit, suffix: 'B', digits: 0, key: 'deficit' } : null}
            />
            <Row
              label="Debt"
              value={`$${Math.round(economy.debt)}B`}
              delta={deltas ? { value: deltas.debt, suffix: 'B', digits: 0, key: 'debt' } : null}
            />
            <Row
              label="Trade balance"
              value={`$${Math.round(economy.trade)}B`}
              delta={deltas ? { value: deltas.trade, suffix: 'B', digits: 0, key: 'trade' } : null}
            />
            <Row
              label="Gini"
              value={economy.gini.toFixed(2)}
              delta={deltas ? { value: deltas.gini, suffix: '', digits: 2, key: 'gini' } : null}
            />
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

      {/* Fiscal pressure + distribution. Two compact cards beneath
          the main grid that lift derived ratios out of the data: how
          heavy the debt load is relative to output, and how unequal
          the income distribution looks. */}
      <div className="grid md:grid-cols-2 gap-3">
        <Card title="Fiscal pressure" accent="red">
          <div className="space-y-2">
            <RatioMeter
              testId="economy-debt-to-gdp"
              label="Debt-to-GDP (approx.)"
              value={debtToGdpPct}
              max={150}
              suffix="%"
              tone={debtToGdpPct > 100 ? 'danger' : debtToGdpPct > 70 ? 'warning' : 'neutral'}
            />
            <p className="text-xs text-text-muted leading-relaxed">
              Above 100% means total debt now exceeds annual output — historically a
              warning zone for borrowing costs. Calculation is illustrative; a real
              GDP figure will replace the baseline once the engine tracks it.
            </p>
          </div>
        </Card>
        <Card title="Distribution" accent="gold">
          <div className="space-y-2">
            <RatioMeter
              testId="economy-gini"
              label="Gini coefficient"
              value={giniPct}
              max={100}
              suffix=""
              valueDisplay={economy.gini.toFixed(2)}
              tone={economy.gini > 0.45 ? 'warning' : 'neutral'}
            />
            <p className="text-xs text-text-muted leading-relaxed">
              0 = perfect equality, 1 = perfect inequality. US figures sit near 0.40;
              values above 0.50 typically correlate with unrest events firing.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

/**
 * RatioMeter — horizontal bar with a numeric value, used for derived
 * ratios that don't merit a full sparkline.
 */
function RatioMeter({
  label,
  value,
  max,
  suffix,
  valueDisplay,
  tone,
  testId,
}: {
  label: string;
  value: number;
  max: number;
  suffix: string;
  valueDisplay?: string;
  tone: 'danger' | 'warning' | 'neutral';
  testId?: string;
}): JSX.Element {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const barColor =
    tone === 'danger' ? 'bg-accent-red' : tone === 'warning' ? 'bg-accent-gold' : 'bg-accent-blue';
  return (
    <div data-testid={testId}>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-text-secondary">{label}</span>
        <span className="font-mono text-text-primary tabular-nums">
          {valueDisplay ?? value.toFixed(1)}{suffix}
        </span>
      </div>
      <div className="h-2 bg-bg-tertiary rounded-sm overflow-hidden">
        <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta: { value: number; suffix: string; digits: number; key: string } | null;
}): JSX.Element {
  // If we have a glossary term for this label, surface it as a hover
  // affordance — players need to know what each indicator means.
  const term = ECON_TERMS[label];

  // Resolve the delta chip tone using TREND_DIRECTION: a falling
  // unemployment rate is good news, even though the delta is negative.
  let chipClass = 'text-text-muted';
  let arrow = '·';
  if (delta && Math.abs(delta.value) > 0.005) {
    const dir = TREND_DIRECTION[delta.key];
    const goodNews =
      (dir === 'up' && delta.value > 0) || (dir === 'down' && delta.value < 0);
    chipClass = goodNews ? 'text-status-success' : 'text-status-danger';
    arrow = delta.value > 0 ? '\u25B2' : '\u25BC';
  }

  return (
    <li className="flex justify-between items-center py-1.5 gap-2">
      {term ? (
        <Term term={term}>
          <span className="text-text-secondary">{label}</span>
        </Term>
      ) : (
        <span className="text-text-secondary">{label}</span>
      )}
      <div className="flex items-center gap-2">
        {delta && (
          <span
            className={`font-mono text-[0.6875rem] tabular-nums ${chipClass}`}
            title="Change vs ~12 weeks ago"
          >
            {arrow} {formatDelta(delta.value, delta.digits)}{delta.suffix}
          </span>
        )}
        <span className="text-text-primary font-mono tabular-nums">{value}</span>
      </div>
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
