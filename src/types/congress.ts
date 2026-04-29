import type { IdeologyPoint, NpcId } from './common';
import type { PolicyTag } from './legislation';

export type Party = 'D' | 'R' | 'I';

export type LegislatorChamber = 'senate' | 'house';

export type LegislatorPersonality =
  | 'loyalist'
  | 'maverick'
  | 'opportunist'
  | 'ideologue'
  | 'pragmatist';

/**
 * Coarse gender label used for filter UX and pronoun selection in
 * surface text. Two-value enum is intentional for procedural NPCs;
 * a richer identity model would require player-character expansion
 * and is deferred (todo#55).
 */
export type LegislatorGender = 'F' | 'M';

/** A seat in Congress, procedurally generated from a scenario seed. */
export interface Legislator {
  id: NpcId;
  name: string;
  chamber: LegislatorChamber;
  party: Party;
  state: string;
  district?: number; // House only
  ideology: IdeologyPoint;
  priorities: PolicyTag[];
  personality: LegislatorPersonality;
  /** −100 (adversary) to +100 (loyal ally). */
  relationship: number;
  /** Hidden compromise index, 0–100. */
  leverage: number;
  /** Cumulative voting record (billId → vote). */
  votingHistory: Record<string, 'yea' | 'nay' | 'abstain'>;
  termEndsYear: number;
  /**
   * Years of age at scenario start. Drifts upward yearly via the
   * congress weeklyUpdate loop (currently static at MVP).
   */
  age: number;
  /** Procedural gender label; see {@link LegislatorGender}. */
  gender: LegislatorGender;
  /**
   * Personal net worth in USD, log-normal distributed.
   * Roughly $250k median, occasional outliers up to ~$50M.
   * Used by filters/sort and surfaced in member tooltip/modal.
   */
  wealth: number;
}
