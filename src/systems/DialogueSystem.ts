import type { DialogueTree, DialogueNode, DialogueOption, Requirement } from '@/types';
import { useCharacterStore } from '@/store/characterStore';
import { useWorldStore } from '@/store/worldStore';
import { useGameStore } from '@/store/gameStore';
import { applyEffects } from '@/engine/applyEffect';

/**
 * DialogueSystem — pure tree navigation plus requirement/cost gates.
 *
 * Dialogue trees live in JSON; this module reads them, evaluates option
 * visibility, and dispatches effects/costs when the player picks an option.
 */
export interface DialogueSystemAPI {
  getNode(tree: DialogueTree, nodeId: string): DialogueNode | undefined;
  /** Returns only the options the player can currently see (requirements met). */
  visibleOptions(tree: DialogueTree, nodeId: string): DialogueOption[];
  /** Applies an option's costs+effects, returns the next node id. */
  choose(tree: DialogueTree, nodeId: string, optionId: string):
    { ok: boolean; nextNodeId?: string; reason?: string };
}

function requirementMet(req: Requirement): boolean {
  const char = useCharacterStore.getState();
  const world = useWorldStore.getState();
  switch (req.type) {
    case 'stat': {
      const v = char.stats[req.stat];
      switch (req.operator) {
        case 'gt': return v > req.value;
        case 'gte': return v >= req.value;
        case 'lt': return v < req.value;
        case 'lte': return v <= req.value;
        case 'eq': return v === req.value;
      }
      return false;
    }
    case 'trait':
      return char.traits.some((t) => (t as unknown as string) === req.traitId);
    case 'relationship': {
      const rel = world.relationships[req.npcId] ?? 0;
      return req.operator === 'gt' ? rel > req.value : rel < req.value;
    }
    case 'flag':
      return (world.flags[req.flag] ?? false) === req.value;
  }
}

export const DialogueSystem: DialogueSystemAPI = {
  getNode(tree, nodeId) {
    return tree.nodes[nodeId];
  },

  visibleOptions(tree, nodeId) {
    const node = tree.nodes[nodeId];
    if (!node?.options) return [];
    return node.options.filter((opt) => {
      if (opt.isHidden) return false;
      if (!opt.requirements) return true;
      return opt.requirements.every(requirementMet);
    });
  },

  choose(tree, nodeId, optionId) {
    const node = tree.nodes[nodeId];
    if (!node) return { ok: false, reason: 'Unknown node' };
    const opt = node.options?.find((o) => o.id === optionId);
    if (!opt) return { ok: false, reason: 'Unknown option' };
    if (opt.requirements && !opt.requirements.every(requirementMet)) {
      return { ok: false, reason: 'Requirement not met' };
    }

    const game = useGameStore.getState();
    if (opt.costs?.pc !== undefined) {
      if (game.politicalCapital < opt.costs.pc) {
        return { ok: false, reason: 'Insufficient political capital' };
      }
      game.addPoliticalCapital(-opt.costs.pc);
    }
    if (opt.costs?.ap !== undefined) {
      const ok = game.spendAP(opt.costs.ap);
      if (!ok) return { ok: false, reason: 'Insufficient action points' };
    }

    if (opt.effects) applyEffects(opt.effects);
    return { ok: true, nextNodeId: opt.nextNodeId };
  },
};
