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

/**
 * Singleton runtime handle for the store-aware dialogue system.
 * Import this to drive Zustand-coupled dialogue from any game subsystem.
 *
 * TODO(OQ-1): track active tree + node in a runtime context object
 * TODO(OQ-2): support interruptible dialogue (faction events mid-tree)
 * TODO(OQ-3): wire NPC portrait/name resolution
 * TODO(OQ-4): persist open-dialogue state across saves
 */
export const dialogueRuntime = DialogueSystem;

// M2 scaffold: independent lightweight interpreter for upcoming narrative flow.
export type DialogueRuntimeId = string;

export interface DialogueRuntimeEffect {
  kind: 'flag' | 'resource' | 'relationship' | 'ideology';
  key: string;
  value: number | boolean | string;
}

export interface DialogueRuntimeChoice {
  id: DialogueRuntimeId;
  text: string;
  nextNodeId?: DialogueRuntimeId;
  effects?: DialogueRuntimeEffect[];
}

export interface DialogueRuntimeNode {
  id: DialogueRuntimeId;
  text: string;
  speakerId?: string;
  onEnterEffects?: DialogueRuntimeEffect[];
  nextNodeId?: DialogueRuntimeId;
  choices: DialogueRuntimeChoice[];
}

export interface DialogueRuntimeTree {
  id: string;
  startNodeId: DialogueRuntimeId;
  nodes: Record<DialogueRuntimeId, DialogueRuntimeNode>;
}

export interface DialogueRuntimeState {
  treeId: string;
  currentNodeId: DialogueRuntimeId;
  resolved: boolean;
  visitedNodeIds: DialogueRuntimeId[];
  flags: Record<string, boolean>;
  appliedEffects: DialogueRuntimeEffect[];
}

export interface DialogueInterpreterHooks {
  applyEffects?: (effects: readonly DialogueRuntimeEffect[], state: DialogueRuntimeState) => void;
}

export interface DialogueInterpreterAPI {
  loadTree(tree: DialogueRuntimeTree): DialogueRuntimeState;
  advance(state: DialogueRuntimeState): DialogueRuntimeState;
  choose(state: DialogueRuntimeState, choiceId: DialogueRuntimeId): DialogueRuntimeState;
}

export function createDialogueInterpreter(hooks: DialogueInterpreterHooks = {}): DialogueInterpreterAPI {
  const applyEffectsHook = hooks.applyEffects ?? (() => {});

  let tree: DialogueRuntimeTree | null = null;

  const applyRuntimeEffects = (
    state: DialogueRuntimeState,
    effects: readonly DialogueRuntimeEffect[],
  ): DialogueRuntimeState => {
    let nextFlags = state.flags;

    for (const effect of effects) {
      if (effect.kind === 'flag' && typeof effect.value === 'boolean') {
        nextFlags = {
          ...nextFlags,
          [effect.key]: effect.value,
        };
      }
    }

    const nextState: DialogueRuntimeState = {
      ...state,
      flags: nextFlags,
      appliedEffects: [...state.appliedEffects, ...effects],
    };

    if (effects.length > 0) {
      applyEffectsHook(effects, nextState);
    }

    return nextState;
  };

  const getNode = (state: DialogueRuntimeState): DialogueRuntimeNode => {
    if (!tree) {
      throw new Error('Dialogue tree has not been loaded');
    }
    const node = tree.nodes[state.currentNodeId];
    if (!node) {
      throw new Error(`Unknown dialogue node: ${state.currentNodeId}`);
    }
    return node;
  };

  const markVisited = (state: DialogueRuntimeState, nodeId: DialogueRuntimeId): DialogueRuntimeState => {
    if (state.visitedNodeIds.includes(nodeId)) {
      return state;
    }
    return { ...state, visitedNodeIds: [...state.visitedNodeIds, nodeId] };
  };

  const transitionToNode = (
    state: DialogueRuntimeState,
    nextNodeId: DialogueRuntimeId,
    preNodeEffects: readonly DialogueRuntimeEffect[] = [],
  ): DialogueRuntimeState => {
    let nextState = state;

    if (preNodeEffects.length > 0) {
      nextState = applyRuntimeEffects(nextState, preNodeEffects);
    }

    nextState = markVisited({ ...nextState, currentNodeId: nextNodeId }, nextNodeId);
    const nextNode = getNode(nextState);

    if (nextNode.onEnterEffects?.length) {
      // TODO(OQ): confirm onEnter ordering relative to branching side-effects and telemetry.
      nextState = applyRuntimeEffects(nextState, nextNode.onEnterEffects);
    }

    return nextState;
  };

  return {
    loadTree(nextTree) {
      tree = nextTree;
      let initial: DialogueRuntimeState = {
        treeId: nextTree.id,
        currentNodeId: nextTree.startNodeId,
        resolved: false,
        visitedNodeIds: [nextTree.startNodeId],
        flags: {},
        appliedEffects: [],
      };

      const startNode = nextTree.nodes[nextTree.startNodeId];
      if (!startNode) {
        throw new Error(`Missing start node: ${nextTree.startNodeId}`);
      }
      // TODO(OQ): finalize speaker resolution order (node speaker, scene speaker, fallback narrator).
      if (startNode.onEnterEffects?.length) {
        // TODO(OQ): confirm onEnter ordering relative to UI reveal and VO playback.
        initial = applyRuntimeEffects(initial, startNode.onEnterEffects);
      }
      return initial;
    },

    advance(state) {
      const node = getNode(state);
      if (node.choices.length > 0) {
        return state;
      }
      if (node.nextNodeId) {
        return transitionToNode(state, node.nextNodeId);
      }
      return { ...state, resolved: true };
    },

    choose(state, choiceId) {
      const node = getNode(state);
      const choice = node.choices.find((c) => c.id === choiceId);
      if (!choice) {
        throw new Error(`Unknown dialogue choice: ${choiceId}`);
      }

      if (!choice.nextNodeId) {
        const resolvedState = choice.effects?.length
          ? applyRuntimeEffects(state, choice.effects)
          : state;
        return { ...resolvedState, resolved: true };
      }

      // TODO(OQ): lock ideology drift breakdown (short-term mood vs long-term worldview deltas).
      return transitionToNode(state, choice.nextNodeId, choice.effects ?? []);
    },
  };
}
