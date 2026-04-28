/**
 * SkillsPanel — RPG-style skill tree visualisation.
 *
 * Replaces the previous flat card grid with a tier-stratified tree:
 *   - Six branch columns (charisma / strategy / connections / integrity /
 *     stamina / wealth) — one per stat.
 *   - Within each column, nodes sort by `requiredLevel` so the tree
 *     reads top-down from "introductory" to "advanced".
 *   - Each node renders as a hex-clipped badge whose visual state
 *     (locked / available / unlocked) is unambiguous at a glance.
 *   - Vertical SVG connectors trace prerequisite chains within a
 *     branch — coloured gold when the chain is active, dim grey
 *     otherwise. Cross-branch prerequisites would require a second
 *     SVG layer; the current data set has none, and adding the
 *     layer is queued for when it does.
 *   - A side detail rail surfaces the focused (hovered or selected)
 *     node's full description, tier, prereq chips (clickable to
 *     focus the prereq), and the unlock affordance.
 *
 * Closes docs/todo.md item 34.
 *
 * @module renderer/panels/SkillsPanel
 */
import { useMemo, useState } from 'react';
import { useCharacterStore } from '@/store/characterStore';
import { useUIStore } from '@/store/uiStore';
import { SkillSystem, type SkillDefinition } from '@/systems/SkillSystem';
import { Button } from '../components/Button';
import { Term, TermText } from '../components/tooltip';

/** Branch ordering — fixed left-to-right so saved muscle memory holds. */
const BRANCHES: SkillDefinition['branch'][] = [
  'charisma',
  'strategy',
  'connections',
  'integrity',
  'stamina',
  'wealth',
];

/**
 * Visual state for a single skill node. Drives the colour ramp and
 * the unlock affordance, so we resolve it once per render and pass
 * it down rather than recomputing in three places.
 */
type NodeState = 'unlocked' | 'available' | 'locked';

function resolveState(
  def: SkillDefinition,
  unlocked: string[],
): NodeState {
  if (unlocked.includes(def.id)) return 'unlocked';
  const check = SkillSystem.canUnlock(def.id);
  return check.ok ? 'available' : 'locked';
}

