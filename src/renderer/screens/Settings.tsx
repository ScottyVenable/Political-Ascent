import { useSettingsStore } from '@/store/settingsStore';
import { useDevStore } from '@/store/devStore';
import { setLogLevel } from '@/utils/logger';
import { useState, useEffect } from 'react';
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
        <DeveloperCard />
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

/**
 * Developer-mode card. Shipped behind a confirmation dialog (todo#21):
 * activating dev mode warns that any save produced afterward will be
 * marked as a developer save, then arms the master switch in
 * `useDevStore`. The individual cheat toggles only have effect once
 * the master switch is on.
 *
 * The "verbose logging" toggle additionally lowers the global logger
 * threshold to `'debug'` for the rest of the session.
 */
function DeveloperCard(): JSX.Element {
  const dev = useDevStore((s) => s);
  const [showConfirm, setShowConfirm] = useState(false);

  // Mirror verboseLogging into the logger module each time it changes.
  // Done in an effect rather than inside `toggle` so toggling via any
  // other call site (devtools, future hotkey) stays consistent.
  useEffect(() => {
    setLogLevel(dev.enabled && dev.verboseLogging ? 'debug' : 'info');
  }, [dev.enabled, dev.verboseLogging]);

  const handleArm = (): void => setShowConfirm(true);
  const handleConfirm = (): void => {
    dev.enable();
    setShowConfirm(false);
  };
  const handleDisarm = (): void => dev.disable();

  return (
    <Card title="Developer">
      <p className="text-xs text-text-muted mb-3">
        Cheats and debug surfaces. Saves created while developer mode is
        active will be marked as <span className="text-accent-crimson">developer saves</span>{' '}
        in the load list.
      </p>

      {!dev.enabled ? (
        <Button variant="ghost" onClick={handleArm}>
          Enable developer mode…
        </Button>
      ) : (
        <>
          <Toggle
            label="God mode (no lose conditions)"
            value={dev.godMode}
            onChange={() => dev.toggle('godMode')}
          />
          <Toggle
            label="Infinite resources"
            value={dev.infiniteResources}
            onChange={() => dev.toggle('infiniteResources')}
          />
          <Toggle
            label="Instant actions (skip AP/PC/time costs)"
            value={dev.instantActions}
            onChange={() => dev.toggle('instantActions')}
          />
          <Toggle
            label="Reveal hidden information"
            value={dev.revealHidden}
            onChange={() => dev.toggle('revealHidden')}
          />
          <Toggle
            label="Verbose logging (debug level)"
            value={dev.verboseLogging}
            onChange={() => dev.toggle('verboseLogging')}
          />
          <div className="mt-3">
            <Button variant="ghost" onClick={handleDisarm}>
              Disable developer mode
            </Button>
          </div>
        </>
      )}

      {showConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dev-confirm-title"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-bg-primary/80"
        >
          <div className="max-w-md w-[90%] bg-bg-elevated border border-accent-crimson/40 rounded-lg p-6 shadow-xl">
            <h2 id="dev-confirm-title" className="font-headline text-xl text-accent-crimson">
              Enable developer mode?
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Developer mode unlocks cheats and debug tools. Saves created while
              dev mode is on will be tagged as developer saves. This is intended
              for testing — not for normal play.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowConfirm(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleConfirm}>
                Enable developer mode
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
