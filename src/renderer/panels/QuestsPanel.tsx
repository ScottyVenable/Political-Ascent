import { useMemo } from 'react';
import { GameEngine } from '@/engine/GameEngine';
import { QuestSystem } from '@/systems/QuestSystem';
import { useWorldStore } from '@/store/worldStore';
import { useUIStore } from '@/store/uiStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import type { QuestDefinition, QuestId } from '@/types';

export function QuestsPanel(): JSX.Element {
  const defs = useMemo(() => {
    // QuestSystem holds the registry; expose through its API.
    return QuestSystem.allDefinitions();
  }, []);
  const active = useWorldStore((s) => s.activeQuests);
  const flags = useWorldStore((s) => s.flags);
  const pushToast = useUIStore((s) => s.pushToast);

  const availableToStart = useMemo(() => {
    const activeIds = new Set(active.map((q) => q.questId));
    return defs.filter((d: QuestDefinition) => {
      if (activeIds.has(d.id)) return false;
      if (flags[`quest-complete:${d.id}`]) return false;
      return d.prerequisites.every((p) => flags[`quest-complete:${p}`]);
    });
  }, [defs, active, flags]);

  function start(id: QuestId): void {
    const ok = QuestSystem.start(id);
    pushToast({
      message: ok ? 'Quest started' : 'Cannot start quest',
      severity: ok ? 'info' : 'warning',
      ttl: 2500,
    });
  }

  void GameEngine; // silence lint for unused import; GameEngine ensures quests are loaded via registerData

  return (
    <div className="space-y-4">
      <section>
        <h3 className="font-headline text-lg text-accent-gold mb-2">Active</h3>
        {active.length === 0 && (
          <p className="text-sm text-text-muted italic">No active quests. Start one below.</p>
        )}
        <div className="grid md:grid-cols-2 gap-3">
          {active.map((inst) => {
            const def = defs.find((d) => d.id === inst.questId);
            if (!def) return null;
            const doneCount = def.objectives.filter((o) => inst.progress[o.id]).length;
            return (
              <Card key={inst.instanceId} title={def.title} subtitle={`Status: ${inst.status}`} accent="gold">
                <p className="text-sm text-text-secondary mb-3">{def.description}</p>
                <ul className="space-y-1 text-sm">
                  {def.objectives.map((o) => (
                    <li key={o.id} className="flex items-start gap-2">
                      <span className={inst.progress[o.id] ? 'text-status-success' : 'text-text-muted'}>
                        {inst.progress[o.id] ? '✓' : '○'}
                      </span>
                      <span className={inst.progress[o.id] ? 'line-through text-text-muted' : 'text-text-primary'}>
                        {o.description}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-text-muted mt-2">{doneCount}/{def.objectives.length} complete</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="font-headline text-lg text-accent-gold mb-2">Available</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {availableToStart.length === 0 && (
            <p className="text-sm text-text-muted italic">No quests available.</p>
          )}
          {availableToStart.map((def: QuestDefinition) => (
            <Card key={def.id as unknown as string} title={def.title}>
              <p className="text-sm text-text-secondary mb-3">{def.description}</p>
              <Button size="sm" variant="primary" onClick={() => start(def.id)}>Start quest</Button>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
