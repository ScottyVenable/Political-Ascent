import { useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';
import type { VoteResultPayload, CardEffectsPayload } from '@/store/uiStore';
import type { Effect } from '@/types';
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
import { Icon } from '../components/Icon';

import { DashboardPanel } from '../panels/DashboardPanel';
import { LegislationPanel } from '../panels/LegislationPanel';
import { CongressPanel } from '../panels/CongressPanel';
import { PopulationPanel } from '../panels/PopulationPanel';
import { EconomyPanel } from '../panels/EconomyPanel';
import { QuestsPanel } from '../panels/QuestsPanel';
import { CardsPanel } from '../panels/CardsPanel';
import { CollectionPanel } from '../panels/CollectionPanel';
import { SkillsPanel } from '../panels/SkillsPanel';
import { CharacterPanel } from '../panels/CharacterPanel';
import { GlossaryPanel } from '../panels/GlossaryPanel';
import { TimelinePanel } from '../panels/TimelinePanel';
import { PatchNotesPanel } from '../panels/PatchNotesPanel';

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

  // Codex review (PR#66 P2): the mobile drawer flag is only cleared by
  // `setActivePanel`. If the player exits to the main menu while the
  // drawer is open, re-entering the game would render the drawer over
  // the freshly-mounted screen. Reset on every Game mount and unmount
  // so each session starts (and ends) with the drawer closed.
  useEffect(() => {
    useUIStore.getState().setMobileSidebarOpen(false);
    return () => {
      useUIStore.getState().setMobileSidebarOpen(false);
    };
  }, []);

  return (
    // Three-row grid: the top and bottom rows have fixed pixel heights
    // (48px shell + 72px command strip) so the middle row inherits
    // `1fr` and can scroll internally. `100dvh` (with a `100vh`
    // fallback baked in by Tailwind's `h-screen` if needed) handles the
    // dynamic viewport on mobile so the bottom bar isn't hidden by the
    // browser/system chrome on Android Chrome / iOS Safari.
    //
    // Safe-area insets (Pixel notch, Dynamic Island, gesture bars) are
    // applied via CSS env() variables so the top bar isn't clipped and
    // the bottom bar isn't pushed under the home indicator.
    <div
      className="bg-bg-primary text-text-primary grid"
      style={{
        gridTemplateRows: '48px 1fr 72px',
        height: '100dvh',
        minHeight: '100vh',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <TopBar />
      <div className="flex overflow-hidden">
        <Sidebar />
        <main
          key={activePanel}
          className="flex-1 overflow-y-auto game-scroll p-3 sm:p-5 md:p-6 animate-panel-enter"
        >
          {activePanel === 'dashboard' && <DashboardPanel />}
          {activePanel === 'legislation' && <LegislationPanel />}
          {activePanel === 'congress' && <CongressPanel />}
          {activePanel === 'population' && <PopulationPanel />}
          {activePanel === 'economy' && <EconomyPanel />}
          {activePanel === 'quests' && <QuestsPanel />}
          {activePanel === 'cards' && <CardsPanel />}
          {activePanel === 'collection' && <CollectionPanel />}
          {activePanel === 'skills' && <SkillsPanel />}
          {activePanel === 'character' && <CharacterPanel />}
          {activePanel === 'glossary' && <GlossaryPanel />}
          {activePanel === 'timeline' && <TimelinePanel />}
          {activePanel === 'patch-notes' && <PatchNotesPanel />}
        </main>
      </div>
      <BottomBar />
      {activeEvents.length > 0 && <EventModal />}
      <VoteResultModal />
      <CardEffectsModal />
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

// ─────────────────────────────────────────────────────────────
// VOTE RESULT MODAL (todo#85)
// Rendered whenever uiStore has a 'vote-result' modal queued. Shows
// a styled breakdown of the roll-call: PASSED/FAILED banner, yea/nay
// totals, and a scrollable per-senator list the player can review
// before dismissing. Game time is paused (the engine is ticking but
// the modal gives context); the player can always dismiss and return
// to the Legislation panel for further review.
// ─────────────────────────────────────────────────────────────

/**
 * Reads the first 'vote-result' modal from uiStore, if any, and renders
 * a full-screen overlay with the roll-call details. Nothing renders when
 * the queue is empty.
 */
function VoteResultModal(): JSX.Element | null {
  const modals = useUIStore((s) => s.modals);
  const closeModal = useUIStore((s) => s.closeModal);

  // Pick the first vote-result in the queue; other modal types are
  // handled by their own components (e.g. EventModal above).
  const modal = modals.find((m) => m.type === 'vote-result');
  if (!modal) return null;

  const data = modal.payload as VoteResultPayload;
  const { billTitle, passed, yea, nay, breakdown } = data;
  const total = yea + nay;

  // Sort: yeas first, then nays, each group alpha by last name so the
  // player can scan for specific members quickly.
  const sorted = [...breakdown].sort((a, b) => {
    if (a.vote !== b.vote) return a.vote === 'yea' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const PARTY_TEXT: Record<'D' | 'R' | 'I', string> = {
    D: 'text-[#7B9BAB]',
    R: 'text-[#C07A79]',
    I: 'text-accent-gold',
  };

  function dismiss(): void {
    closeModal(modal.id);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Vote result for ${billTitle}`}
      onClick={dismiss}
      data-testid="vote-result-modal"
    >
      <div
        className="w-full max-w-2xl bg-bg-secondary rounded-lg border border-bg-tertiary shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER ── */}
        <header
          className={[
            'px-6 py-5 border-b border-bg-tertiary flex flex-col gap-1',
            passed ? 'bg-status-success/10' : 'bg-status-danger/10',
          ].join(' ')}
        >
          {/* PASSED / FAILED banner */}
          <div
            className={[
              'font-headline text-3xl font-bold tracking-widest uppercase',
              passed ? 'text-status-success' : 'text-status-danger',
            ].join(' ')}
            data-testid="vote-result-verdict"
          >
            {passed ? 'Passed' : 'Failed'}
          </div>
          <p className="font-mono text-label text-text-muted uppercase tracking-widest">
            {billTitle}
          </p>
        </header>

        {/* ── VOTE TOTALS ── */}
        <div
          className="grid grid-cols-2 divide-x divide-bg-tertiary border-b border-bg-tertiary"
          data-testid="vote-result-totals"
        >
          {/* YEA */}
          <div className="flex flex-col items-center py-4 gap-1">
            <span
              className="font-mono text-4xl font-bold text-status-success tabular-nums"
              data-testid="vote-result-yea"
            >
              {yea}
            </span>
            <div className="flex items-center gap-1 font-mono text-label uppercase tracking-widest text-text-muted">
              <Icon name="check" size={12} />
              Yea
            </div>
            {/* Proportion bar */}
            <div className="w-24 h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
              <div
                className="h-full bg-status-success rounded-full"
                style={{ width: total > 0 ? `${(yea / total) * 100}%` : '0%' }}
              />
            </div>
          </div>

          {/* NAY */}
          <div className="flex flex-col items-center py-4 gap-1">
            <span
              className="font-mono text-4xl font-bold text-status-danger tabular-nums"
              data-testid="vote-result-nay"
            >
              {nay}
            </span>
            <div className="flex items-center gap-1 font-mono text-label uppercase tracking-widest text-text-muted">
              <Icon name="close" size={12} />
              Nay
            </div>
            {/* Proportion bar */}
            <div className="w-24 h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
              <div
                className="h-full bg-status-danger rounded-full"
                style={{ width: total > 0 ? `${(nay / total) * 100}%` : '0%' }}
              />
            </div>
          </div>
        </div>

        {/* ── SENATOR BREAKDOWN ── */}
        {breakdown.length > 0 && (
          <div className="flex-1 overflow-y-auto game-scroll px-4 py-3">
            <p className="font-mono text-label uppercase tracking-widest text-text-muted mb-2">
              Roll-call ({total} senators)
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
              {sorted.map((rec) => (
                <li
                  key={rec.id}
                  className="flex justify-between items-center px-2 py-1 rounded-sm text-[0.8125rem] even:bg-bg-tertiary/20"
                >
                  <span className={`font-mono text-[0.6875rem] uppercase mr-2 ${PARTY_TEXT[rec.party]}`}>
                    {rec.party}
                  </span>
                  <span className="flex-1 text-text-secondary truncate">{rec.name}</span>
                  <span className="font-mono text-label ml-2">
                    <span className={rec.vote === 'yea' ? 'text-status-success' : 'text-status-danger'}>
                      {rec.vote === 'yea' ? 'Yea' : 'Nay'}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── FOOTER ── */}
        <footer className="px-6 py-3 border-t border-bg-tertiary flex justify-end">
          <Button variant="primary" onClick={dismiss} data-testid="vote-result-dismiss">
            Dismiss
          </Button>
        </footer>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD EFFECTS MODAL (todo#84)
//
// Appears immediately after a card is played successfully. Shows the
// player a readable summary of every effect that was applied — stat
// changes, resource shifts, group sentiment, economy metrics, etc.
//
// Positive numeric changes are styled green (`text-status-success`);
// negative are red (`text-status-danger`). Non-numeric effects (flag
// sets, card grants, quest triggers) render as neutral text.
//
// The modal is dismissed by clicking the overlay, pressing the Dismiss
// button, or pressing Escape (handled by the click-outside listener on
// the overlay div).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts a single Effect into a human-readable description and a
 * sign flag used to choose a colour class.
 *
 * `positive` is `true` when the effect is a buff (positive number, or
 * a flag/grant that is inherently beneficial-in-context). `null` means
 * the effect has no natural polarity (flag clears, quest triggers).
 *
 * @example
 * describeEffect({ type: 'resource', resource: 'politicalCapital', value: 25 })
 * // => { label: 'Political Capital', valueStr: '+25', positive: true }
 */
function describeEffect(e: Effect): { label: string; valueStr: string; positive: boolean | null } {
  switch (e.type) {
    case 'stat': {
      const name = e.target.charAt(0).toUpperCase() + e.target.slice(1);
      return { label: name, valueStr: fmt(e.value), positive: e.value >= 0 };
    }
    case 'resource': {
      const RESOURCE_LABELS: Record<string, string> = {
        politicalCapital: 'Political Capital',
        actionPoints: 'Action Points',
        xp: 'XP',
      };
      return { label: RESOURCE_LABELS[e.resource] ?? e.resource, valueStr: fmt(e.value), positive: e.value >= 0 };
    }
    case 'group_happiness':
      return { label: `${e.group} Happiness`, valueStr: fmt(e.value), positive: e.value >= 0 };
    case 'group_loyalty':
      return { label: `${e.group} Loyalty`, valueStr: fmt(e.value), positive: e.value >= 0 };
    case 'relationship':
      return { label: `Relationship: ${e.npcId}`, valueStr: fmt(e.value), positive: e.value >= 0 };
    case 'economy': {
      const ECONOMY_LABELS: Record<string, string> = {
        gdpGrowth: 'GDP Growth',
        unemployment: 'Unemployment',
        inflation: 'Inflation',
        debt: 'Debt',
        deficit: 'Deficit',
        gini: 'Gini Coefficient',
        trade: 'Trade Balance',
      };
      return { label: ECONOMY_LABELS[e.metric] ?? e.metric, valueStr: fmt(e.value), positive: e.value >= 0 };
    }
    case 'flag':
      return { label: `Flag: ${e.flag}`, valueStr: String(e.value), positive: null };
    case 'grant_card':
      return { label: 'Gained card', valueStr: e.cardId, positive: null };
    case 'trigger_quest':
      return { label: 'Quest triggered', valueStr: e.questId, positive: null };
    default:
      // Exhaustive guard — TypeScript will error if a new variant is
      // added to Effect without being handled here.
      return { label: (e as { type: string }).type, valueStr: '', positive: null };
  }
}

/** Prefix a number with `+` when positive so the player reads it as a delta. */
function fmt(n: number): string {
  return n >= 0 ? `+${n}` : String(n);
}

/**
 * Renders a single effect row inside the card-effects modal.
 * Kept as a sub-component to isolate the polarity-colour logic
 * from the outer modal layout.
 */
function EffectRow({ effect }: { effect: Effect }): JSX.Element {
  const { label, valueStr, positive } = describeEffect(effect);
  const valueClass =
    positive === true
      ? 'text-status-success font-semibold'
      : positive === false
        ? 'text-status-danger font-semibold'
        : 'text-text-secondary';

  return (
    <li className="flex justify-between items-baseline py-1 border-b border-bg-tertiary/40 last:border-0 gap-2">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className={`font-mono text-sm tabular-nums shrink-0 ${valueClass}`}>{valueStr}</span>
    </li>
  );
}

/**
 * CardEffectsModal — overlaid after a successful card play to show the
 * player exactly what changed (todo#84).
 *
 * Reads the first `'card-effects'` modal from the uiStore queue.
 * If no such modal exists, renders nothing.
 */
function CardEffectsModal(): JSX.Element | null {
  const modals = useUIStore((s) => s.modals);
  const closeModal = useUIStore((s) => s.closeModal);

  const modal = modals.find((m) => m.type === 'card-effects');
  if (!modal) return null;

  const { cardName, effects } = modal.payload as CardEffectsPayload;
  // Cast to Effect[] — the payload was constructed in CardSystem.play()
  // from a typed readonly Effect[] and round-tripped through `unknown`.
  const typedEffects = effects as Effect[];

  function dismiss(): void {
    closeModal(modal!.id);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Effects of ${cardName}`}
      onClick={dismiss}
      data-testid="card-effects-modal"
    >
      <div
        className="w-full max-w-sm bg-bg-secondary rounded-lg border border-bg-tertiary shadow-2xl flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER ── */}
        <header className="px-5 py-4 border-b border-bg-tertiary flex items-center gap-2">
          <Icon name="cards" size={18} className="text-accent-gold shrink-0" />
          <div>
            <p className="font-mono text-label uppercase tracking-widest text-text-muted">Card played</p>
            <h2
              className="font-headline text-lg text-text-primary leading-tight"
              data-testid="card-effects-name"
            >
              {cardName}
            </h2>
          </div>
        </header>

        {/* ── EFFECT LIST ── */}
        <div className="flex-1 overflow-y-auto game-scroll px-5 py-3">
          {typedEffects.length === 0 ? (
            <p className="text-sm text-text-muted italic">No immediate effects.</p>
          ) : (
            <ul data-testid="card-effects-list">
              {typedEffects.map((e, i) => (
                // Index is stable for this static list; no reorder possible.
                <EffectRow key={i} effect={e} />
              ))}
            </ul>
          )}
        </div>

        {/* ── FOOTER ── */}
        <footer className="px-5 py-3 border-t border-bg-tertiary flex justify-end">
          <Button variant="primary" onClick={dismiss} data-testid="card-effects-dismiss">
            Done
          </Button>
        </footer>
      </div>
    </div>
  );
}
