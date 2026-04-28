/**
 * QuestsPanel — browseable, detail-rich UI for quests.
 *
 * Closes docs/todo.md item 13. The previous version listed every active
 * and available quest as a flat grid of cards with a single short
 * description and a hard-coded checklist using the unicode characters
 * "✓" and "○". Players had no way to see rewards, no way to filter,
 * and the unicode markers were the kind of pictogram that should be
 * replaced by an Icon component per the no-emoji policy.
 *
 * The new layout is a two-pane browser:
 *   - Left rail: filter pills (All / Active / Available / Completed)
 *     plus a list of quests matching the current filter, sorted by
 *     status priority (active > available > locked > completed).
 *   - Right pane: details for the selected quest — full description,
 *     objectives with progress, prerequisites, rewards rendered from
 *     the underlying `Effect[]`, time-limit warning, and a Start
 *     button when applicable.
 *
 * The list rail renders a fixed-width column on md+ viewports and
 * collapses to a single column on small screens. This keeps the panel
 * usable at every Playwright viewport without horizontal scroll.
 *
 * @module renderer/panels/QuestsPanel
 */

import { useMemo, useState } from 'react';
import { GameEngine } from '@/engine/GameEngine';
import { QuestSystem } from '@/systems/QuestSystem';
import { useWorldStore } from '@/store/worldStore';
import { useUIStore } from '@/store/uiStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { TermText } from '../components/tooltip';
import type { Effect, QuestDefinition, QuestId, QuestInstance } from '@/types';

void GameEngine; // Importing GameEngine forces quest-data registration on bundle init.

type FilterId = 'all' | 'active' | 'available' | 'completed' | 'failed';

interface RowEntry {
  def: QuestDefinition;
  instance?: QuestInstance;
  // Mirrors `QuestStatus` plus a `'available'` row state for quests
  // that have unlocked but the player has not yet started.
  status: 'active' | 'available' | 'completed' | 'failed' | 'locked';
}

const FILTERS: ReadonlyArray<{ id: FilterId; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'available', label: 'Available' },
  { id: 'completed', label: 'Completed' },
  { id: 'failed', label: 'Failed' },
];

const STATUS_ORDER: Record<RowEntry['status'], number> = {
  active: 0,
  available: 1,
  locked: 2,
  completed: 3,
  failed: 4,
};

/**
 * Render a single Effect entry as a player-readable bullet. Quests are
 * authored with raw Effect unions; we humanise the few common ones here
 * and fall back to a JSON-ish summary for anything we haven't yet
 * spelled out. Exported so it can be unit-tested without rendering React.
 */

/** Map camelCase resource keys to display labels (todo#51). */
const RESOURCE_LABEL: Record<string, string> = {
  politicalCapital: 'Political Capital',
  actionPoints: 'Action Points',
  xp: 'XP',
};

/** Map camelCase economy metric keys to display labels (todo#75). */
const ECONOMY_LABEL: Record<string, string> = {
  gdpGrowth: 'GDP Growth',
  unemployment: 'Unemployment',
  inflation: 'Inflation',
  debt: 'Debt',
  deficit: 'Deficit',
  gini: 'Gini Coefficient',
  trade: 'Trade Balance',
};

export function describeEffect(effect: Effect): string {
  switch (effect.type) {
    case 'stat': {
      // Capitalise the first letter of stat name for display (todo#51).
      const statName = effect.target.charAt(0).toUpperCase() + effect.target.slice(1);
      return `${effect.value > 0 ? '+' : ''}${effect.value} ${statName}`;
    }
    case 'resource': {
      const label = RESOURCE_LABEL[effect.resource] ?? effect.resource;
      return `${effect.value > 0 ? '+' : ''}${effect.value} ${label}`;
    }
    case 'group_happiness':
      return `${effect.value > 0 ? '+' : ''}${effect.value} happiness for ${effect.group}`;
    case 'group_loyalty':
      return `${effect.value > 0 ? '+' : ''}${effect.value} loyalty with ${effect.group}`;
    case 'relationship':
      return `${effect.value > 0 ? '+' : ''}${effect.value} relationship with ${effect.npcId}`;
    case 'economy': {
      // Humanise economy metric names (todo#75).
      const label = ECONOMY_LABEL[effect.metric] ?? effect.metric;
      return `${effect.value > 0 ? '+' : ''}${effect.value} ${label}`;
    }
    case 'flag':
      return `Sets flag "${effect.flag}" to ${String(effect.value)}`;
    case 'grant_card':
      return `Grants card: ${effect.cardId}`;
    case 'trigger_quest':
      return `Unlocks quest: ${effect.questId}`;
    default: {
      const _never: never = effect;
      void _never;
      return 'Unknown reward';
    }
  }
}

