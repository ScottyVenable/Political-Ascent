import type { Effect, Requirement } from './effect';

export interface DialogueOption {
  id: string;
  label: string;
  requirements?: Requirement[];
  costs?: { ap?: number; pc?: number };
  effects?: Effect[];
  nextNodeId: string;
  /** Only shows when all requirements are satisfied. */
  isHidden?: boolean;
}

export interface DialogueNode {
  id: string;
  speaker: 'player' | 'npc' | 'narrator';
  text: string;
  options?: DialogueOption[];
  autoAdvance?: string;
}

export interface DialogueTree {
  id: string;
  npcId: string;
  rootNodeId: string;
  nodes: Record<string, DialogueNode>;
}
