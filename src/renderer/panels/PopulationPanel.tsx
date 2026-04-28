/**
 * PopulationPanel — voter-bloc dashboard with focus pages.
 *
 * The grid view (this file's default render) gives a heat-map style
 * overview of every group: name, size, mood bars, basic chips. Clicking
 * a card opens `<GroupFocusModal />`, a wider detail page with bigger
 * charts, full tag chips, ideological positioning, and a placeholder
 * for group-targeted player actions (cards, AP spend) that will land
 * in a follow-up.
 *
 * Closes docs/todo.md item 31.
 *
 * @module renderer/panels/PopulationPanel
 */
import { useEffect, useState } from 'react';
import { useWorldStore } from '@/store/worldStore';
import { Card } from '../components/Card';
import { Bar } from '../components/Bar';
import { Button } from '../components/Button';
import { Term } from '../components/tooltip';
import type { PopulationGroup } from '@/types';

export function PopulationPanel(): JSX.Element {
  const population = useWorldStore((s) => s.population);
  const [focusId, setFocusId] = useState<string | null>(null);
  const focused = population.find((g) => g.id === focusId) ?? null;

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-3" data-testid="population-grid">
        {population.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setFocusId(g.id)}
            data-testid="population-group-card"
            data-group-id={g.id}
            className="text-left rounded-md focus:outline-none focus:ring-2 focus:ring-accent-gold transition-shadow"
            aria-label={`Open detail for ${g.name}`}
          >
            <Card title={g.name} subtitle={`${g.size}% of population \u00b7 click for detail`}>
              <div className="space-y-2">
                <Bar
                  label={<Term term="happiness"><span>Happiness</span></Term>}
                  value={g.happiness}
                  valueLabel={`${Math.round(g.happiness)}`}
                  tone={g.happiness > 55 ? 'success' : g.happiness < 40 ? 'danger' : 'neutral'}
                />
                <Bar
                  label={<Term term="radicalism"><span>Radicalism</span></Term>}
                  value={g.radicalism}
                  valueLabel={`${Math.round(g.radicalism)}`}
                  tone={g.radicalism > 50 ? 'warning' : 'neutral'}
                />
                <Bar
                  label={<Term term="activism"><span>Activism</span></Term>}
                  value={g.activism}
                  valueLabel={`${Math.round(g.activism)}`}
                />
                <div className="flex justify-between text-xs text-text-muted pt-1">
                  <span>Income index: {g.income}</span>
                  <span>Loyalty: {g.loyalty}</span>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {g.tags.map((t) => (
                    <span key={t} className="text-xs bg-bg-tertiary rounded px-2 py-0.5 text-text-muted">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          </button>
        ))}
      </div>

      {focused && (
        <GroupFocusModal group={focused} onClose={() => setFocusId(null)} />
      )}
    </div>
  );
}

/**
 * Map a -1..1 ideology bias onto a percent for a horizontal track.
 * 0 sits at 50%; +1 (right) at 100%; -1 (left) at 0%.
 */
function ideologyToPercent(bias: number): number {
  return Math.max(0, Math.min(100, ((bias + 1) / 2) * 100));
}

/**
 * Shared tone resolver \u2014 keeps modal Bar tones consistent with the
 * grid cards above, so the visual language doesn't drift.
 */
function moodTone(value: number, mode: 'happiness' | 'radicalism'): 'success' | 'danger' | 'warning' | 'neutral' {
  if (mode === 'happiness') {
    if (value > 55) return 'success';
    if (value < 40) return 'danger';
    return 'neutral';
  }
  return value > 50 ? 'warning' : 'neutral';
}

/**
 * Group focus modal \u2014 full-page detail for a single PopulationGroup.
 * Opens on card click; Escape and backdrop click dismiss.
 */
