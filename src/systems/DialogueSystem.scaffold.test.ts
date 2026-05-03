import { describe, it, expect } from 'vitest';
import {
  createDialogueInterpreter,
  type DialogueRuntimeTree,
  type DialogueRuntimeEffect,
} from './DialogueSystem';

describe('Dialogue scaffold interpreter', () => {
  it('loads a tree and advances through linear nodes with deterministic flag effects', () => {
    const calls: DialogueRuntimeEffect[][] = [];
    const interpreter = createDialogueInterpreter({
      applyEffects(effects) {
        calls.push([...effects]);
      },
    });

    const tree: DialogueRuntimeTree = {
      id: 'linear-tree',
      startNodeId: 'start',
      nodes: {
        start: {
          id: 'start',
          text: 'Start',
          onEnterEffects: [{ kind: 'flag', key: 'met_chief', value: true }],
          nextNodeId: 'hallway',
          choices: [],
        },
        hallway: {
          id: 'hallway',
          text: 'Hallway',
          onEnterEffects: [{ kind: 'flag', key: 'entered_hallway', value: true }],
          nextNodeId: 'done',
          choices: [],
        },
        done: {
          id: 'done',
          text: 'Done',
          onEnterEffects: [{ kind: 'flag', key: 'heard_briefing', value: true }],
          choices: [],
        },
      },
    };

    const initial = interpreter.loadTree(tree);
    expect(initial.currentNodeId).toBe('start');
    expect(initial.resolved).toBe(false);
    expect(initial.flags).toEqual({ met_chief: true });
    expect(calls).toHaveLength(1);

    const afterFirstAdvance = interpreter.advance(initial);
    expect(afterFirstAdvance.currentNodeId).toBe('hallway');
    expect(afterFirstAdvance.flags).toEqual({
      met_chief: true,
      entered_hallway: true,
    });

    const afterSecondAdvance = interpreter.advance(afterFirstAdvance);
    expect(afterSecondAdvance.currentNodeId).toBe('done');
    expect(afterSecondAdvance.flags).toEqual({
      met_chief: true,
      entered_hallway: true,
      heard_briefing: true,
    });
    expect(afterSecondAdvance.appliedEffects).toEqual([
      { kind: 'flag', key: 'met_chief', value: true },
      { kind: 'flag', key: 'entered_hallway', value: true },
      { kind: 'flag', key: 'heard_briefing', value: true },
    ]);

    const resolved = interpreter.advance(afterSecondAdvance);
    expect(resolved.resolved).toBe(true);
    expect(calls.flat()).toEqual([
      { kind: 'flag', key: 'met_chief', value: true },
      { kind: 'flag', key: 'entered_hallway', value: true },
      { kind: 'flag', key: 'heard_briefing', value: true },
    ]);
  });

  it('chooses a branch and applies choice effects before next-node effects', () => {
    const calls: DialogueRuntimeEffect[][] = [];
    const interpreter = createDialogueInterpreter({
      applyEffects(effects) {
        calls.push([...effects]);
      },
    });

    const tree: DialogueRuntimeTree = {
      id: 'branching-tree',
      startNodeId: 'briefing',
      nodes: {
        briefing: {
          id: 'briefing',
          text: 'Choose your response',
          choices: [
            {
              id: 'support',
              text: 'Back the chair',
              nextNodeId: 'reaction',
              effects: [{ kind: 'flag', key: 'backed_chair', value: true }],
            },
          ],
        },
        reaction: {
          id: 'reaction',
          text: 'The room notices.',
          onEnterEffects: [{ kind: 'flag', key: 'room_reacts', value: true }],
          choices: [
            {
              id: 'close',
              text: 'Move on',
              effects: [{ kind: 'resource', key: 'xp', value: 5 }],
            },
          ],
        },
      },
    };

    const state = interpreter.loadTree(tree);
    const chosen = interpreter.choose(state, 'support');

    expect(chosen.currentNodeId).toBe('reaction');
    expect(chosen.flags).toEqual({
      backed_chair: true,
      room_reacts: true,
    });
    expect(chosen.appliedEffects).toEqual([
      { kind: 'flag', key: 'backed_chair', value: true },
      { kind: 'flag', key: 'room_reacts', value: true },
    ]);
    expect(calls.flat()).toEqual([
      { kind: 'flag', key: 'backed_chair', value: true },
      { kind: 'flag', key: 'room_reacts', value: true },
    ]);

    const resolved = interpreter.choose(chosen, 'close');
    expect(resolved.resolved).toBe(true);
    expect(resolved.appliedEffects).toEqual([
      { kind: 'flag', key: 'backed_chair', value: true },
      { kind: 'flag', key: 'room_reacts', value: true },
      { kind: 'resource', key: 'xp', value: 5 },
    ]);
  });
});
