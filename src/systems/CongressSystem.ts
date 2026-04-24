import type { Legislator, Party, LegislatorPersonality, PolicyTag, NpcId } from '@/types';
import { useWorldStore } from '@/store/worldStore';
import { SeededRNG } from '@/utils/random';
import { clamp } from '@/utils/math';
import { makeId } from '@/utils/id';

/**
 * CongressSystem — procedural legislator generation and weekly drift.
 *
 * Deterministic from a scenario seed. Produces 100 senators and 435 reps
 * matching a target party split. Weekly update slowly drifts relationship
 * values back toward an NPC-specific baseline so goodwill has to be
 * maintained, not just banked once.
 */
export interface CongressSystemAPI {
  generate(seed: number, partySplit: { D: number; R: number; I?: number }): {
    senate: Legislator[];
    house: Legislator[];
  };
  weeklyUpdate(): void;
}

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

const FIRST_NAMES = [
  'James','Mary','John','Patricia','Robert','Jennifer','Michael','Linda',
  'William','Elizabeth','David','Barbara','Richard','Susan','Joseph','Jessica',
  'Thomas','Sarah','Charles','Karen','Chris','Nancy','Daniel','Lisa',
  'Matthew','Betty','Anthony','Helen','Donald','Sandra','Mark','Donna',
  'Paul','Carol','Steven','Ruth','Andrew','Sharon','Kenneth','Michelle',
  'George','Laura','Joshua','Sarah','Kevin','Kimberly','Brian','Deborah',
];

const LAST_NAMES = [
  'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis',
  'Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson',
  'Thomas','Taylor','Moore','Jackson','Martin','Lee','Perez','Thompson',
  'White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson','Walker',
  'Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Flores',
  'Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell',
];

const PERSONALITIES: LegislatorPersonality[] = [
  'loyalist', 'maverick', 'opportunist', 'ideologue', 'pragmatist',
];

const POLICY_TAGS: PolicyTag[] = [
  'economy','healthcare','education','defense','civil_rights','environment',
  'immigration','criminal_justice','taxation','trade','infrastructure','constitutional',
];

function makeLegislator(
  rng: SeededRNG,
  chamber: 'senate' | 'house',
  state: string,
  district: number | undefined,
  party: Party,
  startYear: number,
): Legislator {
  const id = makeId(`${chamber}-${state}-${district ?? 's'}`, rng) as unknown as NpcId;
  const firstName = rng.pick(FIRST_NAMES);
  const lastName = rng.pick(LAST_NAMES);
  // Party-biased ideology with noise.
  const partyX = party === 'D' ? -0.5 : party === 'R' ? 0.5 : 0;
  const noise = (): number => (rng.next() - 0.5) * 0.6;
  const ideology = {
    x: clamp(partyX + noise(), -1, 1),
    y: clamp(noise(), -1, 1),
  };
  const priorityCount = rng.int(2, 4);
  const priorities = new Set<PolicyTag>();
  while (priorities.size < priorityCount) priorities.add(rng.pick(POLICY_TAGS));
  const termLength = chamber === 'senate' ? 6 : 2;
  return {
    id,
    name: `${firstName} ${lastName}`,
    chamber,
    party,
    state,
    district,
    ideology,
    priorities: Array.from(priorities),
    personality: rng.pick(PERSONALITIES),
    relationship: rng.int(-20, 20),
    leverage: rng.int(0, 30),
    votingHistory: {},
    termEndsYear: startYear + rng.int(1, termLength),
  };
}

/** Distribute a count across states proportional to rough population tiers. */
function houseDistrictsByState(): Record<string, number> {
  // MVP static map totalling 435 — aligned to 2020-census seat counts, approximate.
  const map: Record<string, number> = {
    CA: 52, TX: 38, FL: 28, NY: 26, PA: 17, IL: 17, OH: 15, GA: 14, NC: 14,
    MI: 13, NJ: 12, VA: 11, WA: 10, AZ: 9, MA: 9, TN: 9, IN: 9, MD: 8, MO: 8,
    WI: 8, CO: 8, MN: 8, SC: 7, AL: 7, LA: 6, KY: 6, OR: 6, OK: 5, CT: 5,
    UT: 4, IA: 4, NV: 4, AR: 4, MS: 4, KS: 4, NM: 3, NE: 3, ID: 2, WV: 2,
    HI: 2, NH: 2, ME: 2, MT: 2, RI: 2, DE: 1, SD: 1, ND: 1, AK: 1, VT: 1, WY: 1,
  };
  return map;
}

function pickPartyForSeat(rng: SeededRNG, split: { D: number; R: number; I?: number }): Party {
  const total = split.D + split.R + (split.I ?? 0);
  if (total <= 0) return 'I';
  const roll = rng.next() * total;
  if (roll < split.D) return 'D';
  if (roll < split.D + split.R) return 'R';
  return 'I';
}

export const CongressSystem: CongressSystemAPI = {
  generate(seed, partySplit) {
    const rng = new SeededRNG(seed);
    const startYear = 2025;

    const senate: Legislator[] = [];
    for (const state of US_STATES) {
      for (let s = 0; s < 2; s++) {
        senate.push(
          makeLegislator(rng, 'senate', state, undefined, pickPartyForSeat(rng, partySplit), startYear),
        );
      }
    }

    const house: Legislator[] = [];
    const districts = houseDistrictsByState();
    for (const state of US_STATES) {
      const count = districts[state] ?? 1;
      for (let d = 1; d <= count; d++) {
        house.push(
          makeLegislator(rng, 'house', state, d, pickPartyForSeat(rng, partySplit), startYear),
        );
      }
    }

    return { senate, house };
  },

  weeklyUpdate() {
    const world = useWorldStore.getState();
    // Each legislator's relationship drifts slowly toward 0 (baseline indifference).
    for (const chamber of ['senate', 'house'] as const) {
      for (const l of world.congress[chamber]) {
        const toward = 0;
        const next = l.relationship + (toward - l.relationship) * 0.02;
        world.updateLegislator(l.id, {
          relationship: Math.round(clamp(next, -100, 100)),
        });
      }
    }
  },
};
