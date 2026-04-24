import { useMemo } from 'react';
import { AchievementEngine } from '@/engine/AchievementEngine';
import { useWorldStore } from '@/store/worldStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useRouter } from '../router';

export function Achievements(): JSX.Element {
  const nav = useRouter((s) => s.navigate);
  const unlocked = useWorldStore((s) => s.unlockedAchievements);
  const unlockedSet = useMemo(() => new Set(unlocked), [unlocked]);
  const all = AchievementEngine.all();

  return (
    <div className="min-h-screen bg-bg-primary p-6 md:p-10">
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-6">
        <h1 className="font-headline text-3xl font-bold text-accent-gold">Achievements</h1>
        <Button variant="ghost" onClick={() => nav('main-menu')}>← Back</Button>
      </header>

      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-3">
        {all.length === 0 && (
          <p className="text-sm text-text-muted col-span-2 italic">
            Achievements will appear here once the engine has registered them.
            They require a game session to have loaded data.
          </p>
        )}
        {all.map((a) => {
          const isUnlocked = unlockedSet.has(a.id);
          const hidden = a.isSecret && !isUnlocked;
          return (
            <Card
              key={a.id}
              title={hidden ? '???' : a.name}
              subtitle={hidden ? 'Secret achievement' : a.category}
              accent={isUnlocked ? 'gold' : undefined}
            >
              <p className="text-sm text-text-secondary">
                {hidden ? 'Play the game to discover this achievement.' : a.description}
              </p>
              {isUnlocked && <p className="mt-2 text-xs text-status-success">✓ Unlocked</p>}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
