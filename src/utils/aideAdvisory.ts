/**
 * Aide Advisory — pure rules engine for the drafting wizard.
 *
 * Reads the synthesised bill the player is currently composing and returns
 * the highest-priority piece of advice the chief-of-staff would give them.
 * Rule order matters: the first matching rule wins, so place high-priority
 * rules at the top.
 *
 * Returning `null` is meaningful — it means "no advisory needed", and the UI
 * hides the panel rather than showing a fake "you're doing great" message.
 *
 * Documented in `docs/LEGISLATION_OVERHAUL_PLAN.md` §3.3.
 *
 * @module utils/aideAdvisory
 */
import type { BillTemplate, PolicyModule } from '@/types';

export interface AideAdvisory {
  /** Headline advice (≤ 80 chars). */
  headline: string;
  /** Optional second line with the *why* of the advice. */
  detail?: string;
  /** Severity drives the colour of the panel. */
  tone: 'warning' | 'info' | 'positive';
}

interface AideContext {
  synthesised: BillTemplate;
  activeModules: PolicyModule[];
}

interface AideRule {
  id: string;
  test: (ctx: AideContext) => boolean;
  build: (ctx: AideContext) => AideAdvisory;
}

/**
 * Static ordered rules. Earliest-true wins. Each rule is small and
 * single-purpose so adding a new one is a one-screen change.
 */
const RULES: AideRule[] = [
  {
    id: 'appropriations-no-fiscal',
    test: ({ synthesised, activeModules }) =>
      synthesised.type === 'appropriations' &&
      !activeModules.some((m) => m.category === 'fiscal'),
    build: () => ({
      headline: 'Appropriations bill needs a fiscal module.',
      detail: 'Add a revenue or spending rider before introducing — the parliamentarian will block it otherwise.',
      tone: 'warning',
    }),
  },
  {
    id: 'amendment-low-coalition',
    test: ({ synthesised }) =>
      synthesised.type === 'amendment' && synthesised.opposition >= 65,
    build: () => ({
      headline: 'Amendment opposition is at floor levels.',
      detail: 'You need 2/3 in both chambers. Trim hostile riders or recruit a bipartisan co-sponsor first.',
      tone: 'warning',
    }),
  },
  {
    id: 'opposition-very-high',
    test: ({ synthesised }) => synthesised.opposition >= 75,
    build: ({ activeModules }) => ({
      headline: 'Opposition above 75 — the floor is hostile.',
      detail: activeModules.some((m) => m.id === 'module-sunset-clause')
        ? 'Sunset clause is in. Consider trimming a contentious rider.'
        : 'Consider attaching a Sunset Clause to bound the political cost.',
      tone: 'warning',
    }),
  },
  {
    id: 'budget-very-negative',
    test: ({ synthesised }) => synthesised.budgetImpact <= -30,
    build: () => ({
      headline: 'Bill costs more than $30B/yr.',
      detail: 'You will lose fiscal-conservative caucus members. A revenue offset module would steady the floor count.',
      tone: 'warning',
    }),
  },
  {
    id: 'no-modules',
    test: ({ activeModules }) => activeModules.length === 0,
    build: () => ({
      headline: 'No riders attached. The bill reads generic.',
      detail: 'Cohorts may not see themselves in it. A constituency-aligned module sharpens base support.',
      tone: 'info',
    }),
  },
  {
    id: 'too-many-modules',
    test: ({ activeModules }) => activeModules.length >= 5,
    build: () => ({
      headline: 'Five or more riders — Christmas-tree risk.',
      detail: 'A bloated bill draws attacks from every direction. The floor manager will struggle to whip it.',
      tone: 'info',
    }),
  },
  {
    id: 'clean-bill',
    test: ({ synthesised, activeModules }) =>
      activeModules.length >= 2 &&
      activeModules.length <= 3 &&
      synthesised.opposition <= 45 &&
      synthesised.budgetImpact > -15,
    build: () => ({
      headline: 'Clean draft. The floor count looks favourable.',
      tone: 'positive',
    }),
  },
];

/**
 * Returns the highest-priority advisory for the current draft, or null when
 * nothing needs saying.
 */
export function selectAideAdvisory(ctx: AideContext): AideAdvisory | null {
  for (const rule of RULES) {
    if (rule.test(ctx)) return rule.build(ctx);
  }
  return null;
}
