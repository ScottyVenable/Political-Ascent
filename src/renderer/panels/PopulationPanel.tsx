import { useWorldStore } from '@/store/worldStore';
import { Card } from '../components/Card';
import { Bar } from '../components/Bar';

export function PopulationPanel(): JSX.Element {
  const population = useWorldStore((s) => s.population);

  return (
    <div className="grid md:grid-cols-2 gap-3">
      {population.map((g) => (
        <Card key={g.id} title={g.name} subtitle={`${g.size}% of population`}>
          <div className="space-y-2">
            <Bar
              label="Happiness"
              value={g.happiness}
              valueLabel={`${Math.round(g.happiness)}`}
              tone={g.happiness > 55 ? 'success' : g.happiness < 40 ? 'danger' : 'neutral'}
            />
            <Bar
              label="Radicalism"
              value={g.radicalism}
              valueLabel={`${Math.round(g.radicalism)}`}
              tone={g.radicalism > 50 ? 'warning' : 'neutral'}
            />
            <Bar label="Activism" value={g.activism} valueLabel={`${Math.round(g.activism)}`} />
            <div className="flex justify-between text-xs text-text-muted pt-1">
              <span>Income index: {g.income}</span>
              <span>Loyalty: {g.loyalty}</span>
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              {g.tags.map((t) => (
                <span key={t} className="text-xs bg-bg-tertiary rounded px-2 py-0.5 text-text-muted">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
