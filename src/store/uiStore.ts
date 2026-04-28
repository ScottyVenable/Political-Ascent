import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type PanelId =
  | 'dashboard'
  | 'legislation'
  | 'congress'
  | 'population'
  | 'economy'
  | 'quests'
  | 'cards'
  | 'collection'
  | 'skills'
  | 'character'
  | 'glossary'
  | 'timeline'
  | 'patch-notes';

/** Payload attached to a 'vote-result' modal (todo#85). */
export interface VoteResultPayload {
  billTitle: string;
  passed: boolean;
  yea: number;
  nay: number;
  /** Individual senator votes, sorted yeas-first then nays. */
  breakdown: Array<{ id: string; name: string; party: 'D' | 'R' | 'I'; state: string; vote: 'yea' | 'nay' }>;
}

export interface ModalState {
  id: string;
  type: 'event' | 'bill' | 'dialogue' | 'confirm' | 'info' | 'vote-result';
  payload?: unknown;
}

export interface ToastMessage {
  id: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'danger';
  createdAt: number;
  /** Auto-dismiss after this many ms. 0 = manual dismiss. */
  ttl: number;
}

interface UIState {
  activePanel: PanelId;
  modals: ModalState[];
  toasts: ToastMessage[];
  contextPanelOpen: boolean;
  /**
   * Whether the mobile sidebar drawer is currently open.
   *
   * Below the `md` breakpoint (≤767px — phones in portrait, narrow
   * tablets) the always-visible 192px sidebar would consume more than
   * a third of the viewport. Instead the sidebar is rendered as an
   * overlay drawer that the player toggles from the TopBar hamburger.
   * Above `md` this flag is irrelevant — the sidebar is always inline.
   */
  mobileSidebarOpen: boolean;
}

interface UIStoreActions {
  setActivePanel: (panel: PanelId) => void;
  openModal: (modal: ModalState) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  pushToast: (toast: Omit<ToastMessage, 'id' | 'createdAt'>) => void;
  dismissToast: (id: string) => void;
  setContextPanelOpen: (open: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
}

type Store = UIState & UIStoreActions;

export const useUIStore = create<Store>()(
  immer((set) => ({
    activePanel: 'dashboard',
    modals: [],
    toasts: [],
    contextPanelOpen: true,
    mobileSidebarOpen: false,

    setActivePanel: (panel) =>
      set((s) => {
        s.activePanel = panel;
        // Selecting a panel from the mobile drawer should close it so the
        // freshly-rendered panel is fully visible. On md+ this flag has
        // no rendered effect, so the assignment is harmless.
        s.mobileSidebarOpen = false;
      }),

    openModal: (modal) =>
      set((s) => {
        s.modals.push(modal);
      }),

    closeModal: (id) =>
      set((s) => {
        s.modals = s.modals.filter((m) => m.id !== id);
      }),

    closeAllModals: () =>
      set((s) => {
        s.modals = [];
      }),

    pushToast: (toast) =>
      set((s) => {
        s.toasts.push({
          ...toast,
          id: `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          createdAt: Date.now(),
        });
        if (s.toasts.length > 5) s.toasts.shift();
      }),

    dismissToast: (id) =>
      set((s) => {
        s.toasts = s.toasts.filter((t) => t.id !== id);
      }),

    setContextPanelOpen: (open) =>
      set((s) => {
        s.contextPanelOpen = open;
      }),

    setMobileSidebarOpen: (open) =>
      set((s) => {
        s.mobileSidebarOpen = open;
      }),

    toggleMobileSidebar: () =>
      set((s) => {
        s.mobileSidebarOpen = !s.mobileSidebarOpen;
      }),
  })),
);
