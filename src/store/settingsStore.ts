import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface SettingsState {
  audio: {
    master: number; // 0–100
    music: number;
    sfx: number;
    ui: number;
  };
  gameplay: {
    autoPauseOnEvent: boolean;
    autoPauseOnCrisis: boolean;
    autoPauseOnMonthEnd: boolean;
    autoPauseOnYearEnd: boolean;
    autoPauseOnLowAP: boolean;
    autoPauseOnNegativePoll: boolean;
    /**
     * How long (in milliseconds) the player must hover over a term before
     * the Extended Tooltip auto-pins (hold-to-lock). Range: 500–5000ms.
     * Surfaced in Settings → Tooltips. (todo#49)
     */
    tooltipPinMs: number;
  };
  display: {
    theme: 'dark' | 'light';
    fontScale: number; // 0.8–1.4
    reduceMotion: boolean;
    /**
     * Fractional-digit precision for compact money formatters
     * (`formatBillionsUSDForDisplay`). `'auto'` lets the formatter pick
     * a sensible default per magnitude; otherwise forces 0..3 digits.
     * Surfaced in Settings → Display (todo#58).
     */
    numberPrecision: 'auto' | 0 | 1 | 2 | 3;
  };
  accessibility: {
    highContrast: boolean;
    colorblindMode: 'off' | 'protanopia' | 'deuteranopia' | 'tritanopia';
    dyslexicFont: boolean;
  };
}

interface SettingsActions {
  updateAudio: (patch: Partial<SettingsState['audio']>) => void;
  updateGameplay: (patch: Partial<SettingsState['gameplay']>) => void;
  updateDisplay: (patch: Partial<SettingsState['display']>) => void;
  updateAccessibility: (patch: Partial<SettingsState['accessibility']>) => void;
  reset: () => void;
}

type Store = SettingsState & SettingsActions;

const DEFAULTS: SettingsState = {
  audio: { master: 80, music: 70, sfx: 80, ui: 80 },
  gameplay: {
    autoPauseOnEvent: true,
    autoPauseOnCrisis: true,
    autoPauseOnMonthEnd: false,
    autoPauseOnYearEnd: true,
    autoPauseOnLowAP: true,
    autoPauseOnNegativePoll: false,
    // 3 seconds — bumped from 2s per todo#26 after playtesting showed
    // 2s was just shy of comfortable for new players reading nested
    // term definitions. Slider in Settings still allows 0.5–5s.
    tooltipPinMs: 3000,
  },
  display: { theme: 'dark', fontScale: 1.0, reduceMotion: false, numberPrecision: 'auto' },
  accessibility: { highContrast: false, colorblindMode: 'off', dyslexicFont: false },
};

export const useSettingsStore = create<Store>()(
  immer((set) => ({
    ...DEFAULTS,
    updateAudio: (patch) =>
      set((s) => {
        Object.assign(s.audio, patch);
      }),
    updateGameplay: (patch) =>
      set((s) => {
        Object.assign(s.gameplay, patch);
      }),
    updateDisplay: (patch) =>
      set((s) => {
        Object.assign(s.display, patch);
      }),
    updateAccessibility: (patch) =>
      set((s) => {
        Object.assign(s.accessibility, patch);
      }),
    reset: () => set(() => ({ ...DEFAULTS })),
  })),
);