function GroupFocusModal({
  group,
  onClose,
}: {
  group: PopulationGroup;
  onClose: () => void;
}): JSX.Element {
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const ideologyPct = ideologyToPercent(group.ideologyBias);
  const ideologyLabel =
    group.ideologyBias < -0.4
      ? 'Left-leaning'
      : group.ideologyBias > 0.4
        ? 'Right-leaning'
        : 'Centrist';

  // Loyalty is signed; convert to a 0\u2013100 absolute for the bar but
  // keep the sign on the label so the player sees opposition vs. ally.
  const loyaltyPct = Math.min(100, Math.abs(group.loyalty));
  const loyaltyTone: 'success' | 'danger' | 'neutral' =
    group.loyalty > 25 ? 'success' : group.loyalty < -25 ? 'danger' : 'neutral';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${group.name} detail`}
      data-testid="population-focus-modal"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-bg-secondary rounded-lg border border-bg-tertiary shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b border-bg-tertiary px-5 py-3">
          <div>
            <h2 className="font-headline text-xl font-bold text-accent-gold">
              {group.name}
            </h2>
            <p className="font-mono text-label uppercase tracking-widest text-text-muted">
              {group.size}% of population \u00b7 {ideologyLabel}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </header>

        <div className="px-5 py-4 grid md:grid-cols-2 gap-5 overflow-y-auto game-scroll">
          {/* Left column: mood + ideology. */}
          <section className="space-y-3" data-testid="population-focus-mood">
            <h3 className="font-mono text-label uppercase tracking-widest text-text-muted">
              Mood
            </h3>
            <Bar
              label={<Term term="happiness"><span>Happiness</span></Term>}
              value={group.happiness}
              valueLabel={`${Math.round(group.happiness)}`}
              tone={moodTone(group.happiness, 'happiness')}
            />
            <Bar
              label={<Term term="radicalism"><span>Radicalism</span></Term>}
              value={group.radicalism}
              valueLabel={`${Math.round(group.radicalism)}`}
              tone={moodTone(group.radicalism, 'radicalism')}
            />
            <Bar
              label={<Term term="activism"><span>Activism</span></Term>}
              value={group.activism}
              valueLabel={`${Math.round(group.activism)}`}
            />
            <Bar
              label={<span>Loyalty {group.loyalty > 0 ? `(+${group.loyalty})` : `(${group.loyalty})`}</span>}
              value={loyaltyPct}
              valueLabel={`${group.loyalty}`}
              tone={loyaltyTone}
            />

            <div className="pt-2 border-t border-bg-tertiary/60">
              <div className="font-mono text-label uppercase tracking-widest text-text-muted mb-2">
                Ideology
              </div>
              <div className="relative h-2 rounded-sm bg-gradient-to-r from-accent-blue/40 via-bg-tertiary to-accent-red/40 border border-rule">
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-accent-gold border-2 border-bg-primary shadow"
                  style={{ left: `${ideologyPct}%` }}
                  aria-label={`Ideology bias ${group.ideologyBias.toFixed(2)}`}
                />
              </div>
              <div className="flex justify-between text-[0.625rem] uppercase tracking-widest text-text-muted mt-1 font-mono">
                <span>Left</span>
                <span>Center</span>
                <span>Right</span>
              </div>
            </div>
          </section>

          {/* Right column: demographics + actions. */}
          <section className="space-y-3" data-testid="population-focus-demographics">
            <h3 className="font-mono text-label uppercase tracking-widest text-text-muted">
              Demographics
            </h3>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-bg-primary/40 rounded-sm px-3 py-2">
                <dt className="font-mono text-[0.625rem] uppercase tracking-widest text-text-muted">
                  Size
                </dt>
                <dd className="font-mono text-data-sm text-text-primary tabular-nums">
                  {group.size}%
                </dd>
              </div>
              <div className="bg-bg-primary/40 rounded-sm px-3 py-2">
                <dt className="font-mono text-[0.625rem] uppercase tracking-widest text-text-muted">
                  Income index
                </dt>
                <dd className="font-mono text-data-sm text-text-primary tabular-nums">
                  {group.income}
                </dd>
              </div>
            </dl>

            <div>
              <div className="font-mono text-label uppercase tracking-widest text-text-muted mb-2">
                Tags
              </div>
              <div className="flex flex-wrap gap-1">
                {group.tags.length === 0 ? (
                  <span className="text-body text-text-muted italic">No tags.</span>
                ) : (
                  group.tags.map((t) => (
                    <span
                      key={t}
                      className="font-mono text-[0.6875rem] uppercase tracking-wider px-1.5 py-0.5 bg-bg-tertiary text-text-secondary rounded-sm"
                    >
                      {t}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-bg-tertiary/60 space-y-2">
              <div className="font-mono text-label uppercase tracking-widest text-text-muted">
                Group actions
              </div>
              <p className="text-body text-text-secondary leading-relaxed">
                Group-targeted cards (rallies, ad buys, listening
                sessions) and AP-spend levers will land here in a
                follow-up. The compass and bars above are how the
                engine reads the bloc today; this surface will become
                the place where the player nudges that reading.
              </p>
              <Button variant="secondary" size="sm" disabled>
                Target this group (coming soon)
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
