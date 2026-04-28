import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  WorldState,
  EconomicState,
  PopulationGroup,
  Legislator,
  Bill,
  ActiveEvent,
  QuestInstance,
  NewsItem,
  ScenarioId,
} from '@/types';

interface WorldStoreActions {
  initializeWorld: (partial: Partial<WorldState>) => void;
  updateEconomy: (patch: Partial<EconomicState>) => void;
  appendEconomySnapshot: (entry: EconomicState['history'][number]) => void;
  updateGroup: (id: string, patch: Partial<PopulationGroup>) => void;
  updateLegislator: (id: string, patch: Partial<Legislator>) => void;
  queueEvent: (event: ActiveEvent) => void;
  dismissEvent: (instanceId: string) => void;
  /**
   * Mark a non-repeatable event id as having fired. Idempotent. Persisted via
   * worldStore so save/load preserves the firing record.
   */
  markEventFired: (eventId: string) => void;
  /**
   * Stamp an event’s last-fired week. Used for repeatable-event cooldowns.
   */
  stampEventCooldown: (eventId: string, week: number) => void;
  addBill: (bill: Bill) => void;
  updateBill: (id: string, patch: Partial<Bill>) => void;
  movePending: (id: string, destination: 'passed' | 'failed') => void;
  addQuest: (quest: QuestInstance) => void;
  updateQuest: (id: string, patch: Partial<QuestInstance>) => void;
  pushNews: (news: NewsItem) => void;
  setFlag: (flag: string, value: boolean) => void;
  unlockAchievement: (id: string) => void;
  reset: () => void;
}

type Store = WorldState & WorldStoreActions;

const EMPTY: WorldState = {
  scenarioId: '' as ScenarioId,
  economy: {
    gdpGrowth: 2.1,
    unemployment: 4.0,
    inflation: 3.2,
    debt: 34000,
    deficit: 1700,
    gini: 0.41,
    trade: -900,
    history: [],
  },
  population: [],
  congress: { senate: [], house: [] },
  relationships: {},
  leverage: {},
  activeEvents: [],
  firedEventIds: [],
  eventCooldowns: {},
  activeQuests: [],
  pendingLegislation: [],
  passedLegislation: [],
  failedLegislation: [],
  unlockedAchievements: [],
  news: [],
  newsArchive: [],
  flags: {},
  seed: 1,
};

export const useWorldStore = create<Store>()(
  immer((set) => ({
    ...EMPTY,

    initializeWorld: (partial) =>
      set((s) => {
        Object.assign(s, partial);
      }),

    updateEconomy: (patch) =>
      set((s) => {
        Object.assign(s.economy, patch);
      }),

    appendEconomySnapshot: (entry) =>
      set((s) => {
        s.economy.history.push(entry);
        // Cap history to last 260 weeks (~5 years) to keep memory bounded.
        if (s.economy.history.length > 260) s.economy.history.shift();
      }),

    updateGroup: (id, patch) =>
      set((s) => {
        const g = s.population.find((p) => p.id === id);
        if (g) Object.assign(g, patch);
      }),

    updateLegislator: (id, patch) =>
      set((s) => {
        const all = [...s.congress.senate, ...s.congress.house];
        const target = all.find((l) => l.id === id);
        if (target) Object.assign(target, patch);
      }),

    queueEvent: (event) =>
      set((s) => {
        s.activeEvents.push(event);
      }),

    dismissEvent: (instanceId) =>
      set((s) => {
        s.activeEvents = s.activeEvents.filter((e) => e.instanceId !== instanceId);
      }),

    markEventFired: (eventId) =>
      set((s) => {
        if (!s.firedEventIds.includes(eventId)) s.firedEventIds.push(eventId);
      }),

    stampEventCooldown: (eventId, week) =>
      set((s) => {
        s.eventCooldowns[eventId] = week;
      }),

    addBill: (bill) =>
      set((s) => {
        s.pendingLegislation.push(bill);
      }),

    updateBill: (id, patch) =>
      set((s) => {
        const b = s.pendingLegislation.find((x) => x.id === id);
        if (b) Object.assign(b, patch);
      }),

    movePending: (id, destination) =>
      set((s) => {
        const idx = s.pendingLegislation.findIndex((b) => b.id === id);
        if (idx === -1) return;
        const [bill] = s.pendingLegislation.splice(idx, 1);
        if (destination === 'passed') s.passedLegislation.push(bill);
        else s.failedLegislation.push(bill);
      }),

    addQuest: (quest) =>
      set((s) => {
        s.activeQuests.push(quest);
      }),

    updateQuest: (id, patch) =>
      set((s) => {
        const q = s.activeQuests.find((x) => x.instanceId === id);
        if (q) Object.assign(q, patch);
      }),

    pushNews: (news) =>
      set((s) => {
        // The visible ticker is capped at 50 to keep the top-of-screen
        // strip lightweight. The archive (uncapped) is what the
        // Timeline panel reads, so older headlines remain available
        // for chronological browsing across the whole campaign.
        s.news.unshift(news);
        if (s.news.length > 50) s.news.pop();
        s.newsArchive.unshift(news);
      }),

    setFlag: (flag, value) =>
      set((s) => {
        s.flags[flag] = value;
      }),

    unlockAchievement: (id) =>
      set((s) => {
        if (!s.unlockedAchievements.includes(id)) s.unlockedAchievements.push(id);
      }),

    reset: () => set(() => ({ ...EMPTY })),
  })),
);
