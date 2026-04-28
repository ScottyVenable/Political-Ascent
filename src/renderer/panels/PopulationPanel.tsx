import { useWorldStore } from '@/store/worldStore';
import { Card } from '../components/Card';
import { Bar } from '../components/Bar';
import { Term } from '../components/tooltip';

export function PopulationPanel(): JSX.Element {
  const population = useWorldStore((s) => s.population);

  return (
    <div className="grid md:grid-cols-2 gap-3">
      {population.map((g) => (
        <Card key={g.id} title={g.name} subtitle={`${g.size}% of population`}>
          <div className="space-y-2">
            <Bar
              label={<Term term="happiness"><span>Happiness</span></Term>}
              value={g.happiness}
              valueLabel={`${Math.round(g.happiness)}`}
              tone={g.happiness > 55 ? 'success' : g.happiness < 40 ? 'danger' : 'neutral'}
            />
            <Bar
              label={<Term term="radicalism"><span>Radicalism</span></Term>}
              value={g.radicalism}
              valueLabel={`${Math.round(g.radicalism)}`}
              tone={g.radicalism > 50 ? 'warning' : 'neutral'}
            />
            <Bar
              label={<Term term="activism"><span>Activism</span></Term>}
              value={g.activism}
              valueLabel={`${Math.round(g.activism)}`}
            />
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