export function SkillsPanel(): JSX.Element {
  const unlocked = useCharacterStore((s) => s.unlockedSkills);
  const skillPoints = useCharacterStore((s) => s.skillPoints);
  const level = useCharacterStore((s) => s.level);
  const pushToast = useUIStore((s) => s.pushToast);

  // Hovered overrides selected for the rail display, but selecting
  // is the persistent state — clicking pins, mouseleave reverts.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const all = SkillSystem.all();

  /**
   * Group skills by branch, sorted within each branch by required
   * level. This is the spine of the visual tree.
   */
  const byBranch = useMemo(() => {
    const map = new Map<SkillDefinition['branch'], SkillDefinition[]>();
    for (const b of BRANCHES) map.set(b, []);
    for (const s of all) map.get(s.branch)?.push(s);
    for (const b of BRANCHES) {
      map.get(b)?.sort((a, b2) => a.requiredLevel - b2.requiredLevel);
    }
    return map;
  }, [all]);

  /**
   * Per-branch unlock counts for the header strip — gives the player
   * a sense of completion progress without scanning every node.
   */
  const branchTotals = useMemo(() => {
    const totals: Record<string, { unlocked: number; total: number }> = {};
    for (const b of BRANCHES) {
      const skills = byBranch.get(b) ?? [];
      totals[b] = {
        total: skills.length,
        unlocked: skills.filter((s) => unlocked.includes(s.id)).length,
      };
    }
    return totals;
  }, [byBranch, unlocked]);

  const focusId = hoveredId ?? selectedId;
  const focused = focusId ? all.find((s) => s.id === focusId) ?? null : null;

  function unlock(id: string): void {
    const ok = SkillSystem.unlock(id);
    pushToast({
      message: ok ? 'Skill unlocked' : 'Cannot unlock skill',
      severity: ok ? 'success' : 'warning',
      ttl: 2500,
    });
  }

  return (
    <div className="space-y-4" data-testid="skill-tree">
      {/* Header strip — level, skill points, and a per-branch
          completion mini-grid. The mini-grid uses the same column
          order as the tree below so the eye can map a branch chip
          to its column without thinking. */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-bg-secondary border border-rule rounded-sm px-4 py-3">
        <div className="flex items-baseline gap-4">
          <h2 className="font-headline text-panel-title text-text-primary">
            Skill Tree
          </h2>
          <span className="font-mono text-label uppercase tracking-widest text-text-muted">
            Level {level}
          </span>
          <span className="font-mono text-body text-text-secondary">
            <span className="text-accent-gold tabular-nums" data-testid="skill-points">
              {skillPoints}
            </span>{' '}
            point{skillPoints === 1 ? '' : 's'} to spend
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5" data-testid="skill-branch-totals">
          {BRANCHES.map((b) => {
            const t = branchTotals[b];
            const complete = t.unlocked === t.total && t.total > 0;
            return (
              <span
                key={b}
                className={
                  'font-mono text-[0.625rem] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border ' +
                  (complete
                    ? 'border-accent-gold text-accent-gold'
                    : 'border-rule text-text-muted')
                }
              >
                {b} {t.unlocked}/{t.total}
              </span>
            );
          })}
        </div>
      </header>

      {/* Tree + detail rail. The tree uses a 6-column grid on
          desktop; the rail is a sticky sidebar on lg and an
          inline panel on smaller widths. Skill content fits
          comfortably without horizontal scroll at 1280×720. */}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-4">
        <div
          className="grid grid-cols-3 md:grid-cols-6 gap-3 bg-bg-secondary border border-rule rounded-sm p-4"
          data-testid="skill-tree-grid"
        >
          {BRANCHES.map((branch) => (
            <BranchColumn
              key={branch}
              branch={branch}
              skills={byBranch.get(branch) ?? []}
              unlocked={unlocked}
              focusId={focusId}
              onHover={setHoveredId}
              onSelect={setSelectedId}
            />
          ))}
        </div>

        <DetailRail
          focused={focused}
          unlocked={unlocked}
          all={all}
          onSelect={setSelectedId}
          onUnlock={unlock}
        />
      </div>
    </div>
  );
}

/**
 * Single branch column. Renders the branch label, then each node in
 * level order. Nodes inside a branch are connected with thin
 * vertical lines that are coloured based on the prereq state, so
 * the chain reads as "lit up" once unlocked.
 */
function BranchColumn({
  branch,
  skills,
  unlocked,
  focusId,
  onHover,
  onSelect,
}: {
  branch: SkillDefinition['branch'];
  skills: SkillDefinition[];
  unlocked: string[];
  focusId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}): JSX.Element {
  return (
    <div
      className="flex flex-col items-center gap-0"
      data-testid={`skill-branch-${branch}`}
    >
      <Term term={`stat-${branch}`}>
        <h3 className="font-mono text-label uppercase tracking-widest text-accent-gold mb-2">
          {branch}
        </h3>
      </Term>

      {skills.length === 0 ? (
        <div className="text-xs text-text-muted italic mt-2">No skills yet.</div>
      ) : (
        skills.map((s, i) => {
          const state = resolveState(s, unlocked);
          // The connector above this node lights up only when the
          // immediate predecessor in the same branch is unlocked.
          const prev = skills[i - 1];
          const connectorActive = prev ? unlocked.includes(prev.id) : false;
          return (
            <div key={s.id} className="flex flex-col items-center w-full">
              {i > 0 && (
                <div
                  className={
                    'w-0.5 h-6 ' +
                    (connectorActive ? 'bg-accent-gold' : 'bg-bg-tertiary')
                  }
                  aria-hidden
                  data-testid={`skill-connector-${prev?.id}-${s.id}`}
                />
              )}
              <SkillNode
                def={s}
                state={state}
                isFocused={focusId === s.id}
                onHover={onHover}
                onSelect={onSelect}
              />
            </div>
          );
        })
      )}
    </div>
  );
}

/**
 * Hex-badge skill node. The visual state ramps from grey (locked)
 * through bordered-gold (available) to filled-gold (unlocked).
 * Focus state adds a soft outer ring so the rail-target is obvious.
 */
function SkillNode({
  def,
  state,
  isFocused,
  onHover,
  onSelect,
}: {
  def: SkillDefinition;
  state: NodeState;
  isFocused: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}): JSX.Element {
  // Hex polygon clip — a flat-top hexagon at 56×64 keeps a tidy
  // grid. Polygon points are constants; we multiply at SVG layer
  // not here, so the CSS class is reusable everywhere.
  const hexClip = { clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)' };

  const stateClass =
    state === 'unlocked'
      ? 'bg-accent-gold text-bg-primary'
      : state === 'available'
        ? 'bg-bg-tertiary text-text-primary'
        : 'bg-bg-tertiary/70 text-text-muted';

  const ringClass = isFocused
    ? 'ring-2 ring-accent-gold ring-offset-2 ring-offset-bg-secondary'
    : state === 'available'
      ? 'ring-2 ring-accent-gold/50'
      : '';

  return (
    <button
      type="button"
      data-testid={`skill-node-${def.id}`}
      data-state={state}
      onMouseEnter={() => onHover(def.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(def.id)}
      onBlur={() => onHover(null)}
      onClick={() => onSelect(def.id)}
      aria-label={`${def.name} (${state})`}
      aria-pressed={isFocused}
      className={`relative w-14 h-16 flex flex-col items-center justify-center transition-all hover:brightness-110 focus:outline-none ${stateClass} ${ringClass}`}
      style={hexClip}
    >
      <span className="font-mono text-[0.6rem] uppercase tracking-widest opacity-80 leading-none">
        Lv {def.requiredLevel}
      </span>
      <span className="font-headline text-[0.625rem] leading-tight text-center px-1 mt-1">
        {/* Show only the last word (the "noun") to fit in the hex.
            Full name lives in the rail and tooltip. */}
        {def.name.split(' ').slice(-1)[0]}
      </span>
      {state === 'unlocked' && (
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-status-success border border-bg-primary" />
      )}
    </button>
  );
}

/**
 * Sticky right-rail for the focused node. Empty-state copy nudges
 * the player to hover something. Prereq chips are buttons that
 * focus the prereq node, so the player can walk a chain without
 * leaving the panel.
 */
function DetailRail({
  focused,
  unlocked,
  all,
  onSelect,
  onUnlock,
}: {
  focused: SkillDefinition | null;
  unlocked: string[];
  all: SkillDefinition[];
  onSelect: (id: string) => void;
  onUnlock: (id: string) => void;
}): JSX.Element {
  if (!focused) {
    return (
      <aside
        className="bg-bg-secondary border border-rule rounded-sm p-4 lg:sticky lg:top-4 self-start"
        data-testid="skill-detail-rail"
        data-empty="true"
      >
        <p className="text-body text-text-muted italic">
          Hover or click a node to see its description, requirements, and unlock cost.
        </p>
      </aside>
    );
  }

  const state = resolveState(focused, unlocked);
  const check = SkillSystem.canUnlock(focused.id);

  return (
    <aside
      className="bg-bg-secondary border border-rule rounded-sm p-4 lg:sticky lg:top-4 self-start space-y-3"
      data-testid="skill-detail-rail"
      data-skill-id={focused.id}
    >
      <header>
        <p className="font-mono text-label uppercase tracking-widest text-accent-gold">
          {focused.branch} · Lv {focused.requiredLevel}
        </p>
        <h3 className="font-headline text-lg text-text-primary leading-tight">
          {focused.name}
        </h3>
      </header>

      <p className="text-body text-text-secondary leading-relaxed">
        <TermText text={focused.description} />
      </p>

      {focused.prerequisites.length > 0 && (
        <div>
          <p className="font-mono text-[0.625rem] uppercase tracking-widest text-text-muted mb-1">
            Requires
          </p>
          <div className="flex flex-wrap gap-1">
            {focused.prerequisites.map((pid) => {
              const p = all.find((s) => s.id === pid);
              const ok = unlocked.includes(pid);
              return (
                <button
                  key={pid}
                  type="button"
                  onClick={() => onSelect(pid)}
                  data-testid={`skill-prereq-${pid}`}
                  className={
                    'font-mono text-[0.6875rem] px-2 py-0.5 rounded-sm border transition-colors ' +
                    (ok
                      ? 'border-status-success text-status-success'
                      : 'border-status-danger text-status-danger hover:bg-bg-tertiary')
                  }
                >
                  {ok ? '\u2713' : '\u2717'} {p?.name ?? pid}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="pt-2 border-t border-bg-tertiary/60">
        {state === 'unlocked' ? (
          <p className="text-body text-status-success font-mono">Unlocked</p>
        ) : (
          <Button
            size="sm"
            variant="primary"
            disabled={!check.ok}
            onClick={() => onUnlock(focused.id)}
            data-testid="skill-unlock-button"
          >
            {check.ok ? 'Unlock (1 point)' : (check.reason ?? 'Locked')}
          </Button>
        )}
      </div>
    </aside>
  );
}
