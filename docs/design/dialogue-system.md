# Dialogue System — Technical Design (M2)

> Author: **Sol** (engineering). Co-author for the authoring contract: **Vex** (narrative).
> Status: **Draft for Vex review**.
> Branch: `exp--legislative-overhaul`. Scenario branch model: see [.github/branch-reorg-runbook.md](../../.github/branch-reorg-runbook.md).
> Source documents: [docs/GDD.md](../GDD.md) §4.10, §4.12, §5, §12.3, §12.4, §12.5, §12.6, §12.9, §13.
> Companion findings: [.github/sol-answers-vex.md](../../.github/sol-answers-vex.md), [.github/sol-phase4-backlog.md](../../.github/sol-phase4-backlog.md).
> Cross-cutting findings touched: **F-02** (save migration ladder), **F-04** (dataLoader wiring), **F-05** (token resolver), **F-06** (per-store payload validation), **F-08** (delayDays/duration), **F-14** (`isHidden` vs `requirements` docs), **F-15** (data scaffold), **F-16** (`dialogueProgress` on `worldStore`).

This document is the **technical specification** that pairs with Vex's authoring guide ([docs/GDD.md §12.5](../GDD.md)). It does **not** contain implementation code — only the runtime contract, types, and example data shapes.

---

## 1. Goals & Non-Goals

### 1.1 Player fantasy

The dialogue system makes the four-beat arc structure ([§12.4.2](../GDD.md)) playable rather than narrated. Each arc beat — **Setup → Escalation → Pivot → Resolution** — surfaces in-character through tree interactions where:

- **Setup** plants stakes through an opening NPC line and a player-readable framing option.
- **Escalation** lets the player spend PC/AP to push the conversation; gates expose the cost of a stat or trait choice ([§12.5.4](../GDD.md)).
- **Pivot** is where one option must be genuinely uncomfortable, not merely suboptimal — the system must support that authoring intent without flattening it into an "obvious best choice" path.
- **Resolution** writes through `applyEffect` and pushes a news headline so the world acknowledges the choice ([§12.4.3](../GDD.md)).

The fantasy this enables: *the player feels like they are negotiating with named legislators inside the legislative clock*, not picking abstract event options. The Machine Boss line *"I don't have a problem with your bill. I have a calendar problem"* ([§12.3.2](../GDD.md)) is the load-bearing example for this design.

### 1.2 What ships in M2 v1

Scope locked for the M2 (Floor Manager) milestone:

1. `src/types/dialogue.ts` extended to the runtime type model in §3 (additive over the current shape; no break for existing `DialogueSystem` callers).
2. `src/engine/dataLoader.ts` registers `src/data/dialogue/<npc-id>/<tree-id>.json` (F-04, F-15).
3. `src/engine/dialogueTokens.ts` — pure token resolver with the namespaces in §4 (F-05).
4. `DialogueSystem` extended to evaluate the new condition kinds and dispatch the new effect kinds in §5.
5. `worldStore` gains the persisted `dialogue` shape in §8 (F-16).
6. `SaveSystem` schema bump v1 → v2 with a v1→v2 migrator (F-02; lands alongside this work).
7. Modal-overlay UI surface in §9 — one component family under `src/renderer/components/Dialogue/`.
8. Eight authored trees, one per archetype seed in [§12.3.4](../GDD.md), exercising every condition and effect kind at least once.

### 1.3 Non-goals

Explicitly **out of scope** for M2 v1:

- **Full Speech Composer integration** ([§12.6](../GDD.md)). The composer is M3 (Stump). The seam is documented in §10; the dialogue system must not lock decisions that constrain the composer.
- **Voice acting / audio playback.** No audio pipeline is touched. Every line is text.
- **Localised AI / generative line variation.** `{rng:*}` tokens (§4.4) pick from authored variants only.
- **Rich text rendering.** No `<em>`, `<strong>`, glossary anchors, or inline tooltips in the modal text in v1; deferred to M3 (§13.3).
- **Multiplayer / networked dialogue state.** Engine is single-player.
- **A node-graph authoring editor.** Hand-authored JSON is the only authoring surface for M2. Tooling is M5+.

---

## 2. Authoring Model (Vex-facing)

The single source of truth for authoring is [docs/GDD.md §12.5](../GDD.md). This section restates the mapping from authored JSON fields to runtime types so authors and engineering have one canonical glossary, and provides one full worked example.

### 2.1 Authored concepts → runtime types

| Authored concept | JSON file location | Maps to runtime type | Required fields | Optional fields |
|---|---|---|---|---|
| Tree | `src/data/dialogue/<npc-id>/<tree-id>.json` (file = one tree) | `DialogueTree` | `id`, `npcId`, `rootNodeId`, `nodes`, `$schemaVersion` | `voiceTag`, `arcId`, `resumable`, `notes` |
| Node | `tree.nodes[<node-id>]` | `DialogueNode` | `id`, `speaker`, `text` | `voiceTag`, `options`, `autoAdvance`, `onEnter` |
| Option | `node.options[i]` | `DialogueOption` | `id`, `label`, `nextNodeId` | `requirements`, `costs`, `effects`, `failureHint`, `isHidden` |
| Condition | inside `option.requirements` *and* `text-variants[i].when` | `DialogueCondition` | discriminator `kind` + kind-specific fields | — |
| Effect | inside `option.effects` and `node.onEnter` | `DialogueEffect` *or* legacy `Effect` | discriminator `type` (legacy) or `kind` (dialogue-specific) | per-kind |

### 2.2 `text` field — authored variants

Per [§12.5.6](../GDD.md), `text` may be:

- A plain `string` — the simple case, must obey the line-length budget in [§12.5.3](../GDD.md).
- An array of `{ when?: DialogueCondition; text: string }` — the **first** entry whose `when` evaluates true is used. An entry without `when` is the fallback and must come last. Falling off the end with no fallback is a **validation error** at load time.

### 2.3 Worked example — Audrey Vance (Machine Boss) negotiation beat

Path: `src/data/dialogue/audrey-vance/calendar-problem.json`. This tree is the M2 acceptance example for the Issue Arc Escalation beat ([§12.4.2](../GDD.md)) — it gates the player's infrastructure bill on the Machine Boss's calendar.

```jsonc
{
  "$schemaVersion": 1,
  "id": "calendar-problem",
  "npcId": "audrey-vance",
  "voiceTag": "machine-boss",
  "arcId": "infrastructure-renewal",
  "rootNodeId": "open",
  "resumable": true,
  "nodes": {
    "open": {
      "id": "open",
      "speaker": "audrey-vance",
      "voiceTag": "machine-boss",
      "text": "I don't have a problem with your bill, {pc.name}. I have a calendar problem.",
      "options": [
        {
          "id": "push",
          "label": "What would it take to move it up?",
          "requirements": [{ "kind": "stat", "stat": "connections", "op": "gte", "value": 4 }],
          "failureHint": "Requires Connections 4 or higher.",
          "costs": { "pc": 10 },
          "nextNodeId": "deal"
        },
        {
          "id": "leverage",
          "label": "I know where the bodies are.",
          "requirements": [
            { "kind": "trait", "traitId": "street-smart" },
            { "kind": "npc-relationship", "npcId": "audrey-vance", "op": "gte", "value": -10 }
          ],
          "isHidden": true,
          "costs": { "pc": 0 },
          "effects": [
            { "kind": "set-flag", "flag": "audrey-leveraged", "value": true },
            { "type": "relationship", "npcId": "audrey-vance", "value": -8 }
          ],
          "nextNodeId": "deal-coerced"
        },
        {
          "id": "retreat",
          "label": "I'll come back when the timing is better.",
          "nextNodeId": "exit"
        }
      ]
    },
    "deal": {
      "id": "deal",
      "speaker": "audrey-vance",
      "text": [
        { "when": { "kind": "bill-stage", "billRef": "current", "stage": "committee" },
          "text": "Move two of your committee witnesses to make room for mine. Then we'll talk." },
        { "text": "Sponsor the harbour amendment. Then we'll talk." }
      ],
      "options": [
        {
          "id": "accept",
          "label": "Done.",
          "effects": [
            { "kind": "update-relationship", "npcId": "audrey-vance", "delta": 6 },
            { "kind": "set-flag", "flag": "audrey-deal-struck", "value": true },
            { "kind": "push-news", "template": "audrey-deal-struck" }
          ],
          "nextNodeId": "exit"
        },
        {
          "id": "decline",
          "label": "I can't do that.",
          "effects": [
            { "kind": "update-relationship", "npcId": "audrey-vance", "delta": -2 }
          ],
          "nextNodeId": "exit"
        }
      ]
    },
    "deal-coerced": {
      "id": "deal-coerced",
      "speaker": "audrey-vance",
      "text": "Fine. The bill moves. Don't come back here.",
      "onEnter": [
        { "kind": "advance-quest", "questId": "infrastructure-renewal", "stage": "floor-debate" }
      ],
      "autoAdvance": "exit"
    },
    "exit": {
      "id": "exit",
      "speaker": "narrator",
      "text": "The conversation ends.",
      "onEnter": [{ "kind": "end-dialogue" }]
    }
  }
}
```

