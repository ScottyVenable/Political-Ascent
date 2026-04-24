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
  stats: CoreStats;
  traits: TraitId[];
  ideology: IdeologyPoint;

  /** Experience points; contributes to levelling. */
  xp: number;
  level: number;
  skillPoints: number;
  unlockedSkills: string[];

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
