import { useSettingsStore } from '@/store/settingsStore';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Slider as StyledSlider } from '../components/Slider';
import { useRouter } from '../router';

export function Settings(): JSX.Element {
  const nav = useRouter((s) => s.navigate);
  const settings = useSettingsStore((s) => s);

  const updateAudio = settings.updateAudio;
  const updateGameplay = settings.updateGameplay;
  const updateDisplay = settings.updateDisplay;
  const updateAccessibility = settings.updateAccessibility;
  const reset = settings.reset;

  return (
    <div className="min-h-screen bg-bg-primary p-6 md:p-10">
      <header className="max-w-3xl mx-auto flex justify-between items-center mb-6">
        <h1 className="font-headline text-3xl font-bold text-accent-gold">Settings</h1>
        <Button variant="ghost" onClick={() => nav('main-menu')}>← Back</Button>
      </header>
      <div className="max-w-3xl mx-auto grid gap-4">
        <Card title="Audio">
          <Slider label="Master" value={settings.audio.master} onChange={(v) => updateAudio({ master: v })} />
          <Slider label="Music" value={settings.audio.music} onChange={(v) => updateAudio({ music: v })} />
          <Slider label="SFX" value={settings.audio.sfx} onChange={(v) => updateAudio({ sfx: v })} />
          <Slider label="UI" value={settings.audio.ui} onChange={(v) => updateAudio({ ui: v })} />
        </Card>
        <Card title="Auto-pause">
          <Toggle label="On event" value={settings.gameplay.autoPauseOnEvent} onChange={(v) => updateGameplay({ autoPauseOnEvent: v })} />
          <Toggle label="On crisis" value={settings.gameplay.autoPauseOnCrisis} onChange={(v) => updateGameplay({ autoPauseOnCrisis: v })} />
          <Toggle label="On month end" value={settings.gameplay.autoPauseOnMonthEnd} onChange={(v) => updateGameplay({ autoPauseOnMonthEnd: v })} />
          <Toggle label="On year end" value={settings.gameplay.autoPauseOnYearEnd} onChange={(v) => updateGameplay({ autoPauseOnYearEnd: v })} />
          <Toggle label="On low AP" value={settings.gameplay.autoPauseOnLowAP} onChange={(v) => updateGameplay({ autoPauseOnLowAP: v })} />
          <Toggle label="On negative poll" value={settings.gameplay.autoPauseOnNegativePoll} onChange={(v) => updateGameplay({ autoPauseOnNegativePoll: v })} />
        </Card>
        <Card title="Display">
          <Slider
            label="Font scale"
            min={80} max={140}
            value={Math.round(settings.display.fontScale * 100)}
            onChange={(v) => updateDisplay({ fontScale: v / 100 })}
          />
          <Toggle label="Reduce motion" value={settings.display.reduceMotion} onChange={(v) => updateDisplay({ reduceMotion: v })} />
        </Card>
        <Card title="Accessibility">
          <Toggle label="High contrast" value={settings.accessibility.highContrast} onChange={(v) => updateAccessibility({ highContrast: v })} />
          <Toggle label="Dyslexic font" value={settings.accessibility.dyslexicFont} onChange={(v) => updateAccessibility({ dyslexicFont: v })} />
        </Card>
        <Button variant="danger" onClick={reset}>Reset to defaults</Button>
      </div>
    </div>
  );
}

/**
 * Labeled slider — wraps the shared styled `Slider` with a label row.
 * Named locally to avoid confusion with the imported component; all
 * visual behaviour (diamond thumb, gold fill) comes from the import.
 */
function Slider({
  label, value, onChange, min = 0, max = 100,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}): JSX.Element {
  return (
    <label className="block mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-text-secondary">{label}</span>
        <span className="font-mono text-accent-gold tabular-nums">{value}</span>
      </div>
      <StyledSlider value={value} min={min} max={max} onChange={onChange} ariaLabel={label} />
    </label>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }): JSX.Element {
  return (
    <label className="flex items-center justify-between mb-2 cursor-pointer">
      <span className="text-sm text-text-primary">{label}</span>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-accent-gold" />
    </label>
  );
}
