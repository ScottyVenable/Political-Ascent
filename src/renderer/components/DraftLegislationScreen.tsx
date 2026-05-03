/**
 * DraftLegislationScreen — deep-customization modal for a new bill.
 *
 * Closes docs/todo.md item 40. Replaces the one-click "Draft" button
 * with an interactive screen where the player:
 *   - Edits the bill's title.
 *   - Toggles **policy modules** in/out of the bill. Each module
 *     contributes additive deltas to opposition and budget impact,
 *     plus its own `Effect`s.
 *   - Reads a synthesised "hypothetical bill text" assembled from
 *     the base description plus each active module's preview phrase.
 *   - Sees a **climate forecast** card recomputed live from
 *     `LegislationSystem.estimatePassageChance` against the
 *     synthesised template.
 *
 * On submit, we synthesise a `BillTemplate` at runtime and forward
 * it to the existing `LegislationSystem.draftBill` pipeline so the
 * bill enters the same in-flight queue used by the static templates.
 *
 * Active riders are ordered in a right-rail stack. The order is used
 * for preview text today and leaves room for later committee-stage
 * tactics that care about which rider leads the package.
 *
 * @module renderer/components/DraftLegislationScreen
 */
import { useEffect, useMemo, useState } from 'react';
import { useScrollLock } from '@/utils/useScrollLock';
import policyModulesData from '@/data/legislation/modules/policy-modules.json';
import { LegislationSystem } from '@/systems/LegislationSystem';
import { useUIStore } from '@/store/uiStore';
import type { BillTemplate, PolicyModule, Effect, PolicyTag } from '@/types';
import { formatTag } from '@/utils/format';
import {
  MODULE_COMPLEXITY_BUDGET,
  analyzePolicyModules,
  moduleComplexity,
  modulePublicAppeal,
  moduleRoleLabel,
  summarizeEffect,
} from '@/utils/legislativeModules';
import { Button } from './Button';
import { TermText } from './tooltip';

/**
 * Treat the JSON import as the authoritative module list. We narrow
 * via `as` because the JSON's effect literals don't quite match the
 * Effect union without a runtime parse — the loader's structure
 * keeps it safe in practice and the validation pass at boot will
 * reject malformed entries.
 */
const POLICY_MODULES = policyModulesData.modules as PolicyModule[];

const POLICY_TAG_OPTIONS: PolicyTag[] = [
  'economy',
  'healthcare',
  'education',
  'defense',
  'civil_rights',
  'environment',
  'immigration',
  'criminal_justice',
  'taxation',
  'trade',
  'infrastructure',
  'constitutional',
];

const MODULE_CATEGORY_OPTIONS = Array.from(new Set(POLICY_MODULES.map((m) => m.category)));

interface Props {
  /**
   * Pre-fill data from the source template the player picked from
   * the Draft tab. The screen lets them tune it before submitting.
   */
  baseTemplate: BillTemplate;
  /** Called after a successful draft so the parent can switch tabs. */
  onSubmitted: () => void;
  /** Called when the player abandons the draft (Esc or Cancel). */
  onClose: () => void;
}

