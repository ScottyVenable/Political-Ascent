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
import { useEffect, useMemo, useState } from 'react';
import { useScrollLock } from '@/utils/useScrollLock';
import { formatTag } from '@/utils/format';
import { useWorldStore } from '@/store/worldStore';
import { useCharacterStore } from '@/store/characterStore';
import { Card } from '../components/Card';
import { Bar } from '../components/Bar';
import { Button } from '../components/Button';
import { Term } from '../components/tooltip';
import type { PopulationGroup } from '@/types';

/** The three view levels available in the population panel (todo#68). */
type PopLevelFilter = 'national' | 'state' | 'local';

export function PopulationPanel(): JSX.Element {
  const population = useWorldStore((s) => s.population);
  const homeState = useCharacterStore((s) => s.homeState);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<PopLevelFilter>('national');
  const focused = population.find((g) => g.id === focusId) ?? null;

  // For now, all three levels show the same cohort data (cohorts are
  // national archetypes; per-state breakdowns are a future content pass).
  // The filter still shows meaningful context labels to telegraph the
  // design intent and let the character's homeState be visible.
  // When per-state data lands, filter `population` here by state.
  const displayedGroups = useMemo(() => {
    // Future: filter by state/district when cohorts gain `state` field.
    return population;
  }, [population]);

  return (
    <div>
      {/* Level filter row (todo#68): National / State / Local toggle.
          State and Local views display a context badge showing the
          character's home state so the player knows which constituency
          the data (or future per-state data) relates to. */}
      <div className="flex items-center gap-2 mb-4 flex-wrap" data-testid="population-level-filter">
        {(['national', 'state', 'local'] as const).map((lvl) => (
          <button
            key={lvl}
            type="button"
            onClick={() => setLevelFilter(lvl)}
            className={`text-xs px-3 py-1.5 rounded capitalize transition-colors ${
              levelFilter === lvl
                ? 'bg-accent-gold text-bg-primary font-semibold'
                : 'bg-bg-secondary border border-rule text-text-secondary hover:bg-bg-tertiary'
            }`}
            aria-pressed={levelFilter === lvl}
          >
            {lvl}
          </button>
        ))}
        {(levelFilter === 'state' || levelFilter === 'local') && (
          <span className="text-xs text-text-muted ml-2">
            {homeState
              ? `Showing cohorts for ${homeState}`
              : 'No home state set — go to Character to update'}
          </span>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-3" data-testid="population-grid">
        {displayedGroups.map((g) => (
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
                      {formatTag(t)}
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
 * GroupFocusModal — full-page detail for a single PopulationGroup.
 * Opens on card click; Escape and backdrop click dismiss.
 *
 * todo#67: adds "Biggest Issues" and "Public Opinion" panels derived
 * from the group's current stats. Issues are ranked by how much a stat
 * diverges from a healthy baseline; quotes are templated text that
 * describes the mood in plain language so the player can read the bloc
 * at a glance.
 */

/**
 * Derive the top N "issues" for a group from their current stats.
 * An issue is any dimension where the group deviates significantly from
 * a "neutral comfortable" baseline. Returns items sorted by urgency
 * (most severe first).
 */
function deriveIssues(g: PopulationGroup): Array<{ label: string; score: number; tone: 'danger' | 'warning' | 'good' }> {
  const issues: Array<{ label: string; score: number; tone: 'danger' | 'warning' | 'good' }> = [];

  // Happiness below 40 = major issue; 40-55 = concern; above 65 = positive indicator.
  if (g.happiness < 40) {
    issues.push({ label: 'Widespread discontent with current conditions', score: 40 - g.happiness, tone: 'danger' });
  } else if (g.happiness < 55) {
    issues.push({ label: 'Low morale among group members', score: 55 - g.happiness, tone: 'warning' });
  } else if (g.happiness > 70) {
    issues.push({ label: 'Group is broadly satisfied with current direction', score: g.happiness - 70, tone: 'good' });
  }

  // Radicalism above 50 = concern; above 70 = danger.
  if (g.radicalism > 70) {
    issues.push({ label: 'High radicalism: group is mobilising for direct action', score: g.radicalism - 70, tone: 'danger' });
  } else if (g.radicalism > 50) {
    issues.push({ label: 'Elevated radicalism: opposition voices are louder', score: g.radicalism - 50, tone: 'warning' });
  }

  // Loyalty below -25 = adversarial; -25 to 25 = neutral; above 60 = strong ally.
  if (g.loyalty < -50) {
    issues.push({ label: 'Group is actively opposing your administration', score: -g.loyalty, tone: 'danger' });
  } else if (g.loyalty < -25) {
    issues.push({ label: 'Group is broadly hostile to your platform', score: -g.loyalty, tone: 'warning' });
  } else if (g.loyalty > 60) {
    issues.push({ label: 'Strong base: group is reliably supportive', score: g.loyalty - 60, tone: 'good' });
  }

  // Ideology extremes.
  if (Math.abs(g.ideologyBias) > 0.7) {
    const dir = g.ideologyBias > 0 ? 'right-wing' : 'left-wing';
    issues.push({ label: `Strongly ${dir} bloc — centrist messaging will underperform`, score: Math.abs(g.ideologyBias) * 30, tone: 'warning' });
  }

  // Activism above 70 = high-energy (good or bad depending on loyalty).
  if (g.activism > 70 && g.loyalty < 0) {
    issues.push({ label: 'High activism among an opposing bloc — expect protests', score: g.activism - 70 + (-g.loyalty / 2), tone: 'danger' });
  } else if (g.activism > 70 && g.loyalty > 25) {
    issues.push({ label: 'High activism among supporters — strong get-out-the-vote potential', score: g.activism - 70, tone: 'good' });
  }

  return issues.sort((a, b) => b.score - a.score).slice(0, 4);
}

/**
 * Generate templated "public opinion" quotes for a group based on their
 * current stats. Returns 2–3 short representative statements as if
 * sampled from group members.
 */
function generateQuotes(g: PopulationGroup): string[] {
  const quotes: string[] = [];

  // Happiness-driven quote.
  if (g.happiness < 35) {
    quotes.push(`"Things have not been this bad for our community in a long time. We need real change."`);
  } else if (g.happiness < 55) {
    quotes.push(`"We're watching closely. The leadership needs to do more for people like us."`);
  } else if (g.happiness > 70) {
    quotes.push(`"I genuinely believe we're heading in the right direction. My neighbours feel it too."`);
  } else {
    quotes.push(`"It's not perfect, but we're managing. Let's see what happens next."`);
  }

  // Radicalism-driven quote.
  if (g.radicalism > 65) {
    quotes.push(`"Half-measures aren't going to cut it anymore. We're tired of waiting for gradual reform."`);
  } else if (g.radicalism > 40) {
    quotes.push(`"There's frustration out there. People want to see action, not just talk."`);
  }

  // Loyalty-driven quote.
  if (g.loyalty < -40) {
    quotes.push(`"I wouldn't vote for the current administration if they paid me. They've let us down completely."`);
  } else if (g.loyalty > 50) {
    quotes.push(`"I've supported this candidate from the start and I'm proud of it. They get us."`);
  } else if (g.loyalty > 20) {
    quotes.push(`"I'm cautiously optimistic. So far they've kept most of their promises to us."`);
  }

  return quotes.slice(0, 3);
}

function GroupFocusModal({
  group,
  onClose,
}: {
  group: PopulationGroup;
  onClose: () => void;
}): JSX.Element {
  // Lock body scroll while the cohort detail overlay is open.
  useScrollLock();

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

  // todo#67: derive issues and opinion quotes from the group's current stats.
  // Memoised — group data doesn't change while the modal is open.
  const issues = useMemo(() => deriveIssues(group), [group]);
  const quotes = useMemo(() => generateQuotes(group), [group]);

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
                      {formatTag(t)}
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

        {/*
          todo#67: Biggest Issues panel — shows which dimensions deviate
          most from healthy baselines, ranked by severity. Gives the
          player a quick read on what this bloc cares about most.
        */}
        {issues.length > 0 && (
          <div className="px-5 pb-4 border-t border-bg-tertiary/60 pt-4" data-testid="population-focus-issues">
            <h3 className="font-mono text-label uppercase tracking-widest text-text-muted mb-3">
              Biggest Issues
            </h3>
            <ul className="space-y-2">
              {issues.map((issue) => (
                <li
                  key={issue.label}
                  className="flex items-start gap-2 text-sm"
                >
                  {/* Tone dot — red = danger, amber = warning, green = positive */}
                  <span
                    className={[
                      'mt-1 flex-shrink-0 w-2 h-2 rounded-full',
                      issue.tone === 'danger'
                        ? 'bg-status-danger'
                        : issue.tone === 'warning'
                          ? 'bg-status-warning'
                          : 'bg-status-success',
                    ].join(' ')}
                    aria-hidden="true"
                  />
                  <span
                    className={
                      issue.tone === 'danger'
                        ? 'text-status-danger'
                        : issue.tone === 'warning'
                          ? 'text-amber-400'
                          : 'text-status-success'
                    }
                  >
                    {issue.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/*
          todo#67: Public Opinion panel — templated quotes from members
          of this bloc that give the player a sense of the group's
          attitude towards the current government in plain language.
        */}
        <div className="px-5 pb-5 border-t border-bg-tertiary/60 pt-4" data-testid="population-focus-opinion">
          <h3 className="font-mono text-label uppercase tracking-widest text-text-muted mb-3">
            Public Opinion
          </h3>
          <div className="space-y-3">
            {quotes.map((quote, i) => (
              <blockquote
                key={i}
                className="border-l-2 border-accent-gold/50 pl-3 text-body text-text-secondary italic leading-relaxed"
              >
                {quote}
              </blockquote>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
