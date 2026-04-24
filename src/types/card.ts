import type { CardId } from './common';
import type { Effect } from './effect';

export type CardType =
  | 'action'
  | 'boost'
  | 'sabotage'
  | 'resource'
  | 'legislation'
  | 'relationship'
  | 'wild';

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

/** Static definition loaded from JSON (`src/data/cards/*.json`). */
export interface CardDefinition {
  id: CardId;
  name: string;
  type: CardType;
  rarity: CardRarity;
  description: string;
  flavorText?: string;
  /** Political-capital cost to play. 0 = free. */
  cost: number;
  effects: Effect[];
  tags: string[];
}

/** An in-game instance of a card. Stable across serialization. */
export interface CardInstance {
  instanceId: string;
  cardId: CardId;
  /** Acquired-on game date (ISO year-month-day). */
  acquiredAt?: string;
}
