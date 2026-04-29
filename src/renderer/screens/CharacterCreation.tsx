import { useMemo, useState } from 'react';
import type { Background, CoreStats, IdeologyPoint, TraitId } from '@/types';
import { CharacterSystem } from '@/systems/CharacterSystem';
import { GameEngine } from '@/engine/GameEngine';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { IdeologyCompass } from '../components/IdeologyCompass';
import { Slider } from '../components/Slider';
import { ExtendedTooltip } from '../components/tooltip';
import { useRouter } from '../router';
import { useCharacterStore } from '@/store/characterStore';
import { AvatarPicker } from '../components/AvatarPicker';
import { AvatarMedallion } from '../components/AvatarMedallion';
import { DEFAULT_AVATAR_ID } from '@/data/avatars';
import {
  statTier,
  statTierLabel,
  statTierChipClass,
} from '@/utils/statTier';

/**
 * Map a CoreStats key to its glossary tooltip term id. Keeping this as a
 * static record makes it a typo-checked lookup rather than a string
 * concatenation; renaming a stat key is then a TypeScript error here.
 */
const STAT_TOOLTIP_TERM: Record<keyof CoreStats, string> = {
  charisma: 'stat-charisma',
  strategy: 'stat-strategy',
  connections: 'stat-connections',
  integrity: 'stat-integrity',
  wealth: 'stat-wealth',
  stamina: 'stat-stamina',
};

/** Stat budget bounds — keep in sync with CharacterSystem.validateStatDistribution. */
const BUDGET_MIN = 24;
const BUDGET_MAX = 36;

/**
 * One-line gameplay-impact blurb per stat tier. Surfaced under each
 * stat slider so the player can see *why* a number matters at a
 * glance instead of inferring it from the numeric value (todo#27).
 *
 * Wording targets the role each stat plays in the simulation rather
 * than precise mechanical numbers — the precise multipliers live in
 * the engine and may rebalance during early access. The blurb tells
 * the player which loops a tier opens or closes.
 */
const STAT_IMPACT: Record<keyof CoreStats, Record<ReturnType<typeof statTier>, string>> = {
  charisma: {
    weak: 'Speeches struggle to land. Crowds drift. Endorsements are scarce.',
    average: 'You hold a room. Persuasion checks land at the expected rate.',
    strong: 'You move undecideds. Cards with "rally" effects scale with you.',
    exceptional: 'You shift narratives. Hostile pressers can be turned mid-question.',
  },
  strategy: {
    weak: 'Misreads the room. Whip counts often surprise you.',
    average: 'You see two moves ahead. Your bills survive committee.',
    strong: 'You spot wedge issues before opponents. Coalitions cohere around you.',
    exceptional: 'You shape the calendar. Crisis events find you already prepared.',
  },
  connections: {
    weak: 'Few favours to call in. Donor calls go to voicemail.',
    average: 'A working network. Standard endorsements are reachable.',
    strong: 'Open doors at the leadership level. Faction asks come back warm.',
    exceptional: 'Power-broker access. Off-the-books deals become a routine option.',
  },
  integrity: {
    weak: 'Easily tarred. Scandals stick. Press treats every move as suspect.',
    average: 'A clean enough record. Most ethics challenges glance off.',
    strong: 'Press gives you the benefit of the doubt. Reformer cards land harder.',
    exceptional: 'Untouchable on character. You can wage scandal-driven campaigns.',
  },
  wealth: {
    weak: 'Self-funding is impossible. Every ad buy hurts.',
    average: 'Standard fundraising loop. You can compete in median races.',
    strong: 'Comfortable cushion. You can absorb a bad week without folding.',
    exceptional: 'Access-level money. PAC and SuperPAC tools open up.',
  },
  stamina: {
    weak: 'Burns out. Long campaigns and crisis weeks erode your output.',
    average: 'Holds the standard schedule. AP regen is normal.',
    strong: 'Extra weekly action capacity. You can run two cycles without rest.',
    exceptional: 'Iron health. You set the pace; opponents try to keep up.',
  },
};