export function DraftLegislationScreen({ baseTemplate, onSubmitted, onClose }: Props): JSX.Element {
  const [title, setTitle] = useState(baseTemplate.title);
  const [purpose, setPurpose] = useState(baseTemplate.description);
  const [selectedTags, setSelectedTags] = useState<Set<PolicyTag>>(new Set(baseTemplate.tags));
  const [activeModuleIds, setActiveModuleIds] = useState<string[]>([]);
  const [moduleSearch, setModuleSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | PolicyModule['category']>('all');
  const pushToast = useUIStore((s) => s.pushToast);

  // Lock body scroll while the full-screen drafting overlay is open.
  useScrollLock();

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    setTitle(baseTemplate.title);
    setPurpose(baseTemplate.description);
    setSelectedTags(new Set(baseTemplate.tags));
    setActiveModuleIds([]);
  }, [baseTemplate.description, baseTemplate.id, baseTemplate.tags, baseTemplate.title]);

  const activeModules = useMemo(() => {
    return activeModuleIds
      .map((id) => POLICY_MODULES.find((module) => module.id === id))
      .filter((module): module is PolicyModule => module !== undefined);
  }, [activeModuleIds]);

  const visibleModules = useMemo(() => {
    const q = moduleSearch.trim().toLowerCase();
    return POLICY_MODULES.filter((m) => {
      const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
      const matchesSearch =
        q.length === 0 ||
        m.name.toLowerCase().includes(q) ||
        m.summary.toLowerCase().includes(q) ||
        m.previewText.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [moduleSearch, categoryFilter]);

  const groupedVisibleModules = useMemo(() => {
    const grouped = new Map<PolicyModule['category'], PolicyModule[]>();
    for (const module of visibleModules) {
      const current = grouped.get(module.category) ?? [];
      current.push(module);
      grouped.set(module.category, current);
    }
    return grouped;
  }, [visibleModules]);

  const draftTags = useMemo(
    () => (selectedTags.size > 0 ? [...selectedTags] : baseTemplate.tags),
    [baseTemplate.tags, selectedTags],
  );

  const moduleAnalysis = useMemo(
    () =>
      analyzePolicyModules(
        {
          opposition: baseTemplate.opposition,
          budgetImpact: baseTemplate.budgetImpact,
          tags: draftTags,
        },
        activeModules,
      ),
    [baseTemplate.budgetImpact, baseTemplate.opposition, draftTags, activeModules],
  );

  /**
   * Compose the synthesised template. Modules contribute additive
   * deltas; effects concat. We rebuild the template object every
   * time so the forecast / preview always reflect the current state.
   */
  const synthesised: BillTemplate = useMemo(() => {
    const effects: Effect[] = [...baseTemplate.effects, ...activeModules.flatMap((m) => m.effects)];
    return {
      ...baseTemplate,
      title: title.trim() || baseTemplate.title,
      description: purpose.trim() || baseTemplate.description,
      tags: draftTags,
      opposition: moduleAnalysis.finalOpposition,
      budgetImpact: moduleAnalysis.budgetImpact,
      effects,
    };
  }, [baseTemplate, title, purpose, draftTags, moduleAnalysis, activeModules]);

  const forecast = LegislationSystem.estimatePassageChance(synthesised);

  const billText = useMemo(
    () => composeBillText(synthesised, activeModules),
    [synthesised, activeModules],
  );

  function toggleModule(id: string): void {
    setActiveModuleIds((prev) => {
      if (prev.includes(id)) return prev.filter((existingId) => existingId !== id);
      return [...prev, id];
    });
  }

  function moveModule(id: string, direction: -1 | 1): void {
    setActiveModuleIds((prev) => {
      const index = prev.indexOf(id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  }

  function toggleTag(tag: PolicyTag): void {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  function submit(): void {
    if (purpose.trim().length < 10) {
      pushToast({
        message: 'Add a short policy purpose (at least 10 characters).',
        severity: 'warning',
        ttl: 2500,
      });
      return;
    }

    if (selectedTags.size === 0) {
      pushToast({
        message: 'Select at least one bill category.',
        severity: 'warning',
        ttl: 2500,
      });
      return;
    }

    if (moduleAnalysis.conflicts.length > 0) {
      pushToast({
        message: 'Resolve rider conflicts before introducing the bill.',
        severity: 'warning',
        ttl: 3000,
      });
      return;
    }

    LegislationSystem.draftBill(synthesised);
    pushToast({
      message: `Drafted: ${synthesised.title}`,
      severity: 'success',
      ttl: 3000,
    });
    onSubmitted();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Draft legislation"
      data-testid="draft-legislation-screen"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl bg-bg-secondary rounded-lg border border-bg-tertiary shadow-2xl max-h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b border-bg-tertiary px-5 py-3">
          <div className="flex-1">
            <p className="font-mono text-label uppercase tracking-widest text-text-muted">
              {baseTemplate.id === 'bill-blank-canvas'
                ? 'Drafting from blank canvas'
                : `Drafting from template - ${baseTemplate.title}`}
            </p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="draft-title-input"
              className="w-full bg-transparent border-b border-rule font-headline text-xl text-accent-gold focus:outline-none focus:border-accent-gold py-1"
              aria-label="Bill title"
            />
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              data-testid="draft-purpose-input"
              rows={3}
              className="w-full mt-2 bg-bg-primary/30 border border-rule rounded-sm px-3 py-2 text-body text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-gold/60"
              aria-label="Bill purpose"
              placeholder="Describe what this bill changes and who it affects."
            />
            <div className="mt-2" data-testid="draft-tag-picker">
              <p className="font-mono text-[0.625rem] uppercase tracking-widest text-text-muted mb-1">
                Bill categories
              </p>
              <div className="flex flex-wrap gap-1.5">
                {POLICY_TAG_OPTIONS.map((tag) => {
                  const active = selectedTags.has(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={
                        'px-2 py-0.5 rounded-sm border text-[0.6875rem] uppercase tracking-wide transition-colors ' +
                        (active
                          ? 'border-accent-gold bg-accent-gold/15 text-accent-gold'
                          : 'border-rule text-text-secondary hover:border-rule-strong')
                      }
                      aria-pressed={active}
                      data-testid={`draft-tag-${tag}`}
                    >
                      {formatTag(tag)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="draft-cancel">
            Cancel
          </Button>
        </header>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-0 overflow-hidden">
          {/* Left column — modules + preview text. */}
          <div className="px-5 py-4 overflow-y-auto game-scroll space-y-5">
            <section>
              <h3 className="font-mono text-label uppercase tracking-widest text-text-muted mb-2">
                Policy modules
              </h3>
              <p className="text-body text-text-secondary leading-relaxed mb-3">
                Modules attach as riders to the bill. Each one shifts opposition, budget impact, and
                the on-enactment effects. Toggle to include, then order the active rider stack in
                the forecast rail.
              </p>
              <div className="grid sm:grid-cols-[1fr_180px] gap-2 mb-3">
                <input
                  value={moduleSearch}
                  onChange={(e) => setModuleSearch(e.target.value)}
                  placeholder="Search modules"
                  className="w-full bg-bg-primary/40 border border-rule rounded-sm px-2.5 py-1.5 text-body text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-gold/60"
                  aria-label="Search policy modules"
                  data-testid="policy-module-search"
                />
                <select
                  value={categoryFilter}
                  onChange={(e) =>
                    setCategoryFilter(e.target.value as 'all' | PolicyModule['category'])
                  }
                  className="w-full bg-bg-primary/40 border border-rule rounded-sm px-2.5 py-1.5 text-body text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-gold/60"
                  aria-label="Filter policy modules by category"
                  data-testid="policy-module-category-filter"
                >
                  <option value="all">All categories</option>
                  {MODULE_CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              {visibleModules.length === 0 ? (
                <p className="text-sm text-text-muted italic">
                  No modules match the current filters.
                </p>
              ) : (
                Array.from(groupedVisibleModules.entries()).map(([category, modules]) => (
                  <section key={category} className="mb-3">
                    <h4 className="font-mono text-[0.625rem] uppercase tracking-widest text-text-muted mb-1.5">
                      {category}
                    </h4>
                    <ul className="grid sm:grid-cols-2 gap-2" data-testid="policy-module-list">
                      {modules.map((m) => {
                        const active = activeModuleIds.includes(m.id);
                        return (
                          <li key={m.id}>
                            <button
                              type="button"
                              onClick={() => toggleModule(m.id)}
                              data-testid={`policy-module-${m.id}`}
                              data-active={active}
                              aria-pressed={active}
                              className={
                                'w-full text-left rounded-sm border px-3 py-2 transition-colors ' +
                                (active
                                  ? 'bg-bg-primary border-accent-gold ring-1 ring-accent-gold/40'
                                  : 'bg-bg-primary/40 border-rule hover:border-rule-strong')
                              }
                            >
                              <div className="flex items-baseline justify-between gap-2 mb-1">
                                <span
                                  className={
                                    'font-headline text-body ' +
                                    (active ? 'text-accent-gold' : 'text-text-primary')
                                  }
                                >
                                  {m.name}
                                </span>
                                <span className="font-mono text-[0.625rem] uppercase tracking-widest text-text-muted">
                                  {moduleRoleLabel(m.strategicRole)}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1 mb-2 font-mono text-[0.625rem] uppercase tracking-wider text-text-muted">
                                <span className="rounded-sm bg-bg-tertiary/70 px-1.5 py-0.5">
                                  {m.category}
                                </span>
                                {m.recommendedTags?.slice(0, 2).map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded-sm bg-bg-tertiary/40 px-1.5 py-0.5"
                                  >
                                    {formatTag(tag)}
                                  </span>
                                ))}
                              </div>
                              <p className="text-body text-text-secondary leading-snug">
                                <TermText text={m.summary} />
                              </p>
                              <div className="flex flex-wrap gap-1 mt-2 font-mono text-[0.6875rem] tabular-nums">
                                <DeltaChip
                                  label="Opposition"
                                  value={m.oppositionDelta}
                                  invertGood
                                />
                                <DeltaChip label="Budget" value={m.budgetImpactDelta} suffix="B" />
                                <DeltaChip label="Complexity" value={moduleComplexity(m)} />
                                <DeltaChip label="Appeal" value={modulePublicAppeal(m)} />
                              </div>
                              {m.effects.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1 text-[0.6875rem] text-text-muted">
                                  {m.effects.slice(0, 3).map((effect, index) => (
                                    <span
                                      key={`${m.id}-effect-${index}`}
                                      className="rounded-sm bg-bg-tertiary/40 px-1.5 py-0.5"
                                    >
                                      {summarizeEffect(effect)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))
              )}
            </section>

            <section>
              <h3 className="font-mono text-label uppercase tracking-widest text-text-muted mb-2">
                Hypothetical bill text
              </h3>
              <article
                className="bg-bg-primary/50 border border-rule rounded-sm px-4 py-3 font-serif text-body text-text-primary leading-relaxed"
                data-testid="bill-preview"
              >
                {billText}
              </article>
            </section>
          </div>

          {/* Right column — sticky climate forecast. */}
          <aside
            className="border-l border-bg-tertiary px-5 py-4 bg-bg-primary/30 overflow-y-auto game-scroll space-y-4"
            data-testid="climate-forecast"
          >
            <section>
              <h3 className="font-mono text-label uppercase tracking-widest text-text-muted mb-2">
                Climate forecast
              </h3>
              <div
                className="rounded-sm bg-bg-secondary border border-rule px-3 py-2"
                data-testid="climate-forecast-pass"
              >
                <p className="font-mono text-[0.625rem] uppercase tracking-widest text-text-muted">
                  Estimated passage chance
                </p>
                <p
                  className={
                    'font-mono text-data-md tabular-nums ' +
                    (forecast > 0.55
                      ? 'text-status-success'
                      : forecast < 0.4
                        ? 'text-status-danger'
                        : 'text-text-primary')
                  }
                >
                  {Math.round(forecast * 100)}%
                </p>
              </div>
            </section>

            <section>
              <h3 className="font-mono text-label uppercase tracking-widest text-text-muted mb-2">
                Composed totals
              </h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <Stat label="Opposition" value={`${synthesised.opposition}`} />
                <Stat label="Budget impact" value={`$${synthesised.budgetImpact}B/yr`} />
                <Stat label="Categories" value={`${synthesised.tags.length}`} />
                <Stat label="Modules" value={`${activeModules.length}`} />
                <Stat
                  label="Complexity"
                  value={`${moduleAnalysis.complexity}/${MODULE_COMPLEXITY_BUDGET}`}
                />
                <Stat label="Public appeal" value={`${moduleAnalysis.publicAppeal}`} />
              </dl>
            </section>

            <section>
              <h3 className="font-mono text-label uppercase tracking-widest text-text-muted mb-2">
                Opposition math
              </h3>
              <dl className="space-y-1 text-xs text-text-secondary">
                <MathRow label="Base" value={moduleAnalysis.baseOpposition} />
                <MathRow label="Riders" value={moduleAnalysis.moduleOppositionDelta} signed />
                <MathRow label="Complexity" value={moduleAnalysis.complexityPenalty} signed />
                <MathRow label="Fiscal strain" value={moduleAnalysis.fiscalStrainPenalty} signed />
                <MathRow label="Public appeal" value={-moduleAnalysis.publicAppealRelief} signed />
                <MathRow label="Coalition mix" value={-moduleAnalysis.coalitionBonus} signed />
              </dl>
            </section>

            {moduleAnalysis.warnings.length > 0 && (
              <section>
                <h3 className="font-mono text-label uppercase tracking-widest text-text-muted mb-2">
                  Drafting notes
                </h3>
                <ul className="space-y-2">
                  {moduleAnalysis.warnings.map((warning, index) => (
                    <li
                      key={`${warning.severity}-${index}`}
                      className={
                        'rounded-sm border px-2 py-1 text-xs leading-snug ' +
                        warningToneClass(warning.severity)
                      }
                    >
                      {warning.message}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h3 className="font-mono text-label uppercase tracking-widest text-text-muted mb-2">
                Active rider stack
              </h3>
              {activeModules.length === 0 ? (
                <p className="text-body text-text-muted italic">None. The bill ships as-written.</p>
              ) : (
                <ol className="space-y-2">
                  {activeModules.map((m, index) => (
                    <li
                      key={m.id}
                      className="rounded-sm border border-rule bg-bg-secondary/60 px-2 py-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-accent-gold">
                            {index + 1}. {m.name}
                          </p>
                          <p className="text-xs text-text-muted">
                            {moduleRoleLabel(m.strategicRole)}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => moveModule(m.id, -1)}
                            disabled={index === 0}
                            className="rounded-sm border border-rule px-1.5 py-0.5 text-[0.625rem] uppercase tracking-wider text-text-secondary disabled:opacity-30"
                          >
                            Up
                          </button>
                          <button
                            type="button"
                            onClick={() => moveModule(m.id, 1)}
                            disabled={index === activeModules.length - 1}
                            className="rounded-sm border border-rule px-1.5 py-0.5 text-[0.625rem] uppercase tracking-wider text-text-secondary disabled:opacity-30"
                          >
                            Down
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleModule(m.id)}
                            className="rounded-sm border border-status-danger/50 px-1.5 py-0.5 text-[0.625rem] uppercase tracking-wider text-status-danger"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <Button
              variant="primary"
              size="md"
              onClick={submit}
              disabled={moduleAnalysis.conflicts.length > 0}
              data-testid="draft-submit"
            >
              Introduce bill
            </Button>
          </aside>
        </div>
      </div>
    </div>
  );
}

/**
 * Compose the player-facing "bill text" preview. This is illustrative,
 * not parsed by the engine — it concatenates the template description
 * with each active module's preview phrase, formatted as a single
 * paragraph in legalese-adjacent prose.
 */
export function composeBillText(template: BillTemplate, modules: PolicyModule[]): string {
  const normalizedDescription = template.description.trim() || 'to be defined by the sponsor';
  const opening = `An Act ${normalizedDescription.replace(/\.$/, '')}.`;
  if (modules.length === 0) return opening;

  // Each module reads as a "Whereas" rider phrase, joined into a
  // single declarative sentence. Order follows the player's toggle
  // order to keep the preview stable across re-renders.
  const riders = modules.map((m, i) => {
    const sep = i === 0 ? 'The Act ' : '; further, the Act ';
    return `${sep}${m.previewText}`;
  });
  return `${opening} ${riders.join('')}.`;
}

/**
 * Tiny stat tile — pair of label + numeric value, used in the
 * forecast rail. Pulled out so the rail JSX stays scannable.
 */
function Stat({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="bg-bg-secondary/60 rounded-sm px-2 py-1">
      <dt className="font-mono text-[0.625rem] uppercase tracking-widest text-text-muted">
        {label}
      </dt>
      <dd className="font-mono text-body text-text-primary tabular-nums">{value}</dd>
    </div>
  );
}

/** Row in the forecast math ledger. Signed values show contribution direction. */
function MathRow({
  label,
  value,
  signed,
}: {
  label: string;
  value: number;
  signed?: boolean;
}): JSX.Element {
  const rendered = signed && value > 0 ? `+${value}` : `${value}`;
  const tone =
    value > 0 ? 'text-status-danger' : value < 0 ? 'text-status-success' : 'text-text-muted';
  return (
    <div className="flex items-center justify-between gap-2">
      <dt>{label}</dt>
      <dd className={`font-mono tabular-nums ${signed ? tone : 'text-text-primary'}`}>
        {rendered}
      </dd>
    </div>
  );
}

/** Tone classes for analysis warnings. */
function warningToneClass(severity: 'info' | 'warning' | 'danger'): string {
  switch (severity) {
    case 'info':
      return 'border-rule bg-bg-tertiary/40 text-text-secondary';
    case 'warning':
      return 'border-accent-gold/50 bg-accent-gold/10 text-accent-gold';
    case 'danger':
      return 'border-status-danger/50 bg-status-danger/10 text-status-danger';
    default: {
      const exhaustive: never = severity;
      return exhaustive;
    }
  }
}

/**
 * Coloured signed-number chip for module deltas. `invertGood` flips
 * the colour ramp so falling-opposition reads as a positive number
 * (lower opposition is good news) without confusing the player.
 */
function DeltaChip({
  label,
  value,
  suffix,
  invertGood,
}: {
  label: string;
  value: number;
  suffix?: string;
  invertGood?: boolean;
}): JSX.Element {
  const goodNews = invertGood ? value < 0 : value > 0;
  const tone =
    value === 0
      ? 'text-text-muted bg-bg-tertiary/60'
      : goodNews
        ? 'text-status-success bg-status-success/10'
        : 'text-status-danger bg-status-danger/10';
  const sign = value > 0 ? '+' : '';
  return (
    <span className={`px-1.5 py-0.5 rounded-sm ${tone}`}>
      {label} {sign}
      {value}
      {suffix ?? ''}
    </span>
  );
}
