# Dialogue System — Vex Open Questions & Sol Coordination Notes

> Author: **Vex** (narrative). Date: 2026-05-02.
> Source: Review of [docs/design/dialogue-system.md](dialogue-system.md) against GDD §12, sol-answers-vex.md, sol-phase4-backlog.md.
> Companion: Vex Review appendix at the end of the spec.

---

## Part E — Open Questions

### OQ-1 — `speaker` field: type union vs. worked example

**Question.** The runtime type declares `speaker: 'player' | 'npc' | 'narrator'` (§3.2) but the §2.3 worked example uses `"audrey-vance"` as the `speaker` value for NPC nodes. Which is authoritative?

**Why it matters.** Authors write to the example, not the type file. If the example is wrong, every M2 tree will be authored incorrectly and will either fail loader validation or require a mass find-and-replace.

**Recommendation.** Keep the type union (`'player' | 'npc' | 'narrator'`). The NPC identity is already carried by the tree's `npcId`. Update the §2.3 example to use `"speaker": "npc"`. The reference tree in `docs/design/dialogue-reference-tree.json` follows the type definition.

**Blocks M2 authoring?** Yes — must be resolved before the 8 seed trees are authored.

---

### OQ-2 — Ideology drift effect

**Question.** GDD §12.4.3 lists ideology drift (`applyEffect on ideology.x / ideology.y`) as a dialogue-triggered system write. None of the 18 effect kinds (§5.2) covers this. Is the intended path: (A) a new `{ kind: 'ideology-drift', axis: 'x' | 'y', delta: number }` dialogue effect, or (B) routing through the legacy `stat` effect with `stat: 'ideology.x'` / `stat: 'ideology.y'` (if those strings are valid `StatName` values)?

**Why it matters.** Any Ideological Enforcer or Reform Idealist arc beat that shifts the player's ideology compass position — a natural Pivot beat — cannot be authored until this is resolved. The Jonah Birch and Marcus Elbe M2 trees may depend on it.

**Recommendation.** Add `{ kind: 'ideology-drift', axis: 'x' | 'y', delta: number }` as a new `DialogueEffect` kind with a dedicated handler in `DialogueSystem.handleDialogueEffect`. This is cleaner than routing through `stat` and makes the effect self-documenting.

**Blocks M2 authoring?** Yes, for Birch and Elbe trees if they include ideology-shifting Pivot beats. Defer those two trees until resolved; author the other six first.

---

### OQ-3 — Ideology condition kind

**Question.** There is no `ideology` condition kind among the 12 in §5.1. Content cannot be gated on the player's 2-axis compass position. The suggested workaround is trait or flag conditions, which requires pre-setting flags based on ideology at game start or via event effects.

**Why it matters.** §12.3.3 says player content should escalate in line with archetype affinity as skill branches grow. Ideology is a primary affinity signal. Without a gate, Reform Idealist options cannot be unlocked by ideology position — only by trait or stat.

**Recommendation.** Add `{ kind: 'ideology', axis: 'x' | 'y', op: ComparisonOp, value: number }` to `DialogueCondition`. Low implementation cost (reads `ctx.pc.ideology.x` or `ctx.pc.ideology.y`). `ComparisonOp` is already defined.

**Blocks M2 authoring?** No — workarounds exist for the 8 seed trees. Follow-up, but should land in M2 if the Birch/Elbe trees need it.

---

### OQ-4 — `{npc.pronoun}` token

**Question.** GDD §12.8.3 requires `{npc.pronoun}` tokens for gender-neutral NPC dialogue. This path is absent from the §4.2 namespace table. NPC pronoun is a procedurally-set field on the NPC data shape.

**Why it matters.** Without this token, any authored line that references an NPC by pronoun must use a name or title instead ("Senator Nguyen" rather than "they"). This works in M2 where all 8 seed NPCs are named characters, but limits pattern library content and any procedurally-generated NPC dialogue.

**Recommendation.** Add `npc.pronoun` (resolves to `'they' | 'she' | 'he'` from NPC data) to the `npc` namespace. Do not use gendered pronouns in authored dialogue until this is confirmed.

**Blocks M2 authoring?** No — the 8 named seed NPCs can be authored with names/titles. Follow-up before M3 authoring.

---

### OQ-5 — `autoAdvance` timing and `onEnter` execution order

