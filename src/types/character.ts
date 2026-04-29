import type { IdeologyPoint, TraitId } from './common';
import type { CardInstance } from './card';

/** The three player background archetypes. See GDD §5.1. */
export type Background = 'citizen' | 'veteran' | 'executive';

/** Named core stats from GDD §5.2. Values are clamped 1–10. */
export interface CoreStats {
  charisma: number;
  strategy: number;
  connections: number;
  integrity: number;
  wealth: number;
  stamina: number;
}

export type StatName = keyof CoreStats;

/** Persisted player character state. */
export interface CharacterState {
  id: string;
  name: string;
  background: Background;
  /**
   * Selected avatar preset id. The game ships a curated set of symbolic
   * presets (see `src/data/avatars/`); custom-uploaded portraits are out
   * of scope (no AI-generated imagery, per AGENTS.md §2.9). Optional so
   * old saves continue to load — the renderer falls back to the first
   * preset when the field is absent.
   */
  avatarId?: string;
  stats: CoreStats;
  traits: TraitId[];
  ideology: IdeologyPoint;

  /** Experience points; contributes to levelling. */
  xp: number;
  level: number;
  skillPoints: number;
  unlockedSkills: string[];

  /**
   * The character's current personal net worth in US dollars.
   * Distinct from Political Capital — this is actual money the
   * character has available to fund their campaign, bribe officials
   * (via card effects), or deploy as a 'wealth' resource.
   *
   * Starts based on the character's background and `wealth` stat:
   *   citizen  — $50k × wealth
   *   veteran  — $60k × wealth
   *   executive — $200k × wealth
   *
   * Increases through salary (office pay), investments, speaking fees,
   * and card effects. Can decrease through campaign spending and fines.
   */
  personalFunds: number;

  /**
   * The US state the character represents or comes from (e.g. "CA", "TX").
   * Used by the Population panel to filter cohort views to state-level
   * data, and by Congress to highlight the player's own senators/reps.
   * Optional for backwards-compat with saves that predate this field.
   */
  homeState?: string;

  /**
   * The congressional district number within `homeState` (1-based).
   * Relevant when the player's role is a House representative.
   * Optional; undefined if the character is a senator or the field
   * predates this schema version.
   */
  homeDistrict?: number;

  /** Cards currently in hand. */
  hand: CardInstance[];
  /** Entire player-owned collection (source for the hand). */
  deck: CardInstance[];
}

/** Static trait definition loaded from `src/data/traits/traits.json`. */
export interface TraitDefinition {
  id: TraitId;
  name: string;
  description: string;
  /** Which background the trait is native to. `null` if universal. */
  nativeBackground: Background | null;
  /** Short mechanical summary for tooltip. */
  effectSummary: string;
  tags: string[];
}