/**
 * Suggested base distributions per background. Total = 30 (the centre
 * of the 24–36 budget) so the suggestion is always valid, and each
 * profile leans into the background's natural strengths and away from
 * its weaknesses (todo#28). The numbers are intentionally tame — the
 * Stats step is meant to be where the player makes the *interesting*
 * choices, not where they pick a single optimal preset.
 */
const SUGGESTED_STATS: Record<Background, CoreStats> = {
  citizen: { charisma: 7, strategy: 5, connections: 3, integrity: 7, wealth: 3, stamina: 5 },
  veteran: { charisma: 4, strategy: 7, connections: 6, integrity: 5, wealth: 4, stamina: 4 },
  executive: { charisma: 6, strategy: 5, connections: 6, integrity: 3, wealth: 7, stamina: 3 },
};
const RESET_STATS: CoreStats = {
  charisma: 5,
  strategy: 5,
  connections: 5,
  integrity: 5,
  wealth: 5,
  stamina: 5,
};

/**
 * US state abbreviation → full name list. Used in the home-state picker.
 * Sourced from ISO 3166-2:US; abbreviated to the 50 states + DC.
 */
const US_STATES: { abbr: string; name: string }[] = [
  { abbr: 'AL', name: 'Alabama' }, { abbr: 'AK', name: 'Alaska' },
  { abbr: 'AZ', name: 'Arizona' }, { abbr: 'AR', name: 'Arkansas' },
  { abbr: 'CA', name: 'California' }, { abbr: 'CO', name: 'Colorado' },
  { abbr: 'CT', name: 'Connecticut' }, { abbr: 'DE', name: 'Delaware' },
  { abbr: 'DC', name: 'District of Columbia' }, { abbr: 'FL', name: 'Florida' },
  { abbr: 'GA', name: 'Georgia' }, { abbr: 'HI', name: 'Hawaii' },
  { abbr: 'ID', name: 'Idaho' }, { abbr: 'IL', name: 'Illinois' },
  { abbr: 'IN', name: 'Indiana' }, { abbr: 'IA', name: 'Iowa' },
  { abbr: 'KS', name: 'Kansas' }, { abbr: 'KY', name: 'Kentucky' },
  { abbr: 'LA', name: 'Louisiana' }, { abbr: 'ME', name: 'Maine' },
  { abbr: 'MD', name: 'Maryland' }, { abbr: 'MA', name: 'Massachusetts' },
  { abbr: 'MI', name: 'Michigan' }, { abbr: 'MN', name: 'Minnesota' },
  { abbr: 'MS', name: 'Mississippi' }, { abbr: 'MO', name: 'Missouri' },
  { abbr: 'MT', name: 'Montana' }, { abbr: 'NE', name: 'Nebraska' },
  { abbr: 'NV', name: 'Nevada' }, { abbr: 'NH', name: 'New Hampshire' },
  { abbr: 'NJ', name: 'New Jersey' }, { abbr: 'NM', name: 'New Mexico' },
  { abbr: 'NY', name: 'New York' }, { abbr: 'NC', name: 'North Carolina' },
  { abbr: 'ND', name: 'North Dakota' }, { abbr: 'OH', name: 'Ohio' },
  { abbr: 'OK', name: 'Oklahoma' }, { abbr: 'OR', name: 'Oregon' },
  { abbr: 'PA', name: 'Pennsylvania' }, { abbr: 'RI', name: 'Rhode Island' },
  { abbr: 'SC', name: 'South Carolina' }, { abbr: 'SD', name: 'South Dakota' },
  { abbr: 'TN', name: 'Tennessee' }, { abbr: 'TX', name: 'Texas' },
  { abbr: 'UT', name: 'Utah' }, { abbr: 'VT', name: 'Vermont' },
  { abbr: 'VA', name: 'Virginia' }, { abbr: 'WA', name: 'Washington' },
  { abbr: 'WV', name: 'West Virginia' }, { abbr: 'WI', name: 'Wisconsin' },
  { abbr: 'WY', name: 'Wyoming' },
];

/**
 * Character creation — background → stats → traits → ideology → name.
 *
 * Stat distribution enforces CharacterSystem's 24–36-point budget so players
 * can't type-check around it. Traits are limited to 3 and filtered by
 * background.
 */