This single file exercises: `stat`, `trait`, `npc-relationship`, `bill-stage`, and compound implicit-AND condition kinds; `set-flag`, `update-relationship`, `advance-quest`, `push-news`, `end-dialogue` dialogue effects; the legacy `relationship` effect; `autoAdvance`; `text-variants`; `failureHint`; `isHidden`; and the `{pc.name}` token.

---

## 3. Runtime Type Model

Proposed location: **[src/types/dialogue.ts](../../src/types/dialogue.ts)** (extends the existing file).

### 3.1 Branded ids

```ts
// in src/types/common.ts (extend existing branded-id pattern)
export type TreeId = string & { readonly __brand: 'TreeId' };
export type NodeId = string & { readonly __brand: 'NodeId' };
export type NpcId  = string & { readonly __brand: 'NpcId' };
```

`NpcId` is shared with `worldStore.relationships` keys; existing string keys are widened via the brand at the loader boundary. No persisted string changes shape — branding is structural-only.

### 3.2 Tree, Node, Option

```ts
export interface DialogueTree {
  $schemaVersion: 1;
  id: TreeId;
  npcId: NpcId;
  voiceTag?: ArchetypeTag;     // see §12.3.2; informational
  arcId?: string;              // back-reference to QuestSystem arc
  rootNodeId: NodeId;
  resumable?: boolean;         // default: true
  notes?: string;              // author-only; never rendered
  nodes: Record<NodeId, DialogueNode>;
}

export interface DialogueNode {
  id: NodeId;
  speaker: 'player' | 'npc' | 'narrator';
  voiceTag?: ArchetypeTag;
  text: string | ReadonlyArray<DialogueTextVariant>;
  options?: ReadonlyArray<DialogueOption>;
  /** Auto-advance to a target node id after `onEnter` runs. */
  autoAdvance?: NodeId;
  /** Effects fired on node entry (before options render). */
  onEnter?: ReadonlyArray<DialogueEffect | Effect>;
}

export interface DialogueTextVariant {
  when?: DialogueCondition;
  text: string;
}

export interface DialogueOption {
  id: string;
  label: string;
  requirements?: ReadonlyArray<DialogueCondition>;
  costs?: { ap?: number; pc?: number };
  effects?: ReadonlyArray<DialogueEffect | Effect>;
  failureHint?: string;        // required when isHidden !== true and a requirement may fail
  isHidden?: boolean;          // F-14: distinct from requirement-driven hide
  nextNodeId: NodeId;
}
```

### 3.3 Conditions (discriminated union)

```ts
export type DialogueCondition =
  | { kind: 'flag';             flag: string; value: boolean }
  | { kind: 'stat';             stat: StatName; op: ComparisonOp; value: number }
  | { kind: 'trait';            traitId: string }
  | { kind: 'faction-standing'; factionId: string; op: ComparisonOp; value: number }
  | { kind: 'quest-state';      questId: string; state: QuestState }
  | { kind: 'npc-relationship'; npcId: NpcId; op: ComparisonOp; value: number }
  | { kind: 'bill-stage';       billRef: 'current' | string; stage: BillStage }
  | { kind: 'time';             from?: ISODate; to?: ISODate; era?: string }
  | { kind: 'rng';              probability: number /* 0..1, seeded — see §4.4 */ }
  | { kind: 'all'; of: ReadonlyArray<DialogueCondition> }
  | { kind: 'any'; of: ReadonlyArray<DialogueCondition> }
  | { kind: 'not'; of: DialogueCondition };

type ComparisonOp = 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte';
```

> Authoring shorthand: an option's `requirements: DialogueCondition[]` is interpreted as an implicit `all`-of. Use `{ kind: 'any', of: [...] }` explicitly for OR.

### 3.4 Effects (discriminated union)

```ts
export type DialogueEffect =
  | { kind: 'set-flag';            flag: string; value: boolean }
  | { kind: 'clear-flag';          flag: string }
  | { kind: 'start-quest';         questId: string }
  | { kind: 'advance-quest';       questId: string; stage: string }
  | { kind: 'update-relationship'; npcId: NpcId; delta: number }
  | { kind: 'unlock-dialogue';     treeId: TreeId }
  | { kind: 'goto-node';           nodeId: NodeId }
  | { kind: 'end-dialogue';        reason?: 'completed' | 'aborted' }
  | { kind: 'push-news';           template: string; params?: Record<string, string | number> };
```

The `Effect` union from [src/types/effect.ts](../../src/types/effect.ts) is also accepted in `effects` and `onEnter` arrays. The discriminator field differs (`type` vs `kind`) so the runtime can route without a registry: `'type' in e` is a legacy effect, `'kind' in e` is a dialogue effect. The legacy union currently has **9** variants (`stat`, `resource`, `group_happiness`, `group_loyalty`, `relationship`, `economy`, `flag`, `grant_card`, `trigger_quest`) — see [src/types/effect.ts lines 7-77](../../src/types/effect.ts).

### 3.5 Runtime state

```ts
export interface DialogueContext {
  pc: { name: string; background: string; ideology: { x: number; y: number; label: string } };
  npc: { id: NpcId; name: string; voiceTag?: ArchetypeTag; faction?: { id: string; name: string } };
  bill?: { current?: { id: string; title: string; topic: string; stage: BillStage } };
  faction: ReadonlyMap<string, { id: string; name: string; standing: number }>;
  world: { day: number; week: number; year: number; weekLabel: string; era: string };
  quest: ReadonlyMap<string, QuestState>;
  /** Seeded RNG derived per node; see §4.4 and §12.4. Never `Math.random`. */
  rng: SeededRng;
}

export interface DialogueState {
  treeId: TreeId;
  nodeId: NodeId;
  viewIndex: number;           // increments each time a node is rendered
  startedDay: number;
  history: ReadonlyArray<{ nodeId: NodeId; chosenOptionId?: string; day: number }>;
}

/** Persisted shape — see §8. */
export interface DialogueProgress {
  completed: Record<TreeId, { lastNodeId: NodeId; finishedDay: number; viewCount: number }>;
  inProgress?: { treeId: TreeId; nodeId: NodeId; ctxSnapshot: DialogueContextSnapshot } | null;
  npcRelationships: Record<NpcId, { score: number; lastInteractionDay: number }>;
}

/** Minimal snapshot — only fields that drive resumed rendering. Larger ctx is rebuilt at resume. */
export interface DialogueContextSnapshot {
  npcId: NpcId;
  arcId?: string;
  billRef?: { id: string; stage: BillStage };
  startedDay: number;
}
```

