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
  };
  display: {
    theme: 'dark' | 'light';
    fontScale: number; // 0.8–1.4
    reduceMotion: boolean;
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
  },
  display: { theme: 'dark', fontScale: 1.0, reduceMotion: false },
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
