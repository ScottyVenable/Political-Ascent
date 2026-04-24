import { useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useWorldStore } from '@/store/worldStore';
import { useGameStore } from '@/store/gameStore';
import { TimeEngine } from '@/engine/TimeEngine';
import { EventEngine } from '@/engine/EventEngine';
import { GameEngine } from '@/engine/GameEngine';
import { TopBar } from '../components/TopBar';
import { Sidebar } from '../components/Sidebar';
import { BottomBar } from '../components/BottomBar';
import { ModalShell } from '../components/ModalShell';
import { Button } from '../components/Button';

import { DashboardPanel } from '../panels/DashboardPanel';
import { LegislationPanel } from '../panels/LegislationPanel';
import { CongressPanel } from '../panels/CongressPanel';
import { PopulationPanel } from '../panels/PopulationPanel';
import { EconomyPanel } from '../panels/EconomyPanel';
import { QuestsPanel } from '../panels/QuestsPanel';
import { CardsPanel } from '../panels/CardsPanel';
import { SkillsPanel } from '../panels/SkillsPanel';
import { CharacterPanel } from '../panels/CharacterPanel';

/**
 * Game shell — holds the game-world layout.
 *
 * Layout (UI_GAME_FEEL_PROPOSAL §7.1):
 *
 *   ┌──────────────── TopBar (48px) ────────────────┐
 *   │  Identity · Date · Political resources         │
 *   ├──────────────────────────────────────────────── │
 *   │ Sidebar │    Main panel (scroll region)        │
 *   │ (192px) │    animate-panel-enter keyed on id   │
 *   │         │                                      │
 *   ├──────────────── BottomBar (72px) ──────────────┤
 *   │  Speed ·  Week/Year · (hand peek, reserved)    │
 *   └───────────────────────────────────────────────┘
 *
 * The `key={activePanel}` on the <main> element triggers the
 * panel-enter animation every time the player switches panels — React
 * tears down the old subtree and the new one enters with the
 * fade-up-in declared in `styles.css`.
 *
 * Global keyboard shortcuts:
 *   Space  → toggle pause
 *   1-4    → set speed
 */
export function Game(): JSX.Element {
  const activePanel = useUIStore((s) => s.activePanel);
  const activeEvents = useWorldStore((s) => s.activeEvents);

  // Global keyboard shortcuts. Bound once on mount; individual selectors
  // inside the panels handle their own local shortcuts.
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        const paused = useGameStore.getState().isPaused;
        useGameStore.getState().setPaused(!paused);
        if (paused) TimeEngine.start();
        else TimeEngine.stop();
        return;
      }
      if (e.key === '1' || e.key === '2' || e.key === '3' || e.key === '4') {
        // Legacy key map: "3" remaps to 2× for historical muscle memory.
        const map: Record<string, 1 | 2 | 4> = { '1': 1, '2': 2, '3': 2, '4': 4 };
        useGameStore.getState().setPaused(false);
        TimeEngine.setSpeed(map[e.key]);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Start TimeEngine when Game mounts.
  useEffect(() => {
    GameEngine.startClock();
    return () => {
      GameEngine.pauseClock();
    };
  }, []);

  return (
    // Three-row grid: the top and bottom rows have fixed pixel heights
    // (48px shell + 72px command strip) so the middle row inherits
    // `1fr` and can scroll internally. `h-[100dvh]` uses the dynamic
    // viewport unit so Android/iOS URL bars and gesture bars do not
    // steal the last row of content the way `100vh` would. The
    // padding-bottom safe-area inset handles devices whose gesture bar
    // overlaps the rendered area (newer Android + iOS home-bar).
    <div
      className="bg-bg-primary text-text-primary grid w-full"
      style={{
        gridTemplateRows: '48px 1fr 72px',
        height: '100dvh',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <TopBar />
      <div className="flex overflow-hidden relative">
        <Sidebar />
        <main
          key={activePanel}
          className="flex-1 overflow-y-auto game-scroll p-3 sm:p-4 md:p-6 animate-panel-enter"
        >
          {activePanel === 'dashboard' && <DashboardPanel />}
          {activePanel === 'legislation' && <LegislationPanel />}
          {activePanel === 'congress' && <CongressPanel />}
          {activePanel === 'population' && <PopulationPanel />}
          {activePanel === 'economy' && <EconomyPanel />}
          {activePanel === 'quests' && <QuestsPanel />}
          {activePanel === 'cards' && <CardsPanel />}
          {activePanel === 'skills' && <SkillsPanel />}
          {activePanel === 'character' && <CharacterPanel />}
        </main>
      </div>
      <BottomBar />
      {activeEvents.length > 0 && <EventModal />}
    </div>
  );
}

function EventModal(): JSX.Element | null {
  const active = useWorldStore((s) => s.activeEvents);
  const current = active[0];
  if (!current) return null;
  // Look up definition via EventEngine registry (exposed via dismissing on resolve).
  const def = EventEngine.findDefinition(current.eventId);
  if (!def) return null;

  return (
    <ModalShell id={current.instanceId} title={def.title} hideClose size="md">
      <p className="text-sm text-text-secondary mb-4">{def.description}</p>
      <div className="space-y-2">
        {def.options.map((opt) => (
          <Button
            key={opt.id}
            variant="primary"
            className="w-full text-left justify-start"
            onClick={() => EventEngine.resolveOption(current.instanceId, opt.id)}
          >
            <span>
              {opt.label}
              {(opt.costs.pc ?? 0) > 0 && (
                <span className="ml-2 text-xs font-mono text-accent-gold/80">
                  [{opt.costs.pc} PC]
                </span>
              )}
              {(opt.costs.ap ?? 0) > 0 && (
                <span className="ml-1 text-xs font-mono text-accent-blue/80">
                  [{opt.costs.ap} AP]
                </span>
              )}
            </span>
          </Button>
        ))}
      </div>
    </ModalShell>
  );
}
