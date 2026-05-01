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
 * Drag-and-drop ordering of modules is intentionally deferred — the
 * click-to-toggle interaction is honest about scope and matches the
 * "stack of riders" mental model for now.
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
  const [activeModuleIds, setActiveModuleIds] = useState<Set<string>>(new Set());
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

  const activeModules = useMemo(
    () => POLICY_MODULES.filter((m) => activeModuleIds.has(m.id)),
    [activeModuleIds],
  );

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

  /**
   * Compose the synthesised template. Modules contribute additive
   * deltas; effects concat. We rebuild the template object every
   * time so the forecast / preview always reflect the current state.
   */
  const synthesised: BillTemplate = useMemo(() => {
    const opposition = Math.max(
      0,
      Math.min(
        100,
        baseTemplate.opposition + activeModules.reduce((s, m) => s + m.oppositionDelta, 0),
      ),
    );
    const budgetImpact =
      baseTemplate.budgetImpact + activeModules.reduce((s, m) => s + m.budgetImpactDelta, 0);
    const effects: Effect[] = [...baseTemplate.effects, ...activeModules.flatMap((m) => m.effects)];
    return {
      ...baseTemplate,
      title: title.trim() || baseTemplate.title,
      description: purpose.trim() || baseTemplate.description,
      tags: selectedTags.size > 0 ? [...selectedTags] : baseTemplate.tags,
      opposition,
      budgetImpact,
      effects,
    };
  }, [baseTemplate, title, purpose, selectedTags, activeModules]);

  const forecast = LegislationSystem.estimatePassageChance(synthesised);

  const billText = useMemo(
    () => composeBillText(synthesised, activeModules),
    [synthesised, activeModules],
  );

  function toggleModule(id: string): void {
    setActiveModuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
                the on-enactment effects. Toggle to include.
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
                        const active = activeModuleIds.has(m.id);
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
                                  {m.category}
                                </span>
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
                              </div>
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
                <Stat label="Effects" value={`${synthesised.effects.length}`} />
              </dl>
            </section>

            <section>
              <h3 className="font-mono text-label uppercase tracking-widest text-text-muted mb-2">
                Active riders
              </h3>
              {activeModules.length === 0 ? (
                <p className="text-body text-text-muted italic">None. The bill ships as-written.</p>
              ) : (
                <ul className="space-y-1">
                  {activeModules.map((m) => (
                    <li
                      key={m.id}
                      className="font-mono text-[0.6875rem] uppercase tracking-wider text-accent-gold"
                    >
                      &bull; {m.name}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <Button variant="primary" size="md" onClick={submit} data-testid="draft-submit">
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
