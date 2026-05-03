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

class FactionSystemImpl implements FactionSystemAPI {
  private state: FactionSystemState = {
    factions: {},
    standings: {},
  };

  registerFactions(factions: readonly FactionDefinition[]): void {
    const nextFactions: Record<FactionId, FactionDefinition> = { ...this.state.factions };
    const nextStandings: FactionStandings = { ...this.state.standings };

    for (const faction of factions) {
      nextFactions[faction.id] = faction;
      if (nextStandings[faction.id] === undefined) {
        nextStandings[faction.id] = 0;
      }
    }

    this.state = {
      factions: nextFactions,
      standings: nextStandings,
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
    // Scaffold hook for M2 policy fallout plumbing.
    // Input is fully wired so future implementations can branch on pass/fail + tags.
    void input.billId;
    void input.passed;
    void input.tags;

    if (!input.sponsorFactionId) {
      return;
    }

    const current = this.state.standings[input.sponsorFactionId] ?? 0;
    // Minimal real behavior: sponsor faction reacts to outcome polarity.
    const delta = input.passed ? 2 : -2;
    this.setStanding(input.sponsorFactionId, current + delta);
  }
}

export const FactionSystem: FactionSystemAPI = new FactionSystemImpl();