**Question.** The §7.1 lifecycle diagram shows: `enter → run onEnter → resolveTokens(text) → display`. If `onEnter` fires `end-dialogue`, does the node's `text` field ever display to the player?

**Why it matters.** The §2.3 example uses a narrator `exit` node with both `text: "The conversation ends."` and `onEnter: [{ kind: 'end-dialogue' }]`. If `onEnter` precedes render, that text is never seen — the example is misleading. Authors writing closing flavour lines will put them on the exit node and wonder why they don't appear. The reference tree at `docs/design/dialogue-reference-tree.json` uses `autoAdvance: "exit"` on a prior node to ensure the exit line displays before `end-dialogue` fires — but this pattern is only correct if `onEnter` runs before render.

**Recommendation.** Clarify the lifecycle in §7.1: explicitly state whether `onEnter` effects run before or after the node text renders. If before, document the `autoAdvance` pattern as the only correct way to show a closing line. Add a note to the authoring guide.

**Blocks M2 authoring?** Yes, partially — authors need to know the correct exit-node pattern before writing trees with closing NPC lines.

---

### OQ-6 — News template registry: unified or split?

**Question.** §5.2.2 says `push-news` templates key into `src/data/news/templates.json`. §12.6.6 documents speech-composer headline templates. Are these in the same file, or does the dialogue system maintain a separate registry?

**Why it matters.** Before authoring any `push-news` effect in a dialogue tree, authors need to know where to add the template entry and whether there is a naming convention that avoids collisions with speech-composer templates (e.g., `audrey-deal-struck` vs. `speech-high-effectiveness`).

**Recommendation.** Single unified `src/data/news/templates.json`. Recommend namespacing template ids by source type: `dialogue.<tree-id>.<result>` (e.g., `dialogue.calendar-problem.deal-struck`) and `speech.<outcome-band>` (e.g., `speech.high-effectiveness`). Sol to confirm the file is unified and add the id convention to the spec.

**Blocks M2 authoring?** Yes — authors cannot write `push-news` effects without knowing the registry path and template id format.

---

### OQ-7 — Per-option choice history (confirmed non-blocking)

**Question.** §14.3 asks Vex to confirm the 8 M2 trees do not require choice-history-aware text variants.

**Answer.** ✅ **Confirmed.** The 8 M2 trees are single-visit or resumable negotiation beats. None requires per-option choice recall in `text` variants. The `viewCount` + `lastNodeId` persistence in §8.2 is sufficient. This is a non-blocking follow-up.

**Blocks M2 authoring?** No.

---

### OQ-8 — NPC speaker header subtitle source

**Question.** The §9.1 wireframe shows `"AUDREY VANCE · Senate Majority Whip · IL"` in the speaker header, and `useDialogue` returns `speakerHeader.subtitle`. No field in `DialogueNode` or `DialogueTree` carries role or state metadata. Where does this subtitle come from?

**Why it matters.** If it comes from an NPC data file (e.g., `src/data/scenarios/modern-america-2024/legislators.json`), authors do not need to set it per-tree. If it is author-controlled, there must be a field for it on the tree or node.

**Recommendation.** Source the subtitle from the NPC's scenario data (role + state abbreviation). Authors should not need to set this per-tree — it should resolve automatically from `npcId` → NPC record.

**Blocks M2 authoring?** No — it doesn't affect JSON authoring, only renderer implementation.

---

**Open questions count: 8 (2 block M2 authoring: OQ-1, OQ-5; 1 may block specific trees: OQ-2; 1 blocks push-news authoring: OQ-6)**

---

## Part F — Coordination Notes for Sol

These are small spec gaps noticed during authoring review. None requires a design decision from Bridge — they are clarifications or small additions Sol should incorporate.

**C1 — Reconcile `speaker` field type vs. example.**
The `DialogueNode.speaker` type is `'player' | 'npc' | 'narrator'` but §2.3 uses `"audrey-vance"`. Update the §2.3 worked example to use `"speaker": "npc"` and add a one-line note: "The NPC identity is always the tree's `npcId`; `speaker: 'npc'` is the discriminator for layout, not identity." Needed before authors begin writing trees.

**C2 — Add `{npc.pronoun}` to the §4.2 namespace table.**
Path: `npc.pronoun` → resolves from the NPC's `pronoun` field in scenario data (`'they' | 'she' | 'he'`). Required by §12.8.3. Low implementation cost. Should be in the namespace table before M3 authoring.

