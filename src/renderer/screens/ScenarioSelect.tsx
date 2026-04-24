import { useMemo } from 'react';
import { GameEngine } from '@/engine/GameEngine';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useRouter } from '../router';
import { useCharacterStore } from '@/store/characterStore';
import type { ScenarioId } from '@/types';

/**
 * Scenario select — MVP ships a single scenario (Modern America 2024)
 * but the layout supports N. Clicking one starts the game.
 */
export function ScenarioSelect(): JSX.Element {
  const navigate = useRouter((s) => s.navigate);
  const scenarios = useMemo(() => GameEngine.getScenarios(), []);
  const character = useCharacterStore((s) => s);

  function start(scenarioId: ScenarioId): void {
    GameEngine.startNewGame(scenarioId, character);
    navigate('game');
  }

  return (
    <div className="min-h-screen bg-bg-primary p-6 md:p-10">
      <header className="max-w-5xl mx-auto flex justify-between items-center mb-6">
        <h1 className="font-headline text-3xl font-bold text-accent-gold">Choose Your Arena</h1>
        <Button variant="ghost" onClick={() => navigate('character-creation')}>← Back</Button>
      </header>

      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-4">
        {scenarios.length === 0 ? (
          <Card title="No scenarios loaded">
            <p className="text-sm text-text-secondary">
              Add JSON files under <code>src/data/scenarios/</code> to populate this list.
            </p>
          </Card>
        ) : (
          scenarios.map((sc) => (
            <Card key={sc.id as unknown as string} title={sc.title} subtitle={sc.summary} accent="gold">
              <p className="text-sm text-text-secondary mb-3">{sc.description}</p>
              <ul className="text-xs text-text-muted space-y-1 mb-4">
                <li>
                  <span className="text-accent-gold">Start:</span>{' '}
                  {sc.startDate.month}/{sc.startDate.day}/{sc.startDate.year}
                </li>
                <li>
                  <span className="text-accent-gold">Role:</span>{' '}
                  {sc.playerPosition} — {sc.playerState}
                </li>
                <li>
                  <span className="text-accent-gold">Victory:</span>{' '}
                  {sc.victoryConditions.map((v) => v.description).join('; ')}
                </li>
              </ul>
              <Button variant="gold" onClick={() => start(sc.id)} disabled={!character.name}>
                Begin
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
