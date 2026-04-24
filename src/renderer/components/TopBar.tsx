import { memo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useCharacterStore } from '@/store/characterStore';
import { TimeEngine } from '@/engine/TimeEngine';
import { Button } from './Button';

/**
 * TopBar — fixed header showing date, resources, speed controls.
 *
 * Uses selector subscriptions on each bite-sized piece of state so a change
 * to, say, `politicalCapital` doesn't rerender the speed buttons.
 */
function TopBarImpl(): JSX.Element {
  const date = useGameStore((s) => s.currentDate);
  const pc = useGameStore((s) => s.politicalCapital);
  const ap = useGameStore((s) => s.actionPoints.current);
  const apMax = useGameStore((s) => s.actionPoints.max);
  const speed = useGameStore((s) => s.speed);
  const isPaused = useGameStore((s) => s.isPaused);

  const name = useCharacterStore((s) => s.name);
  const level = useCharacterStore((s) => s.level);
  const xp = useCharacterStore((s) => s.xp);

  return (
    <header className="bg-bg-secondary border-b border-bg-tertiary px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="font-headline text-accent-gold">
          <span className="text-sm">{name || 'Senator'}</span>{' '}
          <span className="text-xs text-text-muted">Lv {level} · {xp} XP</span>
        </div>
        <div className="hidden md:flex gap-3 text-sm font-mono">
          <span className="text-text-secondary">📅 {`${String(date.month).padStart(2, '0')}/${String(date.day).padStart(2, '0')}/${date.year}`}</span>
          <span className="text-accent-gold">PC {pc}</span>
          <span className="text-accent-blue">AP {ap}/{apMax}</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <SpeedButton label="❚❚" value={0} active={isPaused || speed === 0} />
        <SpeedButton label="1×" value={1} active={!isPaused && speed === 1} />
        <SpeedButton label="2×" value={2} active={!isPaused && speed === 2} />
        <SpeedButton label="4×" value={4} active={!isPaused && speed === 4} />
      </div>
    </header>
  );
}

function SpeedButton({
  label,
  value,
  active,
}: {
  label: string;
  value: 0 | 1 | 2 | 4;
  active: boolean;
}): JSX.Element {
  return (
    <Button
      size="sm"
      variant={active ? 'gold' : 'secondary'}
      onClick={() => {
        if (value === 0) {
          useGameStore.getState().setPaused(true);
          TimeEngine.stop();
        } else {
          useGameStore.getState().setPaused(false);
          TimeEngine.setSpeed(value);
        }
      }}
    >
      {label}
    </Button>
  );
}

export const TopBar = memo(TopBarImpl);