`ArchetypeTag` is the union of the twelve archetype slugs in [§12.3.2](../GDD.md): `'machine-boss' | 'reform-idealist' | 'donor-whisperer' | 'backbencher-loyalist' | 'media-operator' | 'coalition-broker' | 'ideological-enforcer' | 'reluctant-moderate' | 'old-guard-survivor' | 'crusader-freshman' | 'shadow-power' | 'principled-dissenter'`.

---

## 4. Token Resolution

### 4.1 Syntax

Single-brace `{namespace.path}` per [F-05](../../.github/sol-phase4-backlog.md) and [Sol → Vex Q4](../../.github/sol-answers-vex.md).

**Rejected alternative:** `{{token}}` (Mustache). Rejected because single-brace is ICU-MessageFormat-compatible — preserves the path for M5 i18n without rewriting authored content.

### 4.2 Namespaces

| Namespace | Allowed paths | Source |
|---|---|---|
| `pc` | `name`, `background`, `ideology.label`, `ideology.x`, `ideology.y` | `useCharacterStore` snapshot via `DialogueContext.pc` |
| `npc` | `name`, `voiceTag`, `faction.id`, `faction.name` | `DialogueContext.npc` |
| `bill` | `current.title`, `current.topic`, `current.stage` | `DialogueContext.bill.current` (undefined-safe) |
| `faction` | `<id>.name`, `<id>.standing` | `DialogueContext.faction.get(id)` |
| `world` | `day`, `week`, `year`, `weekLabel`, `era` | `DialogueContext.world` |
| `quest` | `<id>.state`, `<id>.stage` | `DialogueContext.quest.get(id)` |
| `rng` | `seeded` (alias: `pick:<a>\|<b>\|<c>`) | `DialogueContext.rng`; see §4.4 |

### 4.3 Resolver contract

Proposed location: **`src/engine/dialogueTokens.ts`**.

```ts
export function resolveTokens(text: string, ctx: DialogueContext): string;
```

**Pure.** No store reads. No `Date.now`. No `Math.random`. The function takes only the string and the snapshot.

**Failure mode.** A token whose namespace or path is unknown:

- In `import.meta.env.DEV` → `console.warn` once per `(treeId, nodeId, token)` and pass the literal `{token}` through untouched.
- In production → silent passthrough; emits a counter increment on the dev-only telemetry shim (no PII).

This matches the F-05 recommendation that unknown tokens render as literal.

### 4.4 Determinism contract for `{rng:*}`

Per [§13.2](../GDD.md), no in-game RNG path may use `Math.random()` or `Date.now()`. The `{rng:seeded}` and `{rng:pick:a|b|c}` tokens use a **per-view** seeded RNG derived as:

```
seed = hashJoin(world.seed, treeId, nodeId, state.viewIndex)
```

`hashJoin` is the existing FNV-1a-based helper used by `LegislationSystem`'s deterministic id derivation idiom (cited in F-01). Calling `resolveTokens` twice with the **same `viewIndex`** returns the same string — re-rendering on a React update is safe. Calling it with a new `viewIndex` (i.e., re-entering the node) returns a new draw — players who back out and re-enter see narrative variation, but a save→load→re-render pair is byte-identical.

---

## 5. Condition & Effect Kinds

### 5.1 Conditions — gate option visibility / availability

| Kind | Shape | Evaluator reads | Failure semantics |
|---|---|---|---|
| `flag` | `{ kind, flag, value }` | `worldStore.flags[flag]` | False if absent and `value === true`. |
| `stat` | `{ kind, stat, op, value }` | `characterStore.stats[stat]` | All ops in §3.3. |
| `trait` | `{ kind, traitId }` | `characterStore.traits` | Membership test. |
| `faction-standing` | `{ kind, factionId, op, value }` | `ctx.faction.get(factionId).standing` | False if faction not present. Today this is a thin selector on `worldStore` until FactionSystem ships (§14.4 below). |
| `quest-state` | `{ kind, questId, state }` | `worldStore.activeQuests` and completed roster | `state` ∈ `{ 'inactive', 'active', 'completed', 'failed' }`. |
| `npc-relationship` | `{ kind, npcId, op, value }` | `worldStore.relationships[npcId] ?? 0` | Default `0` for unknown NPC ids. |
| `bill-stage` | `{ kind, billRef, stage }` | `ctx.bill.current` if `billRef === 'current'`; else `worldStore.pendingLegislation.find(b.id === billRef)` | False if no bill in scope. |
| `time` | `{ kind, from?, to?, era? }` | `gameStore.currentDate`, `worldStore.scenarioId`-derived era | Date strings are ISO `YYYY-MM-DD`. |
| `rng` | `{ kind, probability }` | `ctx.rng.next()` | Seeded; see §4.4. Probability outside `[0,1]` clamps. |
| `all` | `{ kind, of }` | recurses | Empty `of` is **true** (vacuous). |
| `any` | `{ kind, of }` | recurses | Empty `of` is **false**. |
| `not` | `{ kind, of }` | recurses | Inverts. |

Evaluation order is **stable**: `requirements: DialogueCondition[]` is evaluated left-to-right, short-circuiting on first failure (for the implicit `all`). Tree iteration uses array index; `Record<NodeId, DialogueNode>` lookups are by key, not iteration order.

**Total: 12 condition kinds (9 leaf + 3 compound).**

### 5.2 Effects — run when option chosen / on node entry

#### 5.2.1 Legacy `Effect` kinds (delegate to `applyEffect`)

`stat`, `resource`, `group_happiness`, `group_loyalty`, `relationship`, `economy`, `flag`, `grant_card`, `trigger_quest`. All routed unchanged to [src/engine/applyEffect.ts](../../src/engine/applyEffect.ts). **9 kinds.**

> Note: `delayDays` and `duration` on `EffectBase` are declared but not honoured (F-08). Authors must not rely on them in M2; the loader emits a dev warning when set.

#### 5.2.2 Dialogue-specific `DialogueEffect` kinds

| Kind | Shape | Handler | Notes |
|---|---|---|---|
| `set-flag` | `{ kind, flag, value }` | `worldStore.setFlag(flag, value)` | Same store as legacy `flag` effect; distinct verb for authoring clarity. |
| `clear-flag` | `{ kind, flag }` | `worldStore.setFlag(flag, false)` | Convenience inverse. |
| `start-quest` | `{ kind, questId }` | `QuestSystem.start(questId)` | Replaces the legacy `trigger_quest` stub for dialogue surfaces (F-09). |
| `advance-quest` | `{ kind, questId, stage }` | `QuestSystem.advance(questId, stage)` | Stage string is opaque to the dialogue system; QuestSystem owns validation. |
| `update-relationship` | `{ kind, npcId, delta }` | `worldStore.relationships` patch via existing `relationship` Effect path | **Single chokepoint**: dialogue does not write to `relationships` directly. |
| `unlock-dialogue` | `{ kind, treeId }` | `DialogueSystem.markUnlocked(treeId)` | Sets `worldStore.dialogue.completed[treeId]` shape with `viewCount: 0` so the entry-point picker treats it as available. |
| `goto-node` | `{ kind, nodeId }` | Engine intercept: replaces `nextNodeId` for the chosen option. | Used inside `onEnter` to redirect a node based on a condition the option couldn't express. |
| `end-dialogue` | `{ kind, reason? }` | `DialogueSystem.exit(reason ?? 'completed')` | Always last in an `effects` array; subsequent effects are skipped with a dev warning. |
| `push-news` | `{ kind, template, params? }` | Headline registry lookup → `worldStore.pushNews(news)` | Templates per [§12.6.6](../GDD.md). The `template` string keys into `src/data/news/templates.json` (added alongside this work). Unknown template → dev warning, no news pushed. |

**Validation rules** (loader-level, F-04 schema validation):

- Every `nextNodeId` references an existing node in the same tree.
- Every `goto-node.nodeId` references an existing node in the same tree.
- `start-quest.questId` and `advance-quest.questId` reference an existing `QuestDefinition` in the data bundle.
- `unlock-dialogue.treeId` references an existing tree (loader runs after all trees are read).
- `push-news.template` references an existing news-template id.
- A node with `autoAdvance` set must not also expose `options`.
- A node with no `options` and no `autoAdvance` must run `end-dialogue` in `onEnter` (otherwise the modal hangs).

