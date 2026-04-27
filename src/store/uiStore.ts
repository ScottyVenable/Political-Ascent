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
  | 'character';

export interface ModalState {
  id: string;
  type: 'event' | 'bill' | 'dialogue' | 'confirm' | 'info';
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
}

interface UIStoreActions {
  setActivePanel: (panel: PanelId) => void;
  openModal: (modal: ModalState) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  pushToast: (toast: Omit<ToastMessage, 'id' | 'createdAt'>) => void;
  dismissToast: (id: string) => void;
  setContextPanelOpen: (open: boolean) => void;
}

type Store = UIState & UIStoreActions;

export const useUIStore = create<Store>()(
  immer((set) => ({
    activePanel: 'dashboard',
    modals: [],
    toasts: [],
    contextPanelOpen: true,

    setActivePanel: (panel) =>
      set((s) => {
        s.activePanel = panel;
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
  })),
);
