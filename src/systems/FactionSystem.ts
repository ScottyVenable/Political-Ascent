export type FactionId = string;

export interface FactionDefinition {
  id: FactionId;
  name: string;
  ideologyAxis?: {
    economic?: number;
    social?: number;
  };
}

export type FactionStandings = Record<FactionId, number>;

export interface BillOutcomeInput {
  billId: string;
  passed: boolean;
  tags: readonly string[];
  sponsorFactionId?: FactionId;
}

export interface FactionSystemState {
  factions: Record<FactionId, FactionDefinition>;
  standings: FactionStandings;
}

export interface FactionSystemAPI {
  registerFactions(factions: readonly FactionDefinition[]): void;
  getState(): FactionSystemState;
  setStanding(factionId: FactionId, value: number): void;
  applyBillOutcome(input: BillOutcomeInput): void;
}

const MIN_STANDING = -100;
const MAX_STANDING = 100;

function clampStanding(value: number): number {
  return Math.max(MIN_STANDING, Math.min(MAX_STANDING, Math.round(value)));
}

export function createDefaultFactionStandings(
  factions: readonly FactionDefinition[],
  existing: FactionStandings = {},
): FactionStandings {
  const nextStandings: FactionStandings = { ...existing };

  for (const faction of factions) {
    if (nextStandings[faction.id] === undefined) {
      nextStandings[faction.id] = 0;
    }
  }

  return nextStandings;
}

export function getBillOutcomeStandingDeltas(input: BillOutcomeInput): FactionStandings {
  if (!input.sponsorFactionId) {
    return {};
  }

  return {
    [input.sponsorFactionId]: input.passed ? 2 : -2,
  };
}

class FactionSystemImpl implements FactionSystemAPI {
  private state: FactionSystemState = {
    factions: {},
    standings: {},
  };

  registerFactions(factions: readonly FactionDefinition[]): void {
    const nextFactions: Record<FactionId, FactionDefinition> = { ...this.state.factions };

    for (const faction of factions) {
      nextFactions[faction.id] = faction;
    }

    this.state = {
      factions: nextFactions,
      standings: createDefaultFactionStandings(factions, this.state.standings),
    };
  }

  getState(): FactionSystemState {
    return {
      factions: { ...this.state.factions },
      standings: { ...this.state.standings },
    };
  }

  setStanding(factionId: FactionId, value: number): void {
    this.state = {
      ...this.state,
      standings: {
        ...this.state.standings,
        [factionId]: clampStanding(value),
      },
    };
  }

  applyBillOutcome(input: BillOutcomeInput): void {
    void input.billId;
    void input.tags;

    const deltas = getBillOutcomeStandingDeltas(input);
    for (const [factionId, delta] of Object.entries(deltas)) {
      const current = this.state.standings[factionId] ?? 0;
      this.setStanding(factionId, current + delta);
    }
  }
}

export const FactionSystem: FactionSystemAPI = new FactionSystemImpl();