export function CharacterCreation(): JSX.Element {
  const navigate = useRouter((s) => s.navigate);

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [background, setBackground] = useState<Background>('citizen');
  const [homeState, setHomeState] = useState<string>('');
  const [homeDistrict, setHomeDistrict] = useState<number | undefined>(undefined);
  const [baseStats, setBaseStats] = useState<CoreStats>({
    charisma: 5,
    strategy: 5,
    connections: 5,
    integrity: 5,
    wealth: 5,
    stamina: 5,
  });
  const [traits, setTraits] = useState<TraitId[]>([]);
  const [ideology, setIdeology] = useState<IdeologyPoint>({ x: 0, y: 0 });
  const [avatarId, setAvatarId] = useState<string>(DEFAULT_AVATAR_ID);

  const finalStats = useMemo(
    () => CharacterSystem.applyBackgroundBonuses(baseStats, background),
    [baseStats, background],
  );
  const validation = useMemo(
    () => CharacterSystem.validateStatDistribution(baseStats),
    [baseStats],
  );
  const availableTraits = useMemo(() => CharacterSystem.availableTraitsFor(background), [background]);

  const traitDefs = useMemo(() => GameEngine.getTraits(), []);
  const scenarios = useMemo(() => GameEngine.getScenarios(), []);

  const setStat = (k: keyof CoreStats, delta: number): void => {
    setBaseStats((s) => {
      const next = Math.max(1, Math.min(10, s[k] + delta));
      return { ...s, [k]: next };
    });
  };

  const totalPoints = Object.values(baseStats).reduce((a, b) => a + b, 0);

  const toggleTrait = (id: TraitId): void => {
    setTraits((list) =>
      list.includes(id) ? list.filter((t) => t !== id) : list.length < 3 ? [...list, id] : list,
    );
  };

  function canAdvance(): boolean {
    if (step === 0) return name.trim().length >= 2;
    if (step === 1) return validation.valid;
    if (step === 2) return traits.length >= 1;
    return true;
  }

  function finish(): void {
    // Compute starting personal funds from background × wealth tier.
    // These multipliers reflect real-world archetypes:
    //   citizen  → middle class, savings of ~50k × wealth (1–10)
    //   veteran  → modest career military pay + discipline, ~60k × wealth
    //   executive → corporate wealth, ~200k × wealth (can exceed $1M easily)
    const FUNDS_BY_BACKGROUND: Record<typeof background, number> = {
      citizen: 50_000,
      veteran: 60_000,
      executive: 200_000,
    };
    const startingFunds = FUNDS_BY_BACKGROUND[background] * (finalStats.wealth ?? 5);

    useCharacterStore.getState().reset();
    useCharacterStore.getState().setCharacter({
      id: `pc-${Date.now()}`,
      name: name.trim(),
      background,
      avatarId,
      stats: finalStats,
      traits,
      ideology,
      xp: 0,
      level: 1,
      skillPoints: 0,
      unlockedSkills: [],
      hand: [],
      deck: [],
      personalFunds: startingFunds,
      homeState: homeState || undefined,
      homeDistrict,
    });
    navigate('scenario-select');
    // Scenario select screen will finalize into GameEngine.startNewGame.
    void scenarios;
  }

  return (
    <div className="min-h-screen bg-bg-primary p-6 md:p-10">
      <header className="max-w-5xl mx-auto flex justify-between items-center mb-6">
        <h1 className="font-headline text-3xl font-bold text-accent-gold">Build Your Candidate</h1>
        <Button variant="ghost" onClick={() => navigate('main-menu')}>← Back</Button>
      </header>

      <div className="max-w-5xl mx-auto">
        <Stepper step={step} />

        {step === 0 && (
          <Card title="Identity" subtitle="Who are you, and where did you come from?">
            <div className="flex items-start gap-4 mb-4">
              {/* Live avatar preview — updates as the player picks a
                  preset below. Sized to be the visual anchor of the
                  step without dominating the form. */}
              <AvatarMedallion avatarId={avatarId} size={72} />
              <label className="block flex-1">
                <span className="text-sm text-text-secondary">Name</span>
                <input
                  className="mt-1 w-full bg-bg-tertiary rounded px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jordan Whitaker"
                  autoFocus
                />
              </label>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              {(['citizen', 'veteran', 'executive'] as const).map((bg) => (
                <button
                  key={bg}
                  onClick={() => setBackground(bg)}
                  className={`text-left rounded p-4 border transition-colors ${
                    background === bg
                      ? 'border-accent-gold bg-bg-tertiary'
                      : 'border-bg-tertiary bg-bg-secondary hover:bg-bg-tertiary'
                  }`}
                >
                  <h4 className="font-headline text-accent-gold capitalize">{bg}</h4>
                  <p className="text-xs text-text-secondary mt-2">{backgroundBlurb(bg)}</p>
                </button>
              ))}
            </div>
            <div className="mt-5">
              <h4 className="font-headline text-sm text-text-secondary uppercase tracking-wide mb-2">
                Avatar
              </h4>
              <p className="text-xs text-text-muted mb-3">
                Pick a preset that fits the candidate you have in mind. You
                can change this later from the Character panel.
              </p>
              <AvatarPicker value={avatarId} onChange={setAvatarId} />
            </div>

            {/* State & District (todo#68) ─────────────────────────────
                Sets the player's home state, which filters Population
                cohort views and highlights their delegation in Congress.
                Optional — the player may skip for a fully national focus. */}
            <div className="mt-5 grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm text-text-secondary">Home State (optional)</span>
                <select
                  className="mt-1 w-full bg-bg-tertiary rounded px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold"
                  value={homeState}
                  onChange={(e) => setHomeState(e.target.value)}
                  data-testid="creator-home-state"
                >
                  <option value="">— National focus (no state) —</option>
                  {US_STATES.map((s) => (
                    <option key={s.abbr} value={s.abbr}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              {homeState && (
                <label className="block">
                  <span className="text-sm text-text-secondary">Congressional District (optional)</span>
                  <input
                    type="number"
                    min={1}
                    max={53}
                    className="mt-1 w-full bg-bg-tertiary rounded px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold"
                    value={homeDistrict ?? ''}
                    onChange={(e) =>
                      setHomeDistrict(
                        e.target.value ? Math.max(1, parseInt(e.target.value, 10)) : undefined,
                      )
                    }
                    placeholder="e.g. 12"
                    data-testid="creator-home-district"
                  />
                  <p className="text-xs text-text-muted mt-1">
                    Leave blank if you represent the whole state (Senate).
                  </p>
                </label>
              )}
            </div>
          </Card>
        )}

        {step === 1 && (
          <Card title="Core Stats" subtitle="Spend your starting points across the six stats.">
            {/* Budget bar — visual progress with a tone that flips to
                warning at the edges. The numeric readout is the source
                of truth; the bar is decoration that makes "you have
                room" or "you're over" obvious without reading. */}
            <StatBudget total={totalPoints} min={BUDGET_MIN} max={BUDGET_MAX} valid={validation.valid} />

            {/* Preset row (todo#28). Two one-click distributions: a
                neutral 5/5/5/5/5/5 reset and a background-tailored
                "Suggested" build that totals 30 and emphasises the
                strengths of the chosen background without ever being
                outright optimal. The aim is a productive starting
                point for new players, not an autopilot button. */}
            <div className="mt-3 flex flex-wrap gap-2" data-testid="stats-presets">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setBaseStats(RESET_STATS)}
                aria-label="Reset all stats to 5"
              >
                Reset to even
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setBaseStats(SUGGESTED_STATS[background])}
                aria-label={`Apply suggested distribution for ${background}`}
              >
                Suggested for {background}
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-3 mt-4">
              {(Object.keys(baseStats) as (keyof CoreStats)[]).map((key) => {
                const finalValue = finalStats[key];
                const tier = statTier(finalValue);
                return (
                  <div key={key} className="bg-bg-tertiary rounded p-3" data-testid={`stat-row-${key}`}>
                    <div className="flex items-baseline justify-between mb-2">
                      {/* Wrap the stat name in an ExtendedTooltip so a
                          hover surfaces what the stat does. The dotted
                          underline is the standard glossary-link cue. */}
                      <ExtendedTooltip term={STAT_TOOLTIP_TERM[key]}>
                        <span
                          tabIndex={0}
                          className="capitalize font-headline text-text-primary cursor-help underline decoration-dotted decoration-accent-gold/50 underline-offset-2 focus:outline-none focus:ring-1 focus:ring-accent-gold rounded-sm"
                          data-testid={`stat-name-${key}`}
                        >
                          {key}
                        </span>
                      </ExtendedTooltip>
                      <div className="flex items-center gap-2">
                        {/* Tier chip — colour-coded from the
                            statTierChipClass mapping. Reads the
                            *final* value (after background bonuses)
                            so the player sees the effective tier, not
                            the raw allocation. */}
                        <span
                          className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${statTierChipClass(tier)}`}
                          data-testid={`stat-tier-${key}`}
                          data-tier={tier}
                        >
                          {statTierLabel(tier)}
                        </span>
                        <span className="font-mono text-accent-gold tabular-nums">
                          {baseStats[key]} → <span className="text-accent-gold">{finalValue}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setStat(key, -1)} aria-label={`Decrease ${key}`}>−</Button>
                      <div className="flex-1">
                        {/* Removed `segments={10}` — the tick lines did
                            not visually align with the discrete 1..10
                            snap points and were misleading. The slider
                            still snaps via step=1. */}
                        <Slider
                          min={1}
                          max={10}
                          value={baseStats[key]}
                          onChange={(v) => setBaseStats((s) => ({ ...s, [key]: v }))}
                          ariaLabel={`${key} stat value`}
                        />
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => setStat(key, +1)} aria-label={`Increase ${key}`}>+</Button>
                    </div>
                    {/* Gameplay-impact blurb (todo#27). One sentence
                        per tier, chosen so the player can read the
                        whole row top-to-bottom and know what their
                        choice means in play. */}
                    <p className="mt-2 text-xs text-text-muted leading-snug">
                      {STAT_IMPACT[key][tier]}
                    </p>
                  </div>
                );
              })}
            </div>
            {!validation.valid && (
              <p className="mt-3 text-sm text-status-warning" role="status">
                {validation.reason}
              </p>
            )}
          </Card>
        )}

        {step === 2 && (
          <Card title="Traits" subtitle={`Pick 1–3 (selected: ${traits.length}/3)`}>
            <div className="grid md:grid-cols-2 gap-3">
              {availableTraits.map((tid) => {
                const def = traitDefs.find((t) => (t.id as unknown as string) === (tid as unknown as string));
                const selected = traits.includes(tid);
                return (
                  <button
                    key={tid as unknown as string}
                    onClick={() => toggleTrait(tid)}
                    className={`text-left rounded p-3 border ${
                      selected
                        ? 'border-accent-gold bg-bg-tertiary'
                        : 'border-bg-tertiary bg-bg-secondary hover:bg-bg-tertiary'
                    }`}
                  >
                    <h5 className="font-headline text-accent-gold">
                      {def?.name ?? (tid as unknown as string)}
                    </h5>
                    {def && <p className="text-xs text-text-secondary mt-1">{def.description}</p>}
                    {def && <p className="text-xs text-text-muted mt-1 italic">{def.effectSummary}</p>}
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card title="Ideology" subtitle="Where do you stand?">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <IdeologyCompass value={ideology} onChange={setIdeology} size={360} />
              <div className="text-sm text-text-secondary max-w-sm space-y-3">
                <p>
                  Your ideology influences how legislators in each party react to you and
                  which events/cards you&rsquo;ll naturally lean into. You can drift later,
                  but this is your starting posture.
                </p>
                <p>
                  Drag the marker, click anywhere on the grid, or use the arrow keys
                  (Shift for larger steps). Hover the small grey dots to compare your
                  position to historical and contemporary figures.
                </p>
              </div>
            </div>
          </Card>
        )}

        <nav className="mt-6 flex justify-between">
          <Button
            variant="secondary"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Previous
          </Button>
          {step < 3 ? (
            <Button
              variant="primary"
              disabled={!canAdvance()}
              onClick={() => setStep((s) => s + 1)}
            >
              Next
            </Button>
          ) : (
            <Button variant="gold" onClick={finish}>
              Choose Scenario →
            </Button>
          )}
        </nav>
      </div>
    </div>
  );
}

const STEP_LABELS = ['Identity', 'Stats', 'Traits', 'Ideology'];

function Stepper({ step }: { step: number }): JSX.Element {
  return (
    <ol className="flex gap-2 mb-6">
      {STEP_LABELS.map((label, idx) => (
        <li
          key={label}
          className={`flex-1 text-center text-xs py-2 rounded ${
            idx === step
              ? 'bg-accent-gold text-bg-primary font-semibold'
              : idx < step
                ? 'bg-bg-tertiary text-accent-gold'
                : 'bg-bg-secondary text-text-muted'
          }`}
        >
          {idx + 1}. {label}
        </li>
      ))}
    </ol>
  );
}

function backgroundBlurb(bg: Background): string {
  switch (bg) {
    case 'citizen':
      return 'A grassroots organizer with credibility on the ground. Low starting wealth, high integrity.';
    case 'veteran':
      return 'A former officer with discipline and a rolodex. Strong connections and strategy.';
    case 'executive':
      return 'A corporate insider with money and media access. Low integrity ceiling.';
  }
}

/**
 * Visual budget meter for stat allocation. Replaces the old plain-text
 * "Budget: N / 24–36" subtitle so the player can see at a glance whether
 * they have room to spend more or have over-allocated.
 *
 * Tone:
 *   - `under` (total < min): muted blue — "spend more".
 *   - `valid` (min ≤ total ≤ max): gold — the standard active tone.
 *   - `over`  (total > max): red — "this won't be accepted".
 *
 * The bar fills proportionally up to `max`; when `total > max` we let
 * the bar overflow visually with a warning stripe so the player sees
 * exactly how far over they are.
 */
function StatBudget({
  total,
  min,
  max,
  valid,
}: {
  total: number;
  min: number;
  max: number;
  valid: boolean;
}): JSX.Element {
  const tone: 'under' | 'valid' | 'over' = total < min ? 'under' : total > max ? 'over' : 'valid';
  // Clamp the visible fill to the bar width; over-allocation gets its
  // own striped overlay so the player still sees the overflow.
  const clampedPct = Math.min(100, (total / max) * 100);
  const overflowPct = total > max ? Math.min(100, ((total - max) / max) * 100) : 0;
  const fillClass =
    tone === 'over'
      ? 'bg-status-danger/70'
      : tone === 'under'
      ? 'bg-accent-blue/60'
      : 'bg-accent-gold/70';
  const labelClass =
    tone === 'over'
      ? 'text-status-danger'
      : tone === 'under'
      ? 'text-text-secondary'
      : 'text-accent-gold';
  return (
    <div
      className="rounded border border-rule bg-bg-secondary px-3 py-2"
      data-testid="stat-budget"
      data-tone={tone}
      data-valid={valid ? 'true' : 'false'}
    >
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="font-headline text-sm text-text-secondary uppercase tracking-wide">
          Budget
        </span>
        <span className={`font-mono text-sm tabular-nums ${labelClass}`}>
          {total} / {min}–{max}
        </span>
      </div>
      <div className="relative h-2 rounded-sm bg-bg-tertiary overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 ${fillClass} transition-[width] duration-200`}
          style={{ width: `${clampedPct}%` }}
        />
        {/* When over-allocated, paint a danger-striped overlay sized to
            how far past the cap the player went. Caps at 100% so the
            UI does not visibly explode at extreme values. */}
        {overflowPct > 0 && (
          <div
            className="absolute inset-y-0 right-0 bg-status-danger/40"
            style={{
              width: `${overflowPct}%`,
              backgroundImage:
                'repeating-linear-gradient(45deg, rgba(0,0,0,0.25) 0 4px, transparent 4px 8px)',
            }}
          />
        )}
      </div>
    </div>
  );
}
