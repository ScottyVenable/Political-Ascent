/**
 * CharacterPanel — the in-game "you" hub.
 *
 * Shows the player's avatar, identity, stats, traits, ideology, and
 * progression. Replaces the old grid layout with a hero header (avatar
 * + name + background blurb) plus a collapsible avatar picker, and
 * promotes the ideology compass to a full-width card so reference
 * figures (FDR, Reagan, Sanders, etc.) are legible. The dashboard's
 * mini-compass keeps reference figures hidden so the two surfaces don't
 * compete for the player's attention. (Closes docs/todo.md items 6, 9,
 * and 10.)
 *
 * @module renderer/panels/CharacterPanel
 */
import { useState } from 'react';
import { useCharacterStore } from '@/store/characterStore';
import { useGameStore } from '@/store/gameStore';
import { GameEngine } from '@/engine/GameEngine';
import { Card } from '../components/Card';
import { StatBlock } from '../components/StatBlock';
import { IdeologyCompass } from '../components/IdeologyCompass';
import { AvatarMedallion } from '../components/AvatarMedallion';
import { AvatarPicker } from '../components/AvatarPicker';
import { formatCurrency } from '@/utils/format';
import { personalFinanceActions } from '@/utils/personalFinance';
import { Button } from '../components/Button';
import { getAvatarPreset, DEFAULT_AVATAR_ID } from '@/data/avatars';

