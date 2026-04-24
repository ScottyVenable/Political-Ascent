import { useMemo, useState } from 'react';
import type { Background, CoreStats, IdeologyPoint, TraitId } from '@/types';
import { CharacterSystem } from '@/systems/CharacterSystem';
import { GameEngine } from '@/engine/GameEngine';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { IdeologyCompass } from '../components/IdeologyCompass';
import { Slider } from '../components/Slider';
import { useRouter } from '../router';
import { useCharacterStore } from '@/store/characterStore';

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
    useCharacterStore.getState().reset();
    useCharacterStore.getState().setCharacter({
      id: `pc-${Date.now()}`,
      name: name.trim(),
      background,
      stats: finalStats,
      traits,
      ideology,
      xp: 0,
      level: 1,
      skillPoints: 0,
      unlockedSkills: [],
      hand: [],
      deck: [],
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
            <label className="block mb-4">
              <span className="text-sm text-text-secondary">Name</span>
              <input
                className="mt-1 w-full bg-bg-tertiary rounded px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jordan Whitaker"
                autoFocus
              />
            </label>
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
          </Card>
        )}

        {step === 1 && (
          <Card title="Core Stats" subtitle={`Budget: ${totalPoints} / 24–36`}>
            <div className="grid md:grid-cols-2 gap-3">
              {(Object.keys(baseStats) as (keyof CoreStats)[]).map((key) => (
                <div key={key} className="bg-bg-tertiary rounded p-3">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="capitalize font-headline text-text-primary">{key}</span>
                    <span className="font-mono text-accent-gold">
                      {baseStats[key]} → <span className="text-accent-gold">{finalStats[key]}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setStat(key, -1)} aria-label={`Decrease ${key}`}>−</Button>
                    <div className="flex-1">
                      <Slider
                        min={1}
                        max={10}
                        value={baseStats[key]}
                        onChange={(v) => setBaseStats((s) => ({ ...s, [key]: v }))}
                        segments={10}
                        ariaLabel={`${key} stat value`}
                      />
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => setStat(key, +1)} aria-label={`Increase ${key}`}>+</Button>
                  </div>
                </div>
              ))}
            </div>
            {!validation.valid && (
              <p className="mt-3 text-sm text-status-warning">{validation.reason}</p>
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
              <IdeologyCompass value={ideology} onChange={setIdeology} />
              <div className="text-sm text-text-secondary max-w-sm">
                <p>Your ideology influences how legislators in each party react to you and which
                  events/cards you&rsquo;ll naturally lean into. You can drift later, but this is your
                  starting posture.</p>
                <p className="mt-3 font-mono text-xs">
                  x = {ideology.x.toFixed(2)} &middot; y = {ideology.y.toFixed(2)}
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
