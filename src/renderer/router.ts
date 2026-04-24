/**
 * Route enum and navigation hook.
 *
 * We keep routing in-app (no `react-router` dependency) because the app has
 * exactly 6 screens and we want a minimal dependency footprint. A single
 * store slice in `uiStore` would also work, but `routerStore` lets the
 * router logic evolve independently.
 */
import { create } from 'zustand';

export type RouteName =
  | 'main-menu'
  | 'character-creation'
  | 'scenario-select'
  | 'game'
  | 'settings'
  | 'achievements';

interface RouterState {
  route: RouteName;
  previous: RouteName | null;
}

interface RouterActions {
  navigate: (route: RouteName) => void;
  back: () => void;
}

export const useRouter = create<RouterState & RouterActions>()((set, get) => ({
  route: 'main-menu',
  previous: null,
  navigate: (route) => set({ previous: get().route, route }),
  back: () =>
    set((s) => ({
      route: s.previous ?? 'main-menu',
      previous: null,
    })),
}));
