import { useCharacterStore } from '@/store/characterStore';
import { useUIStore } from '@/store/uiStore';
import { SkillSystem } from '@/systems/SkillSystem';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

const BRANCHES = ['charisma', 'strategy', 'connections', 'integrity', 'stamina', 'wealth'] as const;

export function SkillsPanel(): JSX.Element {
  const unlocked = useCharacterStore((s) => s.unlockedSkills);
  const skillPoints = useCharacterStore((s) => s.skillPoints);
  const level = useCharacterStore((s) => s.level);
  const pushToast = useUIStore((s) => s.pushToast);

  const all = SkillSystem.all();

  function unlock(id: string): void {
    const res = SkillSystem.unlock(id);
    pushToast({
      message: res ? 'Skill unlocked' : 'Cannot unlock',
      severity: res ? 'success' : 'warning',
      ttl: 2500,
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h3 className="font-headline text-lg text-accent-gold">Skill Tree</h3>
        <span className="text-sm text-text-secondary">
          Level {level} · Skill points: <span className="text-accent-gold">{skillPoints}</span>
        </span>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        {BRANCHES.map((branch) => (
          <Card key={branch} title={branch[0].toUpperCase() + branch.slice(1)} accent="blue">
            <ul className="space-y-2">
              {all
                .filter((s) => s.branch === branch)
                .map((s) => {
                  const isUnlocked = unlocked.includes(s.id);
                  const canUnlock = SkillSystem.canUnlock(s.id);
                  return (
                    <li key={s.id} className="border-l-2 border-bg-tertiary pl-2">
                      <div className="flex items-baseline justify-between">
                        <span className={`font-headline text-sm ${isUnlocked ? 'text-accent-gold' : 'text-text-primary'}`}>
                          {s.name}
                        </span>
                        <span className="text-xs text-text-muted">Lv {s.requiredLevel}</span>
                      </div>
                      <p className="text-xs text-text-secondary">{s.description}</p>
                      <div className="mt-1">
                        {isUnlocked ? (
                          <span className="text-xs text-status-success">✓ Unlocked</span>
                        ) : (
                          <Button size="sm" variant="primary" disabled={!canUnlock.ok} onClick={() => unlock(s.id)}>
                            {canUnlock.ok ? 'Unlock' : (canUnlock.reason ?? 'Locked')}
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
