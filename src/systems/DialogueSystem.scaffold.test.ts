import { describe, it, expect } from 'vitest';
import {
  createDialogueInterpreter,
  type DialogueRuntimeTree,
  type DialogueRuntimeEffect,
} from './DialogueSystem';

describe('Dialogue scaffold interpreter', () => {
  it('loads a tree and moves through a selected branch', () => {
    const calls: DialogueRuntimeEffect[][] = [];
    const interpreter = createDialogueInterpreter({
      applyEffects(effects) {
        calls.push([...effects]);
      },
    });

    const tree: DialogueRuntimeTree = {
      id: 'm2-test-tree',
      startNodeId: 'start',
      nodes: {
        start: {
          id: 'start',
          text: 'Start',
          onEnterEffects: [{ kind: 'flag', key: 'met_chief', value: true }],
          choices: [{ id: 'c1', text: 'Continue', nextNodeId: 'next' }],
        },
        next: {
          id: 'next',
          text: 'Next',
          choices: [{ id: 'c2', text: 'End', effects: [{ kind: 'resource', key: 'xp', value: 5 }] }],
        },
      },
    };

    const initial = interpreter.loadTree(tree);
    expect(initial.currentNodeId).toBe('start');
    expect(initial.resolved).toBe(false);
    expect(calls).toHaveLength(1);

    const afterFirstChoice = interpreter.choose(initial, 'c1');
    expect(afterFirstChoice.currentNodeId).toBe('next');
    expect(afterFirstChoice.visitedNodeIds).toContain('next');

    const resolved = interpreter.choose(afterFirstChoice, 'c2');
    expect(resolved.resolved).toBe(true);
    expect(calls).toHaveLength(2);
  });

  it('advance resolves a node with no choices', () => {
    const interpreter = createDialogueInterpreter();
    const tree: DialogueRuntimeTree = {
      id: 'single-node',
      startNodeId: 'only',
      nodes: {
        only: {
          id: 'only',
          text: 'Done',
          choices: [],
        },
      },
    };

    const state = interpreter.loadTree(tree);
    const advanced = interpreter.advance(state);
    expect(advanced.resolved).toBe(true);
  });
});
