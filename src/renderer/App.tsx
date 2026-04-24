/**
 * Top-level application shell — routes between screens and wires global
 * providers (Modal / Toast). Data is loaded once on mount.
 */
import { useEffect, useState } from 'react';
import { useRouter } from './router';
import { GameEngine } from '@/engine/GameEngine';
import { loadAllData } from '@/engine/dataLoader';
import { MainMenu } from './screens/MainMenu';
import { CharacterCreation } from './screens/CharacterCreation';
import { ScenarioSelect } from './screens/ScenarioSelect';
import { Game } from './screens/Game';
import { Settings } from './screens/Settings';
import { Achievements } from './screens/Achievements';
import { ToastRoot } from './components/ToastRoot';

export function App(): JSX.Element {
  const route = useRouter((s) => s.route);
  const [ready, setReady] = useState(false);

  // Load all JSON data once. Runs in both Electron and browser — idempotent.
  useEffect(() => {
    try {
      const bundle = loadAllData();
      GameEngine.registerData(bundle);
    } catch (err) {
      // Don't block the UI; the main menu will surface the issue on click.
      // eslint-disable-next-line no-console
      console.error('dataLoader failed:', err);
    }
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <main className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center">
        <p className="font-headline text-accent-gold animate-pulse">Loading…</p>
      </main>
    );
  }

  return (
    <>
      {route === 'main-menu' && <MainMenu />}
      {route === 'character-creation' && <CharacterCreation />}
      {route === 'scenario-select' && <ScenarioSelect />}
      {route === 'game' && <Game />}
      {route === 'settings' && <Settings />}
      {route === 'achievements' && <Achievements />}
      <ToastRoot />
    </>
  );
}