**C3 — Confirm `{world.weekLabel}` vs. `{week.label}`.**
GDD §12.5.5 and the wiki (pre-update) both used `{week.label}`. This spec uses `{world.weekLabel}`. Confirm which is the canonical path in `DialogueContext.world` and ensure the spec, wiki, and GDD are consistent. The wiki has been updated to `{world.weekLabel}` — please confirm this is correct.

**C4 — Clarify `onEnter` execution timing relative to text render.**
The §7.1 lifecycle diagram shows `onEnter` runs before `resolveTokens(text)`. This means a node with `onEnter: [end-dialogue]` closes the modal before the text displays. Document this explicitly in §7.1. Add an authoring note: "To display a closing line before the dialogue ends, use `autoAdvance` to an exit node rather than putting `end-dialogue` in the closing line's `onEnter`." The reference tree in `docs/design/dialogue-reference-tree.json` uses the correct `autoAdvance` pattern on `exit-cold`.

**C5 — Undefined token resolution for `{npc.faction.name}` when NPC has no faction.**
The spec says unknown *namespace or path* renders as literal `{token}`. But `{npc.faction.name}` resolves a known path on a known namespace that may be legitimately `undefined` (NPC has no faction). This should default to empty string, not `{npc.faction.name}`. Document the distinction in §4.3: "A token whose path resolves to `undefined` for a valid namespace renders as empty string. A token with an unknown namespace renders as the literal `{token}` with a dev warning."

**C6 — Legacy `relationship` effect `value` field: absolute or delta?**
The §2.3 example uses `{ "type": "relationship", "npcId": "audrey-vance", "value": -8 }` (legacy effect) alongside `{ "kind": "update-relationship", "npcId": "audrey-vance", "delta": 6 }` (dialogue effect) in the same tree. The dialogue effect uses `delta` (clearly relative). The legacy effect uses `value` — is this an absolute score set or a relative delta? Authors writing hybrid trees need to know. Document the legacy field semantics in §5.2.1 or the F-05 token-resolver spec.

**C7 — Confirm news template registry is unified and add id naming convention.**
Authors need to know: (a) `src/data/news/templates.json` is the single registry for both dialogue `push-news` effects and speech-composer `push-news` effects; (b) the id naming convention to avoid collisions. Recommend: `dialogue.<tree-id>.<outcome>` and `speech.<band>`. Without this, authors cannot write `push-news` effects.

**C8 — Add `dialogue-schema.test.ts` unit test per §13.1.2.**
The §11 test plan covers mechanical correctness but not authorial-side lint. A `dialogue-schema.test.ts` unit test should validate: NPC nodes have `voiceTag`; NPC line word count ≤ 30; player option label word count ≤ 18; `failureHint` present when `requirements` is non-empty and `isHidden` is not `true`; all tokens in `text` fields match the §4.2 namespace set. This is the schema-lint hook mentioned in §13.1.2 and catches voice-bible violations at CI time rather than in review.

**C9 — `autoAdvance` as `NodeId` string, not `boolean`.**
GDD §12.5.2 still shows `autoAdvance: false` (boolean) in the old node shape. The spec correctly upgrades this to `autoAdvance?: NodeId`. Ensure the GDD §12.5.2 example is updated in the next narrative pass so the two specs don't diverge.

**C10 — `broker-engage` convergence pattern in the reference tree.**
The reference tree (`docs/design/dialogue-reference-tree.json`) has three distinct option paths in `scan` that all converge at `broker-engage`. The loader's cross-tree validation does not validate within-tree convergence, which is correct — but authoring guidance should note that multiple options can share a `nextNodeId` and the node's `onEnter` will run once per visit regardless of which path was taken. If `broker-engage` had `onEnter` effects (it doesn't in the reference tree), they would fire on every entry — authors should be aware of this.

**Coordination notes count: 10**

---

## Overall Verdict

**Needs Sol revision before M2 tree authoring begins.** The spec is structurally sound and ready for implementation. Two issues must be resolved before authors write the 8 seed trees: the `speaker` field ambiguity (OQ-1/C1) and the `onEnter` timing clarification (OQ-5/C4). The ideology drift effect gap (OQ-2) may block specific trees (Birch, Elbe) and should be resolved in parallel. The news template registry (OQ-6/C7) must be confirmed before any `push-news` effect is authored. Once those four items are addressed, M2 tree authoring can proceed.

*— Vex*
