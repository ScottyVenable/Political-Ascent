import { useCharacterStore } from '@/store/characterStore';
import { GameEngine } from '@/engine/GameEngine';
import { Card } from '../components/Card';
import { StatBlock } from '../components/StatBlock';
import { IdeologyCompass } from '../components/IdeologyCompass';

export function CharacterPanel(): JSX.Element {
  const char = useCharacterStore((s) => s);
  const traitDefs = GameEngine.getTraits();

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card title={char.name || 'Unnamed'} subtitle={`Background: ${char.background}`} accent="gold">
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(char.stats) as Array<[keyof typeof char.stats, number]>).map(([k, v]) => (
            <StatBlock key={k} label={k[0].toUpperCase() + k.slice(1)} value={v} max={10} />
          ))}
        </div>
      </Card>

      <Card title="Traits" accent="blue">
        <ul className="space-y-2">
          {char.traits.length === 0 && <p className="text-sm text-text-muted">No traits.</p>}
          {char.traits.map((tid) => {
            const def = traitDefs.find((t) => (t.id as unknown as string) === (tid as unknown as string));
            return (
              <li key={tid as unknown as string} className="border-l-2 border-accent-blue pl-3">
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

      <Card title="Ideology">
        <IdeologyCompass
          value={char.ideology}
          size={240}
          label
          showReferenceFigures={false}
        />
      </Card>

      <Card title="Progression" accent="gold">
        <div className="text-sm space-y-1">
          <p>Level: <span className="font-mono text-accent-gold">{char.level}</span></p>
          <p>XP: <span className="font-mono">{char.xp}</span></p>
          <p>Skill points: <span className="font-mono text-accent-gold">{char.skillPoints}</span></p>
          <p>Skills unlocked: {char.unlockedSkills.length}</p>
        </div>
      </Card>
    </div>
  );
}
