import { useGameStore } from '@/store/gameStore';
import { useWorldStore } from '@/store/worldStore';
import { toEpochDays } from '@/utils/date';
import { createLogger } from '@/utils/logger';
import { applyEffectImmediate } from './applyEffect';

const log = createLogger('EffectScheduler');

/**
 * Drains the deferred-effect queue.
 *
 * Designed to be called from the daily TimeEngine hook by `GameEngine`.
 * Effects whose `applyOnEpochDay` is on or before the current game-day are
 * applied via `applyEffectImmediate` (bypassing the queue) and removed from
 * the world store. Order is preserved as enqueued, which keeps the simulation
 * deterministic given a deterministic seed.
 *
 * See GDD §25 for the lifecycle and rationale.
 */
function processDue(): number {
  const today = toEpochDays(useGameStore.getState().currentDate);
  const queue = useWorldStore.getState().scheduledEffects;
  if (queue.length === 0) return 0;

  // Snapshot the due ids in stable order BEFORE applying — applying may
  // mutate other parts of the store, but should not push new scheduled
  // effects synchronously since enqueue requires `delayDays > 0` and we
  // strip that on storage.
  const due = queue.filter((e) => e.applyOnEpochDay <= today);
  if (due.length === 0) return 0;

  for (const entry of due) {
    applyEffectImmediate(entry.effect);
  }

  useWorldStore.getState().removeScheduledEffects(due.map((e) => e.id));

  log.info('processed deferred effects', { count: due.length, today });
  return due.length;
}

export const EffectScheduler = {
  /** Run the daily drain. Returns the count of effects applied. */
  processDue,
};