**Total: 9 dialogue-specific effect kinds + 9 legacy = 18 effect kinds total dispatched by the dialogue runtime.**

---

## 6. Data Loader Integration

### 6.1 Path & glob

Per [F-04](../../.github/sol-phase4-backlog.md) and [Sol → Vex Q2](../../.github/sol-answers-vex.md):

```
src/data/dialogue/
  audrey-vance/
    calendar-problem.json
    floor-introductions.json
  marcus-elbe/
    first-meeting.json
  ...
```

**One file = one tree.** Filename stem must equal the tree's `id`. Folder name must equal the tree's `npcId`. Loader rejects mismatches.

### 6.2 Loader registration

Per the literal-glob rule documented in [src/engine/dataLoader.ts lines 25-32](../../src/engine/dataLoader.ts) — the pattern **must** be inlined as a string literal:

```ts
const dialogueTreeModules = import.meta.glob(
  '/src/data/dialogue/*/*.json',
  { eager: true, import: 'default' }
);
```

`DataBundle` ([src/engine/GameEngine.ts](../../src/engine/GameEngine.ts)) gains:

```ts
dialogueTrees: ReadonlyArray<DialogueTree>;
newsTemplates: ReadonlyArray<NewsTemplate>;
```

### 6.3 Per-file validation

Same depth as the existing `normalizeArray` pattern in `dataLoader.ts`. Per-tree validation runs:

1. Top-level shape: `$schemaVersion === 1`, `id`, `npcId`, `rootNodeId`, `nodes` present.
2. Folder/filename match `npcId`/`id`.
3. `rootNodeId` exists in `nodes`.
4. For each node: `id` matches the key, `speaker` is a known value, `text` is non-empty (or a non-empty variant array with a fallback), each `options[i].nextNodeId` exists in `nodes`.
5. For each option: `requirements` and `effects` validate against the discriminated unions in §3 and §5.
6. Cross-tree: `unlock-dialogue.treeId` references a known tree (second pass).
7. Cross-system: `start-quest.questId`, `advance-quest.questId` reference loaded quests; `push-news.template` references a loaded news template.

**Failure mode.** A tree that fails validation is **excluded** from `DataBundle.dialogueTrees` and a `log.warn('dialogue tree disabled', { treeId, path, reason })` is emitted. The game continues to boot. This mirrors the existing per-file resilience in `dataLoader` ([§5.4](../GDD.md)). It must never crash boot.

### 6.4 Hot reload

`dataLoader` does not support runtime hot-reload today. A dev-only **"reload trees"** debug command is future work (M3); the action is non-blocking for M2 because Vite HMR re-evaluates the module on JSON edit and re-runs `loadAllData` on the next `GameEngine.registerData` call.

---

## 7. Runtime State Machine

### 7.1 Lifecycle

```
                       enter(treeId, ctx)
                              │
                              ▼
        ┌────────────────► activeNode  ◄────────┐
        │                     │                 │
        │                run onEnter            │
        │                     │                 │
        │                resolveTokens(text)    │
        │                     │                 │
        │           ┌─────────┴─────────┐       │
        │           ▼                   ▼       │
        │     visibleOptions        autoAdvance │
        │           │                   │       │
        │     player chooses            │       │
        │           │                   │       │
        │     check costs               │       │
        │           │                   │       │
        │     run effects               │       │
        │           │                   │       │
        │     goto nextNodeId ──────────┘       │
        └─────────► (loop) ──────────────► exit(progressDiff)
```

### 7.2 Engine invariants

1. **Single active dialogue.** `worldStore.dialogue.inProgress` is `null` or one record. Attempting to `start(treeId)` while a dialogue is in progress is a no-op + dev warning. The renderer never opens two modals.
2. **Calendar is paused** while dialogue is open in M2. `TimeEngine` reads `worldStore.dialogue.inProgress != null` and skips daily ticks. The seam in §10 documents the extension to non-blocking dialogue without changing this default.
3. **Costs are checked before effects run.** If the option's `costs` cannot be paid, the choice is rejected and **no effects fire**. This matches the existing `DialogueSystem.choose` behaviour ([src/systems/DialogueSystem.ts lines 67-84](../../src/systems/DialogueSystem.ts)).
4. **Effects run in authored order.** A `goto-node` or `end-dialogue` short-circuits subsequent effects in the same array; remaining effects are dropped with a dev warning.

### 7.3 Re-entry

`start(treeId)` consults `worldStore.dialogue.completed[treeId]` and the tree's `resumable` flag:

| `resumable` | Has prior progress? | Behaviour |
|---|---|---|
| `true` (default) | Yes, non-terminal `lastNodeId` | Resume at `lastNodeId`. Increment `viewCount`. |
| `true` | Yes, terminal `lastNodeId` | Restart at `rootNodeId`. Increment `viewCount`. |
| `false` | Any | Always restart at `rootNodeId`. |
| Either | No | Start at `rootNodeId`. `viewCount = 1`. |

`completed[treeId]` is recorded on every `end-dialogue` regardless of whether the player aborted — `lastNodeId` reflects the last node the player **rendered**, not necessarily a "good" ending.

### 7.4 Aborting

ESC, modal close, or programmatic `DialogueSystem.abort()`:

- Synthesises an `end-dialogue` effect with `reason: 'aborted'`.
- The `onEnter` of the current node has **already run** (it ran when the node was entered).
- The current option's `effects` do **not** run (the player did not commit).
- Quest hooks can fire on `end-dialogue` via the headline-template registry observing `reason: 'aborted'`.

---

## 8. Save Schema (v2)

### 8.1 Bump

`SAVE_SCHEMA_VERSION` in [src/engine/SaveSystem.ts line 42](../../src/engine/SaveSystem.ts) goes from `1` → `2`.

### 8.2 New persisted shape on `WorldState`

```ts
export interface WorldState {
  // ... existing fields ...
  dialogue: {
    completed: Record<TreeId, {
      lastNodeId: NodeId;
      finishedDay: number;
      viewCount: number;
    }>;
    inProgress?: {
      treeId: TreeId;
      nodeId: NodeId;
      ctxSnapshot: DialogueContextSnapshot; // see §3.5
    } | null;
    npcRelationships: Record<NpcId, {
      score: number;
      lastInteractionDay: number;
    }>;
  };
}
```

`npcRelationships.score` is a **mirror of `worldStore.relationships[npcId]`** with an extra `lastInteractionDay` timestamp the existing `relationships` map cannot carry. The dialogue system writes to both via `update-relationship` effect → `applyEffect('relationship', …)` → and a parallel `lastInteractionDay = world.day` set. Reads continue to use `relationships[npcId]` for vote math and `npcRelationships[npcId]` for dialogue-only "memory".

### 8.3 Migration v1 → v2

Per [F-02](../../.github/sol-phase4-backlog.md), the migrator scaffolding lands alongside this work.

```ts
// in src/engine/saveMigrations.ts
export function migrateV1toV2(payload: SavePayloadV1): SavePayloadV2;
```

Steps:

1. Synthesise an empty `dialogue` object on `payload.stores.world` if absent:
   `{ completed: {}, inProgress: null, npcRelationships: {} }`.
2. Backfill `npcRelationships` from existing `world.relationships`: for each `npcId`, set `score = relationships[npcId]`, `lastInteractionDay = 0` (the pre-v2 saves carry no last-interaction signal).
3. Bump `meta.schemaVersion` to `2`.
4. Validate with the v2 `isValidPayload` guard before returning.

A v1 fixture lands at `src/test/fixtures/saves/v1/empty-world.json` and `src/test/fixtures/saves/v1/with-relationships.json` to lock both branches of step 2.

### 8.4 Round-trip discipline