export function QuestsPanel(): JSX.Element {
  const defs = useMemo(() => QuestSystem.allDefinitions(), []);
  const active = useWorldStore((s) => s.activeQuests);
  const flags = useWorldStore((s) => s.flags);
  const pushToast = useUIStore((s) => s.pushToast);

  const [filter, setFilter] = useState<FilterId>('all');

  // Build rows once per render: every known quest gets exactly one row,
  // tagged with the player's current relationship to it.
  const rows: RowEntry[] = useMemo(() => {
    const activeIds = new Map(active.map((inst) => [inst.questId, inst]));
    const list: RowEntry[] = defs.map((def: QuestDefinition) => {
      const inst = activeIds.get(def.id);
      if (inst) {
        // QuestSystem.dailyUpdate() flips inst.status to 'completed' or
        // 'failed' but keeps the instance in `activeQuests` for one
        // tick of UI continuity. Hard-coding 'active' here would mis-
        // label those rows, break the Completed/Failed filters, and
        // contradict the Completed badge on the detail pane. Derive
        // from the instance instead.
        if (inst.status === 'completed') return { def, instance: inst, status: 'completed' };
        if (inst.status === 'failed') return { def, instance: inst, status: 'failed' };
        if (inst.status === 'locked') return { def, instance: inst, status: 'locked' };
        return { def, instance: inst, status: 'active' };
      }
      if (flags[`quest-complete:${def.id}`]) return { def, status: 'completed' };
      const ready = def.prerequisites.every((p) => flags[`quest-complete:${p}`]);
      return { def, status: ready ? 'available' : 'locked' };
    });
    return list.sort((a, b) => {
      const so = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (so !== 0) return so;
      return a.def.title.localeCompare(b.def.title);
    });
  }, [defs, active, flags]);

  const visible = useMemo(() => {
    if (filter === 'all') return rows;
    return rows.filter((r) => r.status === filter);
  }, [rows, filter]);

  // Selection: default to the first visible row when the previous
  // selection drops out of view (e.g. the filter changed).
  const [selectedId, setSelectedId] = useState<QuestId | null>(null);
  const selected =
    visible.find((r) => r.def.id === selectedId) ?? visible[0] ?? null;

  function start(id: QuestId): void {
    const ok = QuestSystem.start(id);
    pushToast({
      message: ok ? 'Quest started' : 'Cannot start quest',
      severity: ok ? 'info' : 'warning',
      ttl: 2500,
    });
  }

  return (
    <div className="space-y-3" data-testid="quests-panel">
      <header>
        <h1 className="font-headline text-panel-title text-text-primary">Quests</h1>
        <p className="text-body text-text-secondary">
          Long-running objectives, ambitions, and policy fights. Filter the rail
          to focus on what&apos;s active or what&apos;s open to you next.
        </p>
      </header>

      <div className="flex gap-1.5" role="tablist" aria-label="Quest filter">
        {FILTERS.map((f) => {
          const isOn = filter === f.id;
          const count =
            f.id === 'all'
              ? rows.length
              : rows.filter((r) => r.status === f.id).length;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={isOn}
              data-testid={`quest-filter-${f.id}`}
              onClick={() => setFilter(f.id)}
              className={
                'px-3 py-1 text-label font-mono uppercase tracking-wider rounded-sm border ' +
                (isOn
                  ? 'bg-accent-gold text-bg-primary border-accent-gold'
                  : 'bg-bg-secondary text-text-secondary border-rule hover:border-rule-strong')
              }
            >
              {f.label} <span className="opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="grid md:grid-cols-[18rem_1fr] gap-3">
        {/* List rail */}
        <ol
          data-testid="quest-list"
          className="space-y-1 max-h-[70vh] overflow-y-auto pr-1"
        >
          {visible.length === 0 && (
            <li className="text-body text-text-muted italic px-2 py-3">
              No quests in this filter.
            </li>
          )}
          {visible.map((row) => {
            const isSelected = selected?.def.id === row.def.id;
            return (
              <li key={row.def.id as unknown as string}>
                <button
                  type="button"
                  data-testid={`quest-row-${row.def.id as unknown as string}`}
                  data-status={row.status}
                  onClick={() => setSelectedId(row.def.id)}
                  className={
                    'w-full text-left px-3 py-2 rounded-sm border transition-colors ' +
                    (isSelected
                      ? 'bg-bg-tertiary border-accent-gold'
                      : 'bg-bg-secondary border-rule hover:border-rule-strong')
                  }
                >
                  <div className="flex items-center gap-2">
                    <QuestStatusIcon status={row.status} />
                    <span className="font-headline text-body text-text-primary leading-snug">
                      {row.def.title}
                    </span>
                  </div>
                  <span className="font-mono text-label uppercase tracking-wider text-text-muted">
                    {row.def.type} · {row.status}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        {/* Detail pane */}
        <div data-testid="quest-detail">
          {selected ? (
            <QuestDetail row={selected} onStart={start} />
          ) : (
            <Card>
              <p className="text-body text-text-muted italic">
                Select a quest from the list to see its objectives and rewards.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/** Small status pictogram in the rail. Replaces the prior unicode glyphs. */
function QuestStatusIcon(props: { status: RowEntry['status'] }): JSX.Element {
  switch (props.status) {
    case 'active':
      return <Icon name="flag" className="w-4 h-4 text-accent-gold" />;
    case 'available':
      return <Icon name="circle" className="w-4 h-4 text-text-secondary" />;
    case 'completed':
      return <Icon name="check" className="w-4 h-4 text-status-success" />;
    case 'failed':
      return <Icon name="x" className="w-4 h-4 text-status-danger" />;
    case 'locked':
      return <Icon name="lock" className="w-4 h-4 text-text-muted" />;
    default: {
      const _never: never = props.status;
      void _never;
      return <Icon name="circle" className="w-4 h-4" />;
    }
  }
}

/** Right-pane detail: description, objectives, prerequisites, rewards. */
function QuestDetail(props: {
  row: RowEntry;
  onStart: (id: QuestId) => void;
}): JSX.Element {
  const { row, onStart } = props;
  const { def, instance, status } = row;

  const doneCount = instance
    ? def.objectives.filter((o) => instance.progress[o.id]).length
    : 0;

  return (
    <Card
      title={def.title}
      subtitle={`${def.type.toUpperCase()} QUEST · ${status.toUpperCase()}`}
      accent="gold"
    >
      <p className="text-body text-text-secondary mb-3 leading-relaxed">
        <TermText text={def.description} />
      </p>

      <section className="mb-3" data-testid="quest-detail-objectives">
        <h3 className="font-mono text-label uppercase tracking-wider text-accent-gold mb-1">
          Objectives {instance ? `(${doneCount}/${def.objectives.length})` : ''}
        </h3>
        <ul className="space-y-1">
          {def.objectives.map((o) => {
            const isDone = instance ? instance.progress[o.id] === true : false;
            return (
              <li key={o.id} className="flex items-start gap-2">
                <Icon
                  name={isDone ? 'check' : 'circle'}
                  className={
                    'w-4 h-4 mt-0.5 shrink-0 ' +
                    (isDone ? 'text-status-success' : 'text-text-muted')
                  }
                />
                <span
                  className={
                    'text-body ' +
                    (isDone ? 'line-through text-text-muted' : 'text-text-primary')
                  }
                >
                  {o.description}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {def.prerequisites.length > 0 && (
        <section className="mb-3" data-testid="quest-detail-prereqs">
          <h3 className="font-mono text-label uppercase tracking-wider text-accent-gold mb-1">
            Prerequisites
          </h3>
          <ul className="space-y-1">
            {def.prerequisites.map((p) => (
              <li key={p as unknown as string} className="text-body text-text-secondary">
                {p as unknown as string}
              </li>
            ))}
          </ul>
        </section>
      )}

      {def.rewardEffects.length > 0 && (
        <section className="mb-3" data-testid="quest-detail-rewards">
          <h3 className="font-mono text-label uppercase tracking-wider text-accent-gold mb-1 flex items-center gap-1">
            <Icon name="trophy" className="w-4 h-4" /> Rewards on completion
          </h3>
          <ul className="space-y-1">
            {def.rewardEffects.map((eff, i) => (
              <li key={i} className="text-body text-text-secondary">
                {describeEffect(eff)}
              </li>
            ))}
          </ul>
        </section>
      )}

      {def.timeLimitDays !== undefined && (
        <p className="text-label text-status-warning font-mono uppercase tracking-wider mb-3">
          Time limit: {def.timeLimitDays} days
        </p>
      )}

      {status === 'available' && (
        <Button size="sm" variant="primary" onClick={() => onStart(def.id)}>
          Start quest
        </Button>
      )}
    </Card>
  );
}
