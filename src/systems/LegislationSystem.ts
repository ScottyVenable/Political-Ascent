import type { Bill, BillTemplate, BillId, BillStage } from '@/types';
import { useGameStore } from '@/store/gameStore';
import { useCharacterStore } from '@/store/characterStore';
import { useWorldStore } from '@/store/worldStore';
import { applyEffects } from '@/engine/applyEffect';
import { SeededRNG } from '@/utils/random';
import { makeId } from '@/utils/id';
import { clamp } from '@/utils/math';

/**
 * LegislationSystem — bill lifecycle management.
 *
 * Flow: draft → committee → floor_debate → vote → signed/vetoed →
 * implementing → enacted | failed.
 *
 * Each stage advance consumes political capital and is influenced by the
 * player's Strategy stat plus relationships in the relevant chamber.
 */
export interface LegislationSystemAPI {
  draftBill(template: BillTemplate): Bill;
  advanceStage(billId: BillId): { ok: boolean; newStage: BillStage; reason?: string };
  resolveVote(billId: BillId): { passed: boolean; yea: number; nay: number };
  weeklyUpdate(): void;
}

const STAGE_ORDER: BillStage[] = ['draft', 'committee', 'floor_debate', 'vote'];

class LegislationSystemImpl implements LegislationSystemAPI {
  draftBill(template: BillTemplate): Bill {
    const rng = new SeededRNG(useWorldStore.getState().seed + Date.now());
    const bill: Bill = {
      id: makeId('bill', rng) as BillId,
      templateId: template.id,
      title: template.title,
      description: template.description,
      tags: template.tags,
      stage: 'draft',
      sponsor: useCharacterStore.getState().id || 'player',
      cosponsors: [],
      pcInvested: 0,
      opposition: template.opposition,
      supportVotes: 0,
      opposeVotes: 0,
      createdAt: isoDate(),
      effects: template.effects,
    };
    useWorldStore.getState().addBill(bill);
    return bill;
  }

  advanceStage(billId: BillId) {
    const world = useWorldStore.getState();
    const bill = world.pendingLegislation.find((b) => b.id === billId);
    if (!bill) return { ok: false, newStage: 'failed' as BillStage, reason: 'Bill not found' };

    const currentIdx = STAGE_ORDER.indexOf(bill.stage);
    if (currentIdx === -1 || currentIdx === STAGE_ORDER.length - 1) {
      return { ok: false, newStage: bill.stage, reason: 'Bill already at vote stage' };
    }
    const nextStage = STAGE_ORDER[currentIdx + 1];

    // PC costs per stage — rough MVP tuning.
    const costs: Record<BillStage, number> = {
      draft: 0,
      committee: 10,
      floor_debate: 15,
      vote: 10,
      signed: 0, vetoed: 0, implementing: 0, enacted: 0, failed: 0,
    };
    const pcCost = costs[nextStage];
    const pc = useGameStore.getState().politicalCapital;
    if (pc < pcCost) return { ok: false, newStage: bill.stage, reason: 'Insufficient political capital' };
    useGameStore.getState().addPoliticalCapital(-pcCost);

    world.updateBill(billId, { stage: nextStage, pcInvested: bill.pcInvested + pcCost });
    return { ok: true, newStage: nextStage };
  }

  resolveVote(billId: BillId) {
    const world = useWorldStore.getState();
    const bill = world.pendingLegislation.find((b) => b.id === billId);
    if (!bill) return { passed: false, yea: 0, nay: 0 };

    const strategy = useCharacterStore.getState().stats.strategy;
    const rng = new SeededRNG(world.seed + Number(billId.replace(/\D/g, '') || 0));
    const senate = world.congress.senate;

    let yea = 0;
    let nay = 0;

    for (const legis of senate) {
      const alignment = legis.priorities.some((p) => bill.tags.includes(p)) ? 0.3 : 0;
      const relationshipPush = (legis.relationship / 100) * 0.2;
      const partyBias = legis.party === 'D' ? 0 : 0; // neutral in MVP
      const opposition = (bill.opposition / 100) * 0.4;
      const strategyBoost = (strategy / 10) * 0.1;
      const baseChance = clamp(0.5 + alignment + relationshipPush + partyBias - opposition + strategyBoost, 0.05, 0.95);

      if (rng.next() < baseChance) yea++;
      else nay++;
    }

    const passed = yea >= 51;
    world.updateBill(billId, {
      stage: passed ? 'signed' : 'failed',
      supportVotes: yea,
      opposeVotes: nay,
    });

    if (passed) {
      applyEffects(bill.effects);
      world.movePending(billId, 'passed');
    } else {
      world.movePending(billId, 'failed');
    }

    return { passed, yea, nay };
  }

  weeklyUpdate(): void {
    // Future: decay opposition when player builds support, etc.
  }
}

function isoDate(): string {
  const d = useGameStore.getState().currentDate;
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
}

export const LegislationSystem: LegislationSystemAPI = new LegislationSystemImpl();