Per [§13.3](../GDD.md): every field in the v2 `dialogue` object must survive `JSON.stringify` → `JSON.parse` → `applySavePayload` byte-identically. `Map` and `Set` are forbidden as **persisted** shapes; the runtime `ReadonlyMap` in `DialogueContext` is rebuilt from the persisted `Record` on load. The `ctxSnapshot` is the only field that can be partially rebuilt — it carries the minimal subset needed to resume rendering, and the resolver fills the rest from current store state.

---

## 9. UI Surface (M2 v1)

### 9.1 Modal overlay layout

Component family: **`src/renderer/components/Dialogue/`**. Three components only.

```
src/renderer/components/Dialogue/
  DialogueModal.tsx     -- portal + focus trap + frame
  DialogueOption.tsx    -- one row, handles requirement greying + failureHint
  useDialogue.ts        -- hook over useWorldStore.dialogue.inProgress
```

Frame structure:

```
┌────────────────────────────────────────────────────┐
│  AUDREY VANCE  ·  Senate Majority Whip · IL        │  ← speaker header (uppercase, tracked, serif name)
├────────────────────────────────────────────────────┤
│                                                    │
│  "I don't have a problem with your bill, Jordan    │  ← node text (serif), token-resolved
│   Reyes. I have a calendar problem."               │
│                                                    │
├────────────────────────────────────────────────────┤
│  ▸ What would it take to move it up?      [10 PC]  │  ← option, focused (gold ring)
│  ▸ I know where the bodies are.                    │  ← hidden if requirement fails (isHidden)
│    Requires: Connections 4 or higher.              │  ← failureHint, mono, dim
│  ▸ I'll come back when the timing is better.       │
└────────────────────────────────────────────────────┘
                              [ESC] close
```

Styling tokens (per [user style preferences](../../.github/copilot-instructions.md)): sharp corners, serif body + uppercase mono labels, gold focus ring, `game-scroll`, no-select on options, reduced-motion aware (no typewriter effect by default).

### 9.2 Focus & keyboard

- On open: focus trap engages; first **available** (not greyed, not hidden) option receives focus and the gold ring.
- `↑` / `↓`: move focus through available options.
- `Tab` / `Shift+Tab`: same as ↑/↓.
- `Enter` / `Space`: confirm focused option.
- `1`–`9`: confirm the Nth available option.
- `Esc`: abort (§7.4). Confirmation prompt only if the tree has fired any `onEnter` effect that the player hasn't seen the consequence of — design choice deferred to M3, M2 fires abort immediately.

### 9.3 Screen reader

- Modal root: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` → speaker header id.
- Node text region: `aria-live="polite"` so a node change announces the new line.
- Each option: `role="button"`, with `aria-disabled="true"` and the `failureHint` exposed via `aria-describedby` for greyed options.
- The keyboard spec passes Rook's a11y baseline ([§13.4](../GDD.md)). Axe scan asserted in §11 below.

### 9.4 Reduced motion

`prefers-reduced-motion: reduce` (and the `settingsStore.reducedMotion` override) disables:

- Modal open/close transition (instant).
- Any text fade-in.
- The (otherwise default-off) typewriter effect; opt-in setting `settingsStore.dialogueTypewriter = false` until a player explicitly enables it.

### 9.5 Token rendering — text only in v1

`resolveTokens(text, ctx)` returns plain text. The modal renders it inside a single `<p>` node. **No** dangerous HTML, **no** rich markup, **no** glossary anchors in v1. A follow-up M3 task ([§13.3](#133-m3-follow-ups)) introduces `<em>`/`<strong>` and routes tooltip-glossary lookups through the existing tooltip registry ([src/renderer/components/tooltip/glossary.ts](../../src/renderer/components/tooltip/glossary.ts)).

### 9.6 Status & error states

| Condition | Renderer behaviour |
|---|---|
| Tree id unknown | Modal does not open. Dev warning logged. No user-facing error. |
| Tree validation failed at boot | Tree was excluded by the loader (§6.3); never reachable from the modal. |
| `onEnter` effect throws | Caught at the system boundary, dev warning logged, dialogue ends with `reason: 'aborted'`. |
| Token resolution misses | Literal `{token}` rendered, no UI break. |
| Save migration in progress | Modal is closed before migration runs (§8.3); resumed only if `dialogue.inProgress` survives. |

---

## 10. System Boundaries

### 10.1 `DialogueSystem` is pure

`src/systems/DialogueSystem.ts` does not import React, does not touch the DOM, and does not own UI state. It owns:

- **Tree registry** (read-only after `GameEngine.registerData`).
- **Node lookup** (`getNode`).
- **Condition evaluation** (`evaluateCondition`).
- **Option visibility / availability** (`visibleOptions`, `availableOptions`).
- **Effect compilation and dispatch** (`runEffects` → routes to `applyEffect` for legacy kinds, to `handleDialogueEffect` for dialogue-specific kinds).
- **State-machine transitions** (`enter`, `choose`, `abort`, `exit`).

It writes to `worldStore.dialogue.*` via the store's typed setters. It **does not** subscribe to React.

### 10.2 Effect dispatch routing

```
option.effects[]
   │
   ├─► 'type' in e  → applyEffect(e)              (legacy union)
   │
   └─► 'kind' in e  → DialogueSystem.handleDialogueEffect(e)
                          │
                          ├─► set-flag, clear-flag      → worldStore.setFlag
                          ├─► start-quest, advance-quest → QuestSystem
                          ├─► update-relationship       → applyEffect({type:'relationship', …})
                          │                                 + worldStore.dialogue.npcRelationships
                          ├─► unlock-dialogue            → DialogueSystem internal
                          ├─► goto-node, end-dialogue    → DialogueSystem state-machine
                          └─► push-news                  → newsTemplate registry → worldStore.pushNews