export function CharacterPanel(): JSX.Element {
  const char = useCharacterStore((s) => s);
  const setAvatar = useCharacterStore((s) => s.setAvatar);
  const adjustFunds = useCharacterStore((s) => s.adjustFunds);
  const addTreasury = useGameStore((s) => s.addTreasury);
  const traitDefs = GameEngine.getTraits();
  const [pickerOpen, setPickerOpen] = useState(false);

  // Resolve to a real preset so the hero header always renders even on
  // legacy saves that pre-date the avatarId field.
  const avatarId = char.avatarId ?? DEFAULT_AVATAR_ID;
  const avatar = getAvatarPreset(avatarId);
  const financeActions = personalFinanceActions(char);

  function applyFinanceAction(action: (typeof financeActions)[number]): void {
    adjustFunds(action.delta);
    if (action.treasuryDelta) addTreasury(action.treasuryDelta);
  }

  function formatFinanceDelta(delta: number): string {
    if (delta === 0) return formatCurrency(0);
    return `${delta > 0 ? '+' : '-'}${formatCurrency(Math.abs(delta))}`;
  }

  return (
    <div className="space-y-4">
      {/* ── Hero: avatar + identity ─────────────────────────────── */}
      <Card accent="gold">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <AvatarMedallion avatarId={avatarId} size={88} />
          <div className="flex-1 min-w-0">
            <h2 className="font-headline text-2xl text-accent-gold truncate">
              {char.name || 'Unnamed Candidate'}
            </h2>
            <p className="text-sm text-text-secondary capitalize">
              {char.background} · {avatar.label}
            </p>
            <p className="text-xs text-text-muted italic mt-1">{avatar.description}</p>
          </div>
          <div className="shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPickerOpen((v) => !v)}
              data-testid="character-panel-change-avatar"
              aria-expanded={pickerOpen}
            >
              {pickerOpen ? 'Done' : 'Change avatar'}
            </Button>
          </div>
        </div>
        {pickerOpen && (
          <div className="mt-4 pt-4 border-t border-rule">
            <AvatarPicker value={avatarId} onChange={(next) => setAvatar(next)} />
          </div>
        )}
      </Card>

      {/* ── Stats + Traits + Progression ────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Core Stats" accent="blue">
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(char.stats) as Array<[keyof typeof char.stats, number]>).map(
              ([k, v]) => (
                <StatBlock key={k} label={k[0].toUpperCase() + k.slice(1)} value={v} max={10} />
              ),
            )}
          </div>
        </Card>

        <Card title="Traits" accent="blue">
          <ul className="space-y-2">
            {char.traits.length === 0 && (
              <p className="text-sm text-text-muted">No traits.</p>
            )}
            {char.traits.map((tid) => {
              const def = traitDefs.find(
                (t) => (t.id as unknown as string) === (tid as unknown as string),
              );
              return (
                <li
                  key={tid as unknown as string}
                  className="border-l-2 border-accent-blue pl-3"
                >
                  <div className="font-headline text-accent-gold text-sm">
                    {def?.name ?? (tid as unknown as string)}
                  </div>
                  {def && (
                    <>
                      <p className="text-xs text-text-secondary">{def.description}</p>
                      <p className="text-xs italic text-text-muted">{def.effectSummary}</p>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>

        <Card title="Progression" accent="gold" className="md:col-span-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <div className="text-xs uppercase tracking-wider text-text-muted">Level</div>
              <div className="font-mono text-lg text-accent-gold">{char.level}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-text-muted">XP</div>
              <div className="font-mono text-lg">{char.xp}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-text-muted">
                Skill points
              </div>
              <div className="font-mono text-lg text-accent-gold">{char.skillPoints}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-text-muted">
                Skills unlocked
              </div>
              <div className="font-mono text-lg">{char.unlockedSkills.length}</div>
            </div>
          </div>
        </Card>

        {/* Personal Finances (todo#74): tracks the character's actual net
            worth in dollars, separate from Political Capital (which is an
            abstract influence resource). Starts high for executives, lower
            for citizens. Increases through salary, speaking fees, and card
            effects. Can decrease through fines and campaign spending. */}
        <Card title="Personal Finances" accent="gold" className="md:col-span-2" data-testid="character-finances">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-xs uppercase tracking-wider text-text-muted">Net Worth</div>
              <div
                className="font-mono text-lg text-accent-gold"
                data-testid="character-personal-funds"
                title={`$${(char.personalFunds ?? 0).toLocaleString()}`}
              >
                {formatCurrency(char.personalFunds ?? 0)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-text-muted">Wealth tier</div>
              {/* The `wealth` core stat (1–10) describes the character's
                  long-term financial standing archetype, not the current
                  balance. A high-wealth character recovers funds faster. */}
              <div className="font-mono text-lg">{char.stats.wealth}/10</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-text-muted">Background</div>
              <div className="font-mono text-lg capitalize">{char.background}</div>
            </div>
          </div>
          <p className="text-body text-text-muted mt-2">
            Personal funds are distinct from Political Capital. They represent your literal bank
            balance — salary income, investments, and asset sales flow in; campaign expenditures
            and fines flow out.
          </p>

          {/* Finance actions (todo#74). These are deterministic bridge
              actions until deeper campaign-finance and staff systems
              exist. They let the player actually change the tracked
              balance from the Character screen, while keeping all
              deltas pure/testable in `utils/personalFinance.ts`. */}
          <div className="mt-4 grid sm:grid-cols-2 gap-3" data-testid="character-finance-actions">
            {financeActions.map((action) => (
              <button
                key={action.id}
                type="button"
                disabled={action.disabled}
                onClick={() => applyFinanceAction(action)}
                className={`text-left rounded border p-3 transition-colors ${
                  action.kind === 'income'
                    ? 'border-status-success/40 bg-status-success/5 hover:bg-status-success/10'
                    : 'border-accent-gold/40 bg-accent-gold/5 hover:bg-accent-gold/10'
                } disabled:opacity-45 disabled:cursor-not-allowed`}
                data-testid={`finance-action-${action.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-headline text-sm text-text-primary">{action.label}</span>
                  <span
                    className={`font-mono text-sm tabular-nums ${
                      action.delta >= 0 ? 'text-status-success' : 'text-accent-red'
                    }`}
                  >
                    {formatFinanceDelta(action.delta)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-text-muted leading-snug">{action.description}</p>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Ideology compass (full width, with reference figures) ─ */}
      <Card title="Ideology" subtitle="Hover the grey markers to compare with historical figures.">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <IdeologyCompass
            value={char.ideology}
            size={400}
            label
            showReferenceFigures
          />
          <div className="text-sm text-text-secondary space-y-2 max-w-md">
            <p>
              Your ideology shapes how legislators in each party react to you and
              which events tend to land in your lap. It can drift over the course of
              a tenure as you take votes and pick fights, but this is your starting
              posture.
            </p>
            <p className="text-xs text-text-muted">
              The grey markers are real figures positioned by published political-compass
              analyses. They are reference points, not endorsements.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

