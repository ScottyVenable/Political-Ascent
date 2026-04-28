import { memo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useCharacterStore } from '@/store/characterStore';
import { ResourcePips } from './ResourcePips';
import { ExtendedTooltip } from './tooltip';
import { Icon } from './Icon';

/**
 * TopBar — slim, fixed header showing identity, date, and political resources.
 *
 * Three-zone layout (UI_GAME_FEEL_PROPOSAL §7.2):
 *
 *   [LEFT] Character name · level · XP  —  "who am I"
 *   [CENTER] Month / Year large, Day small beneath —  "when am I"
 *   [RIGHT] Political Capital (big number)  ·  Action Points (pip row)  —  "what can I spend"
 *
 * Speed controls have moved to the `BottomBar` — the top bar is no
 * longer a mix of navigation, identity, resources, AND time controls.
 * Each zone now answers exactly one question.
 *
 * The bar is fixed at 48px tall (`h-12`); that is the single vertical
 * budget chosen in the proposal so every screen has the same vertical
 * canvas below it.
 */
const MONTH_ABBREV = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
] as const;

function TopBarImpl(): JSX.Element {
  // Each field has its own selector so unrelated state changes do not
  // trigger a re-render of the whole bar (e.g. a speed change does not
  // invalidate the character-name span).
  const date = useGameStore((s) => s.currentDate);
  const pc = useGameStore((s) => s.politicalCapital);
  const treasury = useGameStore((s) => s.treasury);
  const ap = useGameStore((s) => s.actionPoints.current);
  const apMax = useGameStore((s) => s.actionPoints.max);

  const name = useCharacterStore((s) => s.name);
  const level = useCharacterStore((s) => s.level);
  const xp = useCharacterStore((s) => s.xp);

  // 1-indexed month → 0-indexed lookup. Defensive clamp in case a save
  // file carries a bad value.
  const monthAbbrev = MONTH_ABBREV[Math.max(0, Math.min(11, date.month - 1))];

  return (
    <header
      className="h-12 bg-bg-secondary border-b border-rule px-5 grid items-center"
      style={{ gridTemplateColumns: '1fr auto 1fr' }}
    >
      {/* ─── LEFT: Identity ──────────────────────────────────── */}
      <div className="flex items-baseline gap-3 min-w-0">
        <span className="font-headline text-sm text-accent-gold truncate">
          {name || 'Senator'}
        </span>
        <span className="font-mono text-label text-text-muted shrink-0">
          LV {level} · {xp} XP
        </span>
      </div>

      {/* ─── CENTER: Date ────────────────────────────────────── */}
      <div className="flex flex-col items-center leading-none">
        <span className="font-mono text-sm text-text-primary tracking-wider">
          {monthAbbrev} {date.year}
        </span>
        <span className="font-mono text-[0.625rem] text-text-muted tracking-widest mt-0.5">
          DAY {String(date.day).padStart(2, '0')}
        </span>
      </div>

      {/* ─── RIGHT: Resources ────────────────────────────────── */}
      <div className="flex items-center justify-end gap-5">
        <ExtendedTooltip term="political-capital">
          <div tabIndex={0} className="flex items-baseline gap-1.5 cursor-help focus:outline-none focus:ring-1 focus:ring-accent-gold rounded-sm">
            <span className="font-mono text-data text-accent-gold tabular-nums">
              {pc}
            </span>
            <span className="font-mono text-label text-text-muted">PC</span>
          </div>
        </ExtendedTooltip>
        {/* Treasury — money. Distinct from PC (which is influence). The
            coin icon plus the dollar-formatted number reads at a glance
            as "campaign cash" without needing a label. We always show
            it, even at $0, so the player learns the resource exists.
            See docs/todo.md item 12. */}
        <ExtendedTooltip term="treasury">
          <div
            tabIndex={0}
            className="flex items-baseline gap-1.5 cursor-help focus:outline-none focus:ring-1 focus:ring-accent-gold rounded-sm"
            data-testid="topbar-treasury"
          >
            <Icon
              name="economy"
              size={14}
              className="text-accent-gold self-center"
              aria-hidden
            />
            <span className="font-mono text-sm text-text-primary tabular-nums">
              {formatTreasury(treasury)}
            </span>
          </div>
        </ExtendedTooltip>
        <ExtendedTooltip term="action-points">
          <div tabIndex={0} className="flex items-center gap-1.5 cursor-help focus:outline-none focus:ring-1 focus:ring-accent-gold rounded-sm">
            <ResourcePips value={ap} max={apMax} tone="gold" label="Action Points" />
            <span className="font-mono text-label text-text-muted">AP</span>
          </div>
        </ExtendedTooltip>
      </div>
    </header>
  );
}

/**
 * Format a treasury amount as a compact dollar string. The bar is tight
 * on horizontal real estate, so we collapse thousands → "k" and
 * millions → "m" once the number is too wide for the slot.
 *
 *   0          → "$0"
 *   850        → "$850"
 *   12_400     → "$12.4k"
 *   1_300_000  → "$1.3m"
 */
export function formatTreasury(amount: number): string {
  if (amount < 1_000) return `$${amount}`;
  if (amount < 1_000_000) {
    // Round first, then check for the suffix boundary: a value like
    // 999,950 rounds to "1000.0k", which is wrong-suffix and reads as
    // a thousand units of magnitude rather than the million it is.
    const k = (amount / 1_000).toFixed(1);
    if (parseFloat(k) >= 1_000) {
      return `$${(amount / 1_000_000).toFixed(1)}m`;
    }
    return `$${k}k`;
  }
  return `$${(amount / 1_000_000).toFixed(1)}m`;
}

export const TopBar = memo(TopBarImpl);
