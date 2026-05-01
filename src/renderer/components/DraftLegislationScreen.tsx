/**
 * DraftLegislationScreen — deep-customization modal for a new bill.
 *
 * Closes docs/todo.md item 40. Replaces the one-click "Draft" button
 * with an interactive screen where the player:
 *   - Edits the bill's title and picks a **legal vehicle** (Resolution /
 *     Act / Constitutional Amendment / Appropriations). The vehicle drives
 *     opposition + per-stage PC cost; see `docs/LEGISLATION_OVERHAUL_PLAN.md`
 *     §3.1.
 *   - Toggles **policy modules** in/out of the bill. Each module
 *     contributes additive deltas to opposition and budget impact,
 *     plus its own `Effect`s. Active modules can be **drag-reordered**
 *     in the right rail; later modules win on conflicting effect targets.
 *   - Reads a synthesised "hypothetical bill text" assembled from
 *     the base description plus each active module's preview phrase.
 *   - Sees a **climate forecast** card recomputed live from
 *     `LegislationSystem.estimatePassageChance` against the
 *     synthesised template.
 *   - Reads a contextual **Aide Advisory** that warns about hostile
 *     opposition, missing fiscal modules on appropriations bills, etc.
 *   - Reviews a **Mechanical Breakdown** confirmation step before the
 *     bill is actually introduced, with explicit if-passes / if-fails
 *     outcome columns.
 *
 * On submit, we synthesise a `BillTemplate` at runtime and forward
 * it to the existing `LegislationSystem.draftBill` pipeline so the
 * bill enters the same in-flight queue used by the static templates.
 *
 * @module renderer/components/DraftLegislationScreen
 */
import { useEffect, useMemo, useState } from 'react';
import { useScrollLock } from '@/utils/useScrollLock';
import policyModulesData from '@/data/legislation/modules/policy-modules.json';
import { LegislationSystem } from '@/systems/LegislationSystem';
import { useUIStore } from '@/store/uiStore';
import type { BillTemplate, PolicyModule, Effect, BillType } from '@/types';
import { applyBillType, billTypeLabel, BILL_TYPE_MODIFIERS } from '@/utils/billType';
import { selectAideAdvisory } from '@/utils/aideAdvisory';
import { Button } from './Button';
import { TermText } from './tooltip';

/**
 * Treat the JSON import as the authoritative module list. We narrow
 * via `as` because the JSON's effect literals don't quite match the
 * Effect union without a runtime parse — the loader's structure
 * keeps it safe in practice and the validation pass at boot will
 * reject malformed entries.
 */
const POLICY_MODULES = (policyModulesData.modules as PolicyModule[]);

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

