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
}