```

The dialogue system **does not import** `InfluenceSystem` or `FactionSystem` (the latter does not exist; see §14.4). It calls `applyEffect` and `QuestSystem` only — both stable APIs today.

### 10.3 Renderer ↔ system

`useDialogue` is the **only** renderer-side touchpoint:

```ts
export function useDialogue(): {
  isOpen: boolean;
  speaker: DialogueNode['speaker'];
  speakerHeader: { name: string; voiceTag?: ArchetypeTag; subtitle?: string };
  text: string;                       // tokens already resolved
  options: ReadonlyArray<{
    id: string;
    label: string;                    // tokens already resolved
    isAvailable: boolean;
    isHidden: boolean;
    failureHint?: string;
    cost?: { ap?: number; pc?: number };
  }>;
  choose: (optionId: string) => void;
  abort: () => void;
};
```

Token resolution happens **inside the hook**, not in the system, because the resolver consumes a `DialogueContext` that mixes store state — keeping the system pure means the hook does the impure read once per render.

### 10.4 Speech Composer seam (M3)

The composer ([§12.6](../GDD.md)) will reuse:

- The token resolver (§4) for headline templates.
- The news-template registry (§5.2.2 `push-news`).
- The `DialogueContext` shape (extended with a `speech` namespace).

It will **not** reuse the modal — the composer has its own surface. Decision pre-locked for M2 to avoid retrofitting.

---

## 11. Testing Plan

Per [§13.1](../GDD.md). Targets:

### 11.1 Unit (Vitest)

| Test file | Coverage |
|---|---|
| `src/engine/dialogueTokens.test.ts` | Every namespace; missing-token literal passthrough; `{rng:seeded}` determinism (same `viewIndex` → same string; new `viewIndex` → new draw); `{rng:pick:a\|b\|c}` distribution over 1k seeds; pure-function (no external reads). |
| `src/systems/DialogueSystem.condition.test.ts` | Each of the 12 condition kinds (§5.1); compound `all`/`any`/`not` truth-tables including empty `of` arrays; short-circuit evaluation order. |
| `src/systems/DialogueSystem.effect.test.ts` | Each of the 9 dialogue effect kinds dispatched correctly; legacy effects continue to flow through `applyEffect`; `goto-node` and `end-dialogue` short-circuit subsequent effects with a logged warning. |
| `src/systems/DialogueSystem.lifecycle.test.ts` | `enter`/`choose`/`abort`/`exit`; cost-check rejects without firing effects; `resumable` true/false branches; single-active invariant. |
| `src/engine/saveMigrations.test.ts` | v1 → v2 round-trip on the two fixtures (§8.3); idempotent re-run; rejects malformed v1. |

### 11.2 Component (Vitest + Testing Library)

| Test file | Coverage |
|---|---|
| `src/renderer/components/Dialogue/DialogueModal.test.tsx` | Renders speaker header, node text, options; greyed options show `failureHint`; hidden options don't render; gold focus ring on first available option; ESC aborts. |
| `src/renderer/components/Dialogue/DialogueOption.test.tsx` | `aria-disabled` on greyed; `aria-describedby` wires to the failure hint; cost chip shows when option carries a cost. |

### 11.3 Integration

| Test | Coverage |
|---|---|
| `src/test/dialogue.integration.test.ts` | Loader → tree validation → state-machine traversal scripted: enter `calendar-problem`, choose `push`, expect `worldStore.dialogue.completed['calendar-problem'].lastNodeId === 'exit'`, `relationships['audrey-vance']` delta, news headline pushed. |
| Save round-trip with `inProgress` tree | Open dialogue, advance one node, serialise, reload, modal resumes at the same node with the same `viewIndex`. |

### 11.4 E2E (Playwright)

| Spec | Path |
|---|---|
| Happy path | `tests/e2e/dialogue-happy-path.spec.ts` — open Audrey tree, choose `push`, see news headline in the news panel, dialog closes. |
| Keyboard navigation | `tests/e2e/dialogue-keyboard.spec.ts` — Tab, ↑↓, Enter, ESC; first available option focused on open. |
| A11y | `tests/e2e/dialogue-axe.spec.ts` — axe scan on the open modal returns zero serious violations (per [§13.4](../GDD.md)). |

---

## 12. Determinism Contract Compliance

Per [§13.2](../GDD.md):

1. **All RNG via `SeededRNG`.** `DialogueContext.rng` is the only RNG source visible to the dialogue path. `Math.random()` is forbidden in `src/engine/dialogueTokens.ts`, `src/systems/DialogueSystem.ts`, and `src/store/` writes from dialogue. The existing determinism guard ([src/test/determinism.test.ts lines 138-152](../../src/test/determinism.test.ts)) covers `Math.random`; F-11 extends it to `Date.now`.
2. **No `Date.now()` in dialogue paths.** All "day" values come from `worldStore.time.day` (or `gameStore.currentDate`). The `lastInteractionDay`, `finishedDay`, `startedDay` fields are populated from `world.day`, never `Date.now()`.
3. **Stable evaluation order.** Conditions in an option's `requirements: DialogueCondition[]` evaluate left-to-right by array index. Compound `all`/`any` recurse in array index order. Options render in array order, never sorted by `Object.keys`.
4. **Tree iteration uses array order.** The loader emits `dialogueTrees: ReadonlyArray<DialogueTree>` with deterministic ordering by `(npcId, treeId)` ASCII sort. `nodes` is a `Record` looked up by key — no iteration semantics relied upon.
5. **No `crypto.randomUUID` in simulation.** The `id` field on `news` items pushed by `push-news` derives from `(world.seed, treeId, nodeId, viewIndex)` via the same `hashJoin` helper as §4.4.

---

## 13. Migration / Rollout Plan

### 13.1 What ships in M2

- Types, loader registration, runtime system extension, modal overlay v1, save v2, v1→v2 migrator, eight authored trees (one per [§12.3.4](../GDD.md) NPC seed), and the test plan in §11.

### 13.2 Backout

Feature flag: `flags.dialogueV1Enabled`. Defaults:

| Stream | Default |
|---|---|
| `experimental` (today) | `true` |
| `development` | `true` |
| `alpha` | `false` until the M2 soak period closes |
| `stable` | `false` until promoted by Bridge |

When the flag is `false`, `useDialogue` returns `{ isOpen: false, … }` and `DialogueSystem.start` is a no-op + dev warning. The save schema v2 migration runs **regardless of the flag** — flipping the flag does not require a save migration. This is the seam Rook's stable-promotion gate ([§13.7](../GDD.md)) toggles without rebuilds.

### 13.3 M3 follow-ups

Tracked separately, not in M2 scope:

- Rich text rendering (`<em>`, `<strong>`) and inline glossary anchors via the tooltip registry.
- Speech Composer integration (`speech` namespace on `DialogueContext`).
- Dedicated panel option (alongside the modal — surface-level toggle, no engine change).
- Per-NPC "memory" journal beyond `viewCount` + `lastNodeId`.
- Dev-mode hot-reload of authored trees.
- Node-graph authoring tooling (M5+).

---

## 14. Open Questions (escalate to Bridge / user)

### 14.1 Multi-language plan

i18n scaffolding is roadmapped to M5 ([docs/ROADMAP.md](../ROADMAP.md)). Recommendation: **M2 ships English-only** with `i18nKey` placeholders left out of the dialogue tree shape (the token resolver's ICU-compatibility means M5 can lift strings without a tree-shape break). Bridge to confirm.

### 14.2 Voice settings (font scale, reading speed)

For autoadvance / typewriter (off by default in M2): default reading speed = **200 wpm**; `settingsStore.dialogueReadingSpeedWpm` overrides. Font scale follows the existing `settingsStore.fontScale` token. **Needs Rook ack** that this satisfies the a11y baseline before the M2 promotion gate ([§13.4](../GDD.md), [§13.7](../GDD.md)).

### 14.3 Memory of past choices

Scope **for v1**: `viewCount` + `lastNodeId` per tree (§3.5). Per-option choice history is **not** persisted in v1 — recovering it would require a per-tree event log on the save and is deferred. Vex to confirm the eight authored trees do not require choice-history-aware text variants in M2.

### 14.4 FactionSystem coordination

`FactionSystem` is unbuilt today (per [§4.11](../GDD.md), [Sol §14.1 backlog](../../.github/sol-phase4-backlog.md)). Until it ships:

- Dialogue **reads** faction standing via a thin selector on `worldStore` (today this aggregates legislator-level relationships).
- Dialogue **writes** to factions via `update-relationship` effects — never directly to faction standing. When `FactionSystem` ships, the effect router in §10.2 gains a new branch without changing authored tree shapes.

This decouples the M2 dialogue ship from the `FactionSystem` ship. Bridge to confirm this stays true through the M2 milestone window.

### 14.5 Vex's seven §12.9 questions — addressed in this doc

| §12.9 Q | Answered in |
|---|---|
| 1. `dataLoader` target & registration | §6.1, §6.2 |
| 2. `failureHint` on `DialogueOption` + greyed rendering | §3.2 (type), §9.1 (rendering), F-14 (docs) |
| 3. `autoAdvance` timing contract | §3.2 (now `NodeId`, not `boolean`/`number`); reading-speed setting per §14.2 |
| 4. Token resolution + React-purity | §4 (whole section); resolver pure, hook does the impure read once per render (§10.3) |
| 5. Dialogue progress persistence + schema bump | §8 (whole section) |
| 6. Modal overlay vs dedicated panel | §9 (modal v1); §13.3 (dedicated panel as M3 follow-up) |
| 7. Speech fragments through `dataLoader` or dedicated loader | Out of scope for this doc; tracked under [Sol → Vex Q3](../../.github/sol-answers-vex.md) — recommendation is `dataLoader` per the existing literal-glob pattern (§6.2). |

---

## 15. Cross-references

- **GDD:** §4.10 ([Influence](../GDD.md)), §4.12 ([Dialogue](../GDD.md)), §5 ([Data Model & Persistence](../GDD.md)), §12.3 ([Archetypes](../GDD.md)), §12.4 ([Quest & Story Arc](../GDD.md)), §12.5 ([Authoring Guide](../GDD.md)), §12.6 ([Speech Composer](../GDD.md)), §12.9 ([Phase 5 forward-pointer](../GDD.md)), §13.1–§13.4 ([Test Strategy, Determinism, Save, A11y](../GDD.md)).
- **Roadmap:** [docs/ROADMAP.md](../ROADMAP.md) M2 (Floor Manager) for the ship target; M3 (Stump) for the Speech Composer integration.
- **Sol findings:** F-02, F-04, F-05, F-06, F-08, F-14, F-15, F-16 in [.github/sol-phase4-backlog.md](../../.github/sol-phase4-backlog.md).
- **Vex archetypes:** [§12.3.2](../GDD.md) (12 archetypes), [§12.3.4](../GDD.md) (8 named NPC seeds).
- **Source files cited:**
  - [src/types/dialogue.ts](../../src/types/dialogue.ts) — current minimal shape.
  - [src/types/effect.ts](../../src/types/effect.ts) — legacy 9-kind union.
  - [src/types/common.ts](../../src/types/common.ts) — branded-id pattern.
  - [src/systems/DialogueSystem.ts](../../src/systems/DialogueSystem.ts) — current pure system.
  - [src/engine/dataLoader.ts](../../src/engine/dataLoader.ts) — literal-glob pattern.
  - [src/engine/applyEffect.ts](../../src/engine/applyEffect.ts) — legacy effect dispatch.
  - [src/engine/SaveSystem.ts](../../src/engine/SaveSystem.ts) — schema version + read/write paths.
  - [src/store/worldStore.ts](../../src/store/worldStore.ts) — current `WorldState` shape.
  - [src/test/determinism.test.ts](../../src/test/determinism.test.ts) — existing determinism guard.
  - [src/renderer/components/tooltip/glossary.ts](../../src/renderer/components/tooltip/glossary.ts) — tooltip registry the M3 rich-text follow-up will wire into.

---

## Vex review checklist

Vex, please sign off on (or push back on) each of the following before this design freezes:

1. **Voice fidelity.** Are the example tree's option labels (`"What would it take to move it up?"`, `"I know where the bodies are."`, `"I'll come back when the timing is better."`) compliant with the Voice & Style Guide ([§12.2](../GDD.md)) and the Machine Boss tic ([§12.3.2](../GDD.md))?
2. **Authoring contract.** Does the §2.1 mapping table match what you expect to write? Anything missing from the JSON shape (e.g., per-tree author tags, scene metadata)?
3. **Condition coverage.** Do the **12 condition kinds** in §5.1 cover the arc-pivot moments described in [§12.4.2](../GDD.md) — specifically the "genuinely uncomfortable choice" requirement at the Pivot beat?
4. **Effect coverage.** Do the **9 dialogue + 9 legacy = 18 effect kinds** cover every system write listed in [§12.4.3](../GDD.md)? Is anything you expected to write through dialogue (e.g., ideology drift) missing?
5. **`isHidden` vs `requirements`.** Is the F-14 distinction between "permanently hidden" (`isHidden: true`) and "gated by requirement (with `failureHint`)" workable from an authoring perspective? Should `isHidden` accept a condition rather than a boolean?
6. **Modal vs panel.** Is the modal-overlay-first decision (§9) compatible with the scenes you're authoring for M2? Any scene that would specifically need a non-blocking dialogue?
7. **Token namespaces.** Are the namespaces in §4.2 sufficient? Do you need a `relationship` namespace (e.g., `{relationship.audrey-vance.label}`) before M5?
8. **`text` variants.** Is the `string | DialogueTextVariant[]` shape (§3.2) usable for the conditional acknowledgements [§12.5.6](../GDD.md) describes, or does it need richer composition?
9. **Calendar pause.** Is the M2 default of "calendar paused while dialogue is open" (§7.2) acceptable for the eight authored trees, or do any of them assume time passes during the conversation?
10. **`push-news` template authoring.** The headline templates in [§12.6.6](../GDD.md) are speech-composer-shaped. Do you want a parallel **dialogue** headline-template family (e.g., `audrey-deal-struck` in the example), or should dialogue trees reuse the speech-composer registry?
11. **Voice settings defaults.** §14.2 proposes 200 wpm reading speed and typewriter-off-by-default. Acceptable for M2?
12. **NPC seed coverage.** Does shipping eight authored trees (one per [§12.3.4](../GDD.md) seed) put enough archetype variety in front of the player at M2, or should we author more on a smaller subset of NPCs first?

— *Sol*

---

## Vex Review (2026-05-02)

> Reviewer: **Vex** (narrative). Source docs cross-checked: GDD §12.1–§12.9, sol-answers-vex.md, sol-phase4-backlog.md F-04/F-05/F-15. Token syntax assumption: `{namespace.path}` single-brace per F-05.

---

### Part A — Section verdicts §1–§15

| Section | Verdict | Summary |
|---|---|---|
| §1 Goals & Non-Goals | ✅ | Player fantasy framing matches §12.4.2 arc scaffold precisely. Speech Composer deferral to M3 is correct. The load-bearing Machine Boss line is correctly canonised. |
| §2 Authoring Model | ⚠️ | `speaker` field conflict: §3.2 declares `'player' \| 'npc' \| 'narrator'` but §2.3 example uses `"audrey-vance"` as the speaker value. One is wrong; authors writing to this spec will diverge. Recommend: keep the type union; the worked example should use `"npc"`. Narrator exit node's text ("The conversation ends.") never renders because `onEnter` fires `end-dialogue` before the text is displayed — lifecycle clarification needed. |
| §3 Runtime Type Model | ⚠️ | Same `speaker` conflict as above. The `failureHint?: string` is typed optional but prose says "required when `isHidden !== true` and a requirement may fail" — this should be a loader validation rule, not a type-level constraint (TypeScript cannot express required-if). Document the validation rule clearly. |
| §4 Token Resolution | ⚠️ | Namespaces cover most authoring needs. Two gaps: `{npc.pronoun}` is missing (required by §12.8.3 for gender-neutral NPC authoring), and there is no `relationship.<npcId>.label` token for rendering a human-readable relationship tier. Also: the wiki currently lists `{week.label}` but this spec specifies `{world.weekLabel}` — one must be wrong; sol to confirm the correct path. If token syntax later flips to `{{token}}`, ICU-compatibility is lost and M5 i18n migration cost rises significantly; no authoring content breaks pre-flip since nothing is authored yet. |
| §5 Condition & Effect Kinds | ❌ | **Effect gap (M2 blocker for Ideological Arc trees):** No `ideology drift` effect kind. §12.4.3 lists ideology drift as a first-class narrative-consequence system write; it cannot be authored through dialogue in this spec. The legacy `stat` effect might cover it if `ideology.x`/`ideology.y` are valid `StatName` values — this is undocumented. **Condition gap (follow-up):** No `ideology` condition kind, so content cannot be gated on the player's 2-axis compass position. The 12 existing condition kinds are otherwise sufficient for arc-pivot "uncomfortable choice" beats. |
| §6 Data Loader | ✅ | Path, literal-glob pattern, per-file validation, and cross-tree second pass are all clean. F-04/F-15 wiring is correctly cited. Failure-mode resilience (warn + exclude, never crash boot) matches existing dataLoader pattern. |
| §7 Runtime State Machine | ✅ | Lifecycle, costs-before-effects, abort semantics, and re-entry table all consistent with authoring intent. Single-active invariant is correct for M2 negotiation trees. |
| §8 Save Schema | ✅ | v2 shape is correct. `npcRelationships` mirror seam (score + `lastInteractionDay`) is the right separation of concerns. Migration steps are clear and cover the empty-world case. |
| §9 Modal UI | ⚠️ | Speaker header subtitle (`"Senate Majority Whip · IL"`) is referenced in the ASCII wireframe and the `useDialogue` return type (`speakerHeader.subtitle`), but no field in `DialogueNode` or `DialogueTree` carries role/state metadata. Authors need to know whether this is NPC-data-driven or hard-coded. The modal-first decision is correct for M2 — no M2 tree requires a split-view or non-blocking surface. |
| §10 System Boundaries | ✅ | `DialogueSystem` purity, effect routing diagram, `useDialogue` hook contract, and Speech Composer seam are all solid. The hook-does-the-impure-read pattern (§10.3) is correct. |
| §11 Testing Plan | ⚠️ | Mechanical coverage is thorough. Missing authorial-side lint per §13.1.2 hook: line-length budget validation, `voiceTag` presence on NPC nodes, `failureHint` required-when check, token validity against §4.2 namespace set. These belong in a `dialogue-schema.test.ts` unit test. Without them, voice-bible violations ship silently. |
| §12 Determinism | ✅ | `{rng:seeded}` / `{rng:pick:*}` contract and `hashJoin` seed derivation are correct and determinism-safe. Same `viewIndex` → same string is the right guarantee for React re-renders. |
| §13 Migration / Rollout | ✅ | Feature-flag seam per stream is clean. M3 follow-ups are correctly scoped out. |
| §14 Open Questions | ✅ | §14.3 choice-history deferral correctly escalated — **confirmed: the 8 M2 trees do not require per-option choice history.** §14.4 FactionSystem decoupling (read via thin selector, write via `update-relationship`) is the right call. |
| §15 Cross-references | ✅ | Complete and accurate. |

**Section verdicts: ✅ 9 / ⚠️ 5 / ❌ 1**

---

### §2 Example Tree — Voice Bible Compliance Detail

Machine Boss register per §12.3.2: *indirect, transactional, never says "no" directly.*

| Line | Register check |
|---|---|
| `"I don't have a problem with your bill, {pc.name}. I have a calendar problem."` | ✅ Load-bearing. Redirection not refusal. Canonical. |
| `"Move two of your committee witnesses to make room for mine. Then we'll talk."` | ✅ Transactional, concrete, present-tense imperative. |
| `"Sponsor the harbour amendment. Then we'll talk."` | ✅ Terse, condition-setting. |
| `"Fine. The bill moves. Don't come back here."` | ✅ Post-coercion: clipped, wounded — consistent with the relationship penalty. |
| Player: `"What would it take to move it up?"` | ✅ 8 words, indirect, gate label matches the connections check. |
| Player: `"I know where the bodies are."` | ✅ 7 words, trait-flavoured, meets §12.5.4 label-as-narrative-beat rule. |
| Player: `"I'll come back when the timing is better."` | ✅ 9 words, graceful retreat. |
| Narrator: `"The conversation ends."` | ⚠️ Never renders — `onEnter: [end-dialogue]` fires before the text is displayed. Not a voice problem; a lifecycle clarification issue (see §14 coordination note C4 below). |

---

### §4 Token Namespace — Missing Items

**`{npc.pronoun}` (absent; must be added before era-variant authoring).** GDD §12.8.3 requires `{npc.pronoun}` tokens for gender-neutral NPC dialogue. The `npc` namespace in §4.2 does not include this path. The 8 M2 seeds use named subjects so this does not block M2, but any era-variant line authored to a procedurally-gendered NPC will need pronoun tokens immediately after M2 ships.

**`{world.weekLabel}` vs. `{week.label}`.** The GDD §12.5.5 and the current wiki both use `{week.label}`. This spec uses `{world.weekLabel}`. One is the canonical path; sol to confirm and the wiki will be updated accordingly.

---

### §5 Ideology Coverage — Missing Condition and Effect

**Condition gap.** No `ideology` condition kind. The 2-axis compass position in `DialogueContext.pc.ideology.{x,y}` is exposed as raw numbers but cannot be used to gate dialogue options. Workaround for M2: all ideology-aligned gating must go through trait or flag conditions instead. Not a hard blocker for M2 if the 8 seed trees are drafted to avoid compass gating — but it narrows the design space.

**Effect gap (may block M2).** §12.4.3 lists `applyEffect on ideology.x / ideology.y` as a narrative-consequence system write from dialogue. None of the 18 effect kinds covers this. If the Ideological Enforcer (Jonah Birch) or Reform Idealist (Marcus Elbe) M2 trees include a Pivot beat that shifts player ideology, this is a day-one M2 blocker. Resolution options: (A) add `{ kind: 'ideology-drift', axis: 'x' | 'y', delta: number }` to `DialogueEffect`; (B) confirm that the legacy `stat` effect with `stat: 'ideology.x'` is the intended path. Sol to decide; Vex needs the answer before authoring those two trees.

---

### Part B — Checklist Results

1. **Voice fidelity.** ✅ Machine Boss option labels and NPC lines are voice-bible compliant. Register is precisely calibrated — indirect, transactional, never a direct refusal. The narrator exit text is a lifecycle issue, not a voice problem.

2. **Authoring contract.** ⚠️ §2.1 mapping table is complete. The `speaker` field conflict (type vs. example) must be reconciled before tree authoring begins — authors will follow the example, not the type.

3. **Condition coverage.** ⚠️ The 12 condition kinds cover arc-pivot "uncomfortable choice" requirements for most arcs. The missing `ideology` condition limits Ideological Arc gating. Flag before authoring Birch and Elbe trees.

4. **Effect coverage.** ❌ Ideology drift effect is absent. §12.4.3 lists it as a first-class system write from dialogue. Must be resolved — as a new `DialogueEffect` kind or confirmed via legacy `stat` path — before authoring Ideological Arc trees.

5. **`isHidden` vs `requirements`.** ✅ The boolean `isHidden: true` (always invisible) vs. `requirements`-driven greyed options design is workable. All cases are covered. No need for condition-driven `isHidden` at M2.

6. **Modal vs panel.** ✅ All 8 M2 trees are synchronous negotiation beats. Modal-overlay-first is correct. No M2 scene requires non-blocking dialogue.

7. **Token namespaces.** ⚠️ `{npc.pronoun}` missing; required by §12.8.3. `{relationship.<npcId>.label}` missing but not blocking for M2. Both should be added before M3 authoring begins.

8. **`text` variants.** ✅ The `string | DialogueTextVariant[]` shape with first-match-wins fallback is exactly correct for §12.5.6 conditional acknowledgements.

9. **Calendar pause.** ✅ All 8 M2 trees assume synchronous negotiation. Calendar pause is the correct default. Confirmed: no M2 tree needs concurrent time passage.

10. **`push-news` template authoring.** ⚠️ Unclear whether dialogue trees and the speech composer share one `src/data/news/templates.json` or maintain separate registries. Authors need to know where to add templates like `audrey-deal-struck` before writing any `push-news` effect. Sol to confirm.

11. **Voice settings defaults.** ✅ 200 wpm reading speed and typewriter-off-by-default are both correct. Reduced-motion default alignment is consistent with §12.1 / §9.4.

12. **NPC seed coverage.** ⚠️ Eight trees (one per seed) is the right M2 target. Recommend authoring the three Infrastructure Renewal–adjacent NPCs first (Vance — already done in §2.3, Nguyen — see reference tree, Elbe) before the independent archetypes (Birch, Farrell, Okonkwo, Pryor, Holt). Resourcing note, not a blocking concern.

**Checklist results: ✅ 7 / ⚠️ 4 / ❌ 1 out of 12**

---

### Reference Tree

A complete 5-node reference tree for the **Coalition Broker** archetype (Ray Nguyen) is authored at [docs/design/dialogue-reference-tree.json](dialogue-reference-tree.json). It exercises: `text`-variant array with `faction-standing` condition, `{rng:pick:*}` token, compound `any`-of condition (trait OR `npc-relationship`), `isHidden` option with `costs`, `bill-stage` gate, two convergent branches meeting at `broker-engage`, `update-relationship` + `set-flag` + `advance-quest` + `push-news` effects. This is the canonical authoring example for `docs/wiki/Authoring-Dialogue.md`.

*— Vex*