export function DraftLegislationScreen({
  baseTemplate,
  onSubmitted,
  onClose,
}: Props): JSX.Element {
  const [title, setTitle] = useState(baseTemplate.title);
  const [billType, setBillType] = useState<BillType>(baseTemplate.type ?? 'act');
  // Ordered list of active module ids. Order matters: drag-reorderable in the
  // right rail; the bill text and the engine's "later module wins" semantics
  // both honour this order.
  const [activeModuleOrder, setActiveModuleOrder] = useState<string[]>([]);
  // Wizard step state. 'compose' is the original drafting screen; 'breakdown'
  // is the read-only confirmation that lists explicit if-passes / if-fails
  // outcomes before the bill is actually introduced.
  const [step, setStep] = useState<'compose' | 'breakdown'>('compose');
  // Drag-and-drop state for reorder of active modules.
  const [dragId, setDragId] = useState<string | null>(null);
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
    () =>
      activeModuleOrder
        .map((id) => POLICY_MODULES.find((m) => m.id === id))
        .filter((m): m is PolicyModule => Boolean(m)),
    [activeModuleOrder],
  );

  /**
   * Compose the synthesised template. Modules contribute additive
   * deltas; effects concat (in module order — later modules win on
   * conflicting targets). The bill `type` flows through so downstream
   * forecasts and the eventual `LegislationSystem.draftBill` call see
   * the same vehicle the player chose.
   */
  const synthesised: BillTemplate = useMemo(() => {
    const opposition = Math.max(
      0,
      Math.min(100, baseTemplate.opposition + activeModules.reduce((s, m) => s + m.oppositionDelta, 0)),
    );
    const budgetImpact = baseTemplate.budgetImpact + activeModules.reduce(
      (s, m) => s + m.budgetImpactDelta,
      0,
    );
    const effects: Effect[] = [
      ...baseTemplate.effects,
      ...activeModules.flatMap((m) => m.effects),
    ];
    return {
      ...baseTemplate,
      title: title.trim() || baseTemplate.title,
      type: billType,
      opposition,
      budgetImpact,
      effects,
    };
  }, [baseTemplate, title, billType, activeModules]);

  // Effective template = synthesised + bill-type modifier. The forecast and
  // the breakdown step both use this so the numbers the player sees match
  // the numbers the engine will actually use at draft time.
  const effective = useMemo(() => applyBillType(synthesised), [synthesised]);

  const forecast = LegislationSystem.estimatePassageChance(effective);

  const billText = useMemo(() => composeBillText(effective, activeModules), [
    effective,
    activeModules,
  ]);

  const advisory = useMemo(
    () => selectAideAdvisory({ synthesised: effective, activeModules }),
    [effective, activeModules],
  );

  function toggleModule(id: string): void {
    setActiveModuleOrder((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  /** Drag-and-drop reorder of the active module list. */
  function reorderActive(targetId: string): void {
    if (!dragId || dragId === targetId) return;
    setActiveModuleOrder((prev) => {
      const without = prev.filter((id) => id !== dragId);
      const targetIdx = without.indexOf(targetId);
      if (targetIdx === -1) return prev;
      return [...without.slice(0, targetIdx), dragId, ...without.slice(targetIdx)];
    });
  }

  function submit(): void {
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
          <div className="flex-1 min-w-0">
            <p className="font-mono text-label uppercase tracking-widest text-text-muted">
              Drafting from template &mdash; {baseTemplate.title}
            </p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="draft-title-input"
              className="w-full bg-transparent border-b border-rule font-headline text-xl text-accent-gold focus:outline-none focus:border-accent-gold py-1"
              aria-label="Bill title"
            />
            {/*
              Bill-type segmented control. The four legal vehicles
              (Resolution, Act, Constitutional Amendment, Appropriations)
              shape the opposition floor and per-stage PC cost; see
              docs/LEGISLATION_OVERHAUL_PLAN.md §3.1.
            */}
            <div
              className="mt-2 flex flex-wrap gap-1"
              role="radiogroup"
              aria-label="Bill type"
              data-testid="bill-type-selector"
            >
              {(Object.keys(BILL_TYPE_MODIFIERS) as BillType[]).map((t) => {
                const selected = billType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    data-testid={`bill-type-${t}`}
                    data-active={selected}
                    onClick={() => setBillType(t)}
                    className={
                      'px-2.5 py-1 rounded-sm font-mono text-[0.6875rem] uppercase tracking-widest border transition-colors ' +
                      (selected
                        ? 'bg-accent-gold/20 border-accent-gold text-accent-gold'
                        : 'bg-bg-primary/40 border-rule text-text-secondary hover:border-rule-strong')
                    }
                    title={BILL_TYPE_MODIFIERS[t].description}
                  >
                    {billTypeLabel(t)}
                  </button>
                );
              })}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="draft-cancel">
            Cancel
          </Button>
        </header>

        {step === 'compose' ? (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-0 overflow-hidden">
          {/* Left column — modules + preview text. */}
          <div className="px-5 py-4 overflow-y-auto game-scroll space-y-5">
            <section>
              <h3 className="font-mono text-label uppercase tracking-widest text-text-muted mb-2">
                Policy modules
              </h3>
              <p className="text-body text-text-secondary leading-relaxed mb-3">
                Modules attach as riders to the bill. Each one shifts opposition,
                budget impact, and the on-enactment effects. Toggle to include.
              </p>
              <ul className="grid sm:grid-cols-2 gap-2" data-testid="policy-module-list">
                {POLICY_MODULES.map((m) => {
                  const active = activeModuleOrder.includes(m.id);
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
                          <DeltaChip label="Opposition" value={m.oppositionDelta} invertGood />
                          <DeltaChip label="Budget" value={m.budgetImpactDelta} suffix="B" />
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
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

          {/* Right column — sticky climate forecast + aide advisory. */}
          <aside
            className="border-l border-bg-tertiary px-5 py-4 bg-bg-primary/30 overflow-y-auto game-scroll space-y-4"
            data-testid="climate-forecast"
          >
            {advisory && (
              <section
                className={
                  'rounded-sm border px-3 py-2 ' +
                  (advisory.tone === 'warning'
                    ? 'border-status-danger/60 bg-status-danger/10'
                    : advisory.tone === 'positive'
                      ? 'border-status-success/60 bg-status-success/10'
                      : 'border-rule bg-bg-secondary/60')
                }
                data-testid="aide-advisory"
                data-tone={advisory.tone}
              >
                <p className="font-mono text-[0.625rem] uppercase tracking-widest text-text-muted mb-0.5">
                  Aide says
                </p>
                <p
                  className={
                    'font-headline text-body leading-snug ' +
                    (advisory.tone === 'warning'
                      ? 'text-status-danger'
                      : advisory.tone === 'positive'
                        ? 'text-status-success'
                        : 'text-text-primary')
                  }
                >
                  {advisory.headline}
                </p>
                {advisory.detail && (
                  <p className="text-body text-text-secondary leading-snug mt-1">
                    {advisory.detail}
                  </p>
                )}
              </section>
            )}

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
                <Stat label="Type" value={billTypeLabel(billType)} />
                <Stat label="Opposition" value={`${effective.opposition}`} />
                <Stat label="Budget impact" value={`$${effective.budgetImpact}B/yr`} />
                <Stat label="Modules" value={`${activeModules.length}`} />
              </dl>
            </section>

            <section>
              <h3 className="font-mono text-label uppercase tracking-widest text-text-muted mb-2">
                Active riders
              </h3>
              {activeModules.length === 0 ? (
                <p className="text-body text-text-muted italic">
                  None. The bill ships as-written.
                </p>
              ) : (
                <ul className="space-y-1" data-testid="active-rider-list">
                  {activeModules.map((m, idx) => (
                    <li
                      key={m.id}
                      draggable
                      onDragStart={() => setDragId(m.id)}
                      onDragEnd={() => setDragId(null)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => reorderActive(m.id)}
                      data-testid={`active-rider-${m.id}`}
                      data-drag-index={idx}
                      className={
                        'group flex items-center gap-2 cursor-grab active:cursor-grabbing rounded-sm border px-2 py-1 ' +
                        (dragId === m.id
                          ? 'border-accent-gold bg-bg-secondary'
                          : 'border-rule/40 hover:border-rule')
                      }
                    >
                      <span
                        aria-hidden="true"
                        className="font-mono text-[0.625rem] text-text-muted select-none"
                        title="Drag to reorder. Later modules win on conflicting effects."
                      >
                        ⋮⋮
                      </span>
                      <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-text-muted tabular-nums">
                        {idx + 1}.
                      </span>
                      <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-accent-gold flex-1 truncate">
                        {m.name}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <Button
              variant="primary"
              size="md"
              onClick={() => setStep('breakdown')}
              data-testid="draft-review"
            >
              Review &amp; introduce
            </Button>
          </aside>
        </div>
        ) : (
          <BreakdownStep
            template={effective}
            activeModules={activeModules}
            forecast={forecast}
            onBack={() => setStep('compose')}
            onConfirm={submit}
          />
        )}
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
  const opening = `An Act ${template.description.replace(/\.$/, '')}.`;
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

/**
 * Mechanical breakdown — the read-only commit step.
 *
 * Renders an explicit if-passes / if-fails outcome for the synthesised bill
 * before the player calls `LegislationSystem.draftBill`. The "if passes"
 * column iterates the effects via a small inline describer; "if fails"
 * lists the consequences of a defeat at a coarser level (PC sunk,
 * opposition cohort hardening, retry cooldown).
 *
 * Designed to be the kind of summary a chief-of-staff would put on the
 * desk before the senator signs the introduction sheet.
 */
function BreakdownStep({
  template,
  activeModules,
  forecast,
  onBack,
  onConfirm,
}: {
  template: BillTemplate;
  activeModules: PolicyModule[];
  forecast: number;
  onBack: () => void;
  onConfirm: () => void;
}): JSX.Element {
  return (
    <div
      className="px-5 py-4 overflow-y-auto game-scroll"
      data-testid="breakdown-step"
    >
      <p className="font-mono text-label uppercase tracking-widest text-text-muted mb-3">
        Mechanical breakdown — review before introducing
      </p>

      <div className="grid lg:grid-cols-2 gap-4">
        <section
          className="rounded-sm border border-status-success/40 bg-status-success/5 px-4 py-3"
          data-testid="breakdown-pass-column"
        >
          <h3 className="font-headline text-status-success text-lg mb-2">
            If the bill passes
          </h3>
          {template.effects.length === 0 ? (
            <p className="text-body text-text-muted italic">
              No mechanical effects — the bill is rhetorical.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {template.effects.map((eff, i) => (
                <li
                  key={i}
                  className="text-body text-text-primary leading-snug"
                >
                  &bull; {breakdownEffectLine(eff)}
                </li>
              ))}
            </ul>
          )}
          <p className="text-body text-text-secondary leading-snug mt-3">
            Budget impact: <span className="font-mono tabular-nums text-text-primary">${template.budgetImpact}B/yr</span>.
            Implementation in {template.implementationDays} days.
          </p>
        </section>

        <section
          className="rounded-sm border border-status-danger/40 bg-status-danger/5 px-4 py-3"
          data-testid="breakdown-fail-column"
        >
          <h3 className="font-headline text-status-danger text-lg mb-2">
            If the bill fails
          </h3>
          <ul className="space-y-1.5 text-body text-text-primary leading-snug">
            <li>
              &bull; <strong>PC sunk:</strong> the political capital you spent advancing the bill through committee and the floor will not return.
            </li>
            <li>
              &bull; <strong>Opposition hardens:</strong> cohorts that fought this bill will be quicker to mobilise against the next one in the same family.
            </li>
            <li>
              &bull; <strong>Retry cooldown:</strong> the parliamentarian will block a near-identical reintroduction for the rest of the session.
            </li>
            {template.type === 'amendment' && (
              <li>
                &bull; <strong>Amendment failure is loud.</strong> A failed amendment is a defining vote — expect headlines and primary challenges.
              </li>
            )}
          </ul>
        </section>
      </div>

      <section className="mt-4 rounded-sm border border-rule bg-bg-primary/40 px-4 py-3">
        <h3 className="font-mono text-label uppercase tracking-widest text-text-muted mb-2">
          Final summary
        </h3>
        <dl className="grid sm:grid-cols-4 gap-3 text-sm">
          <Stat label="Type" value={billTypeLabel(template.type ?? 'act')} />
          <Stat label="Opposition" value={`${template.opposition}`} />
          <Stat label="Riders" value={`${activeModules.length}`} />
          <Stat label="Floor estimate" value={`${Math.round(forecast * 100)}%`} />
        </dl>
      </section>

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="ghost" size="md" onClick={onBack} data-testid="breakdown-back">
          Back to drafting
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={onConfirm}
          data-testid="breakdown-confirm"
        >
          Confirm &amp; introduce
        </Button>
      </div>
    </div>
  );
}

/**
 * Render a single Effect as a one-line, plain-English bullet for the
 * mechanical breakdown. Kept inline (rather than reusing the existing
 * `describeEffect` in `Game.tsx` / `QuestsPanel.tsx`) because the
 * breakdown wants slightly different phrasing — "the bill" as the
 * grammatical subject — than the toast-style describer those callers
 * use. Defensive: the Effect union expands over time, so we string-
 * format unknown shapes from the JSON tag without throwing.
 */
function breakdownEffectLine(eff: Effect): string {
  // The Effect type is a discriminated union over `type`; we cast to a
  // permissive shape because new effect kinds will appear in JSON before
  // they appear in the type, and we want to surface them gracefully.
  const e = eff as unknown as { type: string; [k: string]: unknown };
  const value = typeof e.value === 'number' ? e.value : null;
  const sign = value === null ? '' : value > 0 ? '+' : '';
  switch (e.type) {
    case 'economy':
      return `Adjusts ${e.metric ?? 'a metric'} by ${sign}${value ?? '?'}.`;
    case 'group_happiness':
      return `${sign}${value ?? '?'} happiness for ${e.group ?? 'a cohort'}.`;
    case 'group_loyalty':
      return `${sign}${value ?? '?'} loyalty among ${e.group ?? 'a cohort'}.`;
    case 'resource':
      return `${sign}${value ?? '?'} ${e.resource ?? 'resource'}.`;
    case 'flag':
      return `Sets flag '${e.key ?? '?'}' to ${String(e.value ?? true)}.`;
    default:
      return `${e.type}${value !== null ? `: ${sign}${value}` : ''}.`;
  }
}
