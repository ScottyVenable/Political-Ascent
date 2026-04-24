/**
 * Tests for the dashboard's focus resolver.
 *
 * The resolver answers "what should the Situation Room highlight?" and
 * drives the primary CTA on the dashboard. Its priority order is the
 * gameplay contract — changing it affects every new game session — so
 * it is worth exercising in isolation.
 *
 * Priority (highest first):
 *   1. An active event is pending.
 *   2. A bill has reached the `vote` stage.
 *   3. Any pending bill — the furthest-along one wins.
 *   4. Nothing to do — "quiet" fallback.
 */
import { describe, it, expect } from 'vitest';
import { resolveFocus } from './DashboardPanel';
import type { Bill } from '@/types';

// Minimal bill factory. Only the fields the resolver reads are filled
// in; the rest are cast-as to keep the test focused.
function bill(stage: Bill['stage'], title = 'Test Bill'): Bill {
  return {
    id: `b_${stage}_${title}` as Bill['id'],
    templateId: 't',
    title,
    description: '',
    tags: [],
    stage,
    sponsor: 'p1',
    cosponsors: [],
    pcInvested: 0,
    opposition: 0,
    supportVotes: 0,
    opposeVotes: 0,
    createdAt: '2024-01-01',
    effects: [],
  } as Bill;
}

describe('resolveFocus', () => {
  it('returns a quiet focus when nothing is active', () => {
    expect(resolveFocus(undefined, [])).toEqual({ kind: 'quiet' });
  });

  it('prefers an active event over every other signal', () => {
    const focus = resolveFocus('EVT_SCANDAL', [bill('vote')]);
    expect(focus).toEqual({ kind: 'event', title: 'EVT_SCANDAL' });
  });

  it('prefers a bill at vote over bills earlier in the pipeline', () => {
    const voteBill = bill('vote', 'Floor Vote Bill');
    const focus = resolveFocus(undefined, [bill('committee'), voteBill]);
    expect(focus.kind).toBe('vote');
    if (focus.kind === 'vote') expect(focus.bill).toBe(voteBill);
  });

  it('falls back to the furthest-along pending bill', () => {
    const leading = bill('floor_debate', 'Leading');
    const focus = resolveFocus(undefined, [bill('committee'), leading]);
    expect(focus.kind).toBe('pipeline');
    if (focus.kind === 'pipeline') {
      expect(focus.count).toBe(2);
      expect(focus.leading).toBe(leading);
    }
  });
});
