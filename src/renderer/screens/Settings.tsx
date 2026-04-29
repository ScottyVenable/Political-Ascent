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
        {/* Tooltip behaviour (todo#49) */}
        <Card title="Tooltips">
          {/* How long the player must hover before a tooltip auto-pins.
              Range 0.5\u20135 seconds (stored as ms). The slider snaps to
              250ms increments for readability. */}
          <div className="space-y-1">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-text-secondary">Pin hold duration</span>
              <span className="font-mono text-sm text-accent-gold tabular-nums">
                {(settings.gameplay.tooltipPinMs / 1000).toFixed(1)}s
              </span>
            </div>
            <Slider
              label=""
              min={500}
              max={5000}
              value={settings.gameplay.tooltipPinMs}
              onChange={(v) => updateGameplay({ tooltipPinMs: Math.round(v / 250) * 250 })}
            />
            <p className="font-mono text-[0.625rem] text-text-muted">
              Hold cursor over any highlighted term for this long to pin the tooltip open.
            </p>
          </div>
        </Card>
        <Card title="Display">
          <Slider
            label="Font scale"
            min={80} max={140}
            value={Math.round(settings.display.fontScale * 100)}
            onChange={(v) => updateDisplay({ fontScale: v / 100 })}
          />
          <Toggle label="Reduce motion" value={settings.display.reduceMotion} onChange={(v) => updateDisplay({ reduceMotion: v })} />
          {/* Number-precision selector (todo#58). Drives compact money
              formatters across the dashboard / economy panel. `auto` lets
              the formatter pick a sensible default per magnitude
              ("$1.7T" / "$42B"); a fixed digit count forces e.g. "$1.73T". */}
          <div className="flex flex-col gap-1.5 py-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-text-secondary">
                Number precision
              </span>
              <select
                aria-label="Number precision"
                className="rounded border border-border-subtle bg-surface-1 px-2 py-1 text-xs text-text-primary"
                value={String(settings.display.numberPrecision)}
                onChange={(e) => {
                  const raw = e.target.value;
                  // The select emits strings; map back to the union shape.
                  const next: 'auto' | 0 | 1 | 2 | 3 =
                    raw === 'auto' ? 'auto' : (Number(raw) as 0 | 1 | 2 | 3);
                  updateDisplay({ numberPrecision: next });
                }}
              >
                <option value="auto">Auto</option>
                <option value="0">0 digits ($2T)</option>
                <option value="1">1 digit ($1.7T)</option>
                <option value="2">2 digits ($1.73T)</option>
                <option value="3">3 digits ($1.734T)</option>
              </select>
            </div>
            <p className="font-mono text-[0.625rem] text-text-muted">
              Controls fractional digits in compact money displays. Hover any
              KPI for the exact comma-grouped value.
            </p>
          </div>
          {/* Fullscreen toggle: delegates to Electron BrowserWindow so
              the preference is persisted and restored on next launch.
              No-ops in the browser / mobile builds. (#80) */}
          <FullscreenToggle />
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

/**
 * Fullscreen toggle for the Display section of Settings.
 *
 * Reads the current window fullscreen state via the Electron bridge and
 * calls `pa:window:setFullscreen` to change it. The main-process listener
 * persists the change so it is restored on the next launch.
 *
 * If running outside Electron (browser, mobile), the bridge is absent and
 * the toggle renders nothing. (#80)
 */
function FullscreenToggle(): JSX.Element | null {
  const bridge = typeof window !== 'undefined'
    ? (window as unknown as { politicalAscent?: { window?: { isFullscreen: () => Promise<boolean>; setFullscreen: (v: boolean) => Promise<boolean> } } }).politicalAscent?.window
    : undefined;

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialise from the actual window state on mount.
  useEffect(() => {
    if (!bridge) return;
    void bridge.isFullscreen().then(setIsFullscreen);
  }, [bridge]);

  if (!bridge) return null;

  return (
    <Toggle
      label="Fullscreen on launch"
      value={isFullscreen}
      onChange={(v) => {
        void bridge.setFullscreen(v).then((ok) => {
          if (ok) setIsFullscreen(v);
        });
      }}
    />
  );
}
