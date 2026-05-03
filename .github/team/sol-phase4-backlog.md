# Sol → Jesse: Phase-4 codebase backlog

Owner: **Jesse** (Project #9 curator). Author: **Sol**. Branch: `exp--legislative-overhaul`.
Cross-references: [`.github/seed-issues.md`](seed-issues.md) (existing 50+15 entries — do **not** duplicate).

> **All findings below are incremental.** Items that overlap an existing seed entry are marked `MERGE-INTO:` rather than re-added.

## 1. Summary

| Severity | Count | Notes |
|---|---|---|
| **P0 critical** | 1 | F-01: determinism break inside `LegislationSystem.draftBill` |
| **P1 high** | 8 | F-02 migration ladder, F-03 IPC settings allowlist, F-04 dialogue loader, F-05 token resolver, F-06 SavePayload validation, F-07 Playwright dep missing, F-12 ExtendedTooltip `as any`, F-15 dialogue tree directory scaffold |
| **P2 normal** | 14 | engine stubs, data sparseness, type drift, util hardening |
| **P3 low** | 4 | strictness flags, version drift, lint-staged, doc-only |
| **Total new** | **~27** | plus 8 MERGE-INTO and 3 design-blocked → see §3 |

| Milestone | New items |
|---|---|
| M1 Cloakroom | 3 (F-01, F-06, F-07) |
| M2 Floor Manager | 6 (F-02, F-04, F-05, F-08, F-15, F-16) |
| M3 Stump | 1 (F-17) |
| M4 Ironclad | 4 (F-03, F-09, F-12, F-13) |
| M5 Lectern | 2 (F-18, F-19) |
| M6 Telemetry | 1 (F-20) |
| M7+ | 0 |
| Unscheduled / future-pass | 10 — see appendix |

---

## 2. Findings table

> Format: `F-NN | title | sev | M? | labels | template | evidence | body`. Bodies are paste-ready (4–8 lines, cite GDD §).

### F-01 — Replace `Date.now()` RNG seed inside `LegislationSystem.draftBill`

- **Severity:** **P0** (determinism break, GDD §13.2)
- **Milestone:** M1 Cloakroom (must land in `exp--legislative-overhaul` before promotion)
- **Labels:** `type:bug`, `area:engine`, `system:legislation`, `milestone:m1-cloakroom`, `priority:p0-critical`, `stream:experimental`
- **Template:** `bug.yml`
- **Evidence:** [`src/systems/LegislationSystem.ts` line 206](../src/systems/LegislationSystem.ts#L206) — `new SeededRNG(useWorldStore.getState().seed + Date.now())`. Two replays from the same save will draft different bill ids.
- **Body:**
  > `LegislationSystem.draftBill` seeds its RNG with `Date.now()`, which makes
  > the resulting bill id non-deterministic across two replays of the same
  > save. Per GDD §13.2 ("strict determinism in engine/systems/store") this is
  > a hard violation. Replace with `world.seed + toEpochDays(currentDate) + world.pendingLegislation.length`
  > (the same idiom used by `maybeSpawnNpcBill` at line 254). Add a regression
  > test under `src/systems/LegislationSystem.test.ts` that drafts twice from
  > the same fixture seed and asserts identical bill ids. The existing
  > determinism guard in `src/test/determinism.test.ts` does not catch
  > `Date.now()`, only `Math.random()`; consider extending it (see F-13).
- **De-dup:** new — not covered by `seed-issues.md`.

---

### F-02 — Implement save-schema migration ladder (v1→v2 scaffolding)

- **Severity:** P1
- **Milestone:** M2 Floor Manager (blocks any field-bumping M2 sub-issue)
- **Labels:** `type:feature`, `area:save`, `system:save`, `milestone:m2-floor-manager`, `priority:p1-high`, `stream:experimental`, `breaking-change`
- **Template:** `system.yml`
- **Evidence:** [`src/engine/SaveSystem.ts` lines 165-176, 218-228](../src/engine/SaveSystem.ts#L165) — `isValidPayload` rejects any non-`SAVE_SCHEMA_VERSION` payload; comment at line 165 explicitly defers migration. No migrator function exists.
- **Body:**
  > `SaveSystem.readSave` currently rejects any save not at the current
  > schema version (§13.3.3). M2 introduces v2 (factions, dialogueProgress,
  > quest.startedDay — see `.github/sol-answers-vex.md` Q6). Add a
  > `migrate(payload, fromVersion): SavePayload` function chain so a v1
  > save loads cleanly into v2. Land the v1→v2 migrator alongside the
  > first v2 field bump, with a fixture in `src/test/fixtures/saves/v1/`
  > to lock the upgrade. Without this, the M2 release breaks every
  > existing playtester save.
- **De-dup:** related to M4 seed entry "Build save-fixture corpus", but that's
  M4 and corpus-only. This is the **migrator code** and must land earlier (M2).

---

### F-03 — IPC `pa:settings:set` accepts unrestricted record; add allowlist + type guard

- **Severity:** P1 (security, GDD §13.5)
- **Milestone:** M4 Ironclad
- **Labels:** `type:security`, `area:electron`, `milestone:m4-ironclad`, `priority:p1-high`, `stream:experimental`
- **Template:** `feature.yml`
- **Evidence:** [`src/main/main.ts` lines 159-166](../src/main/main.ts#L159) — `ipcMain.handle('pa:settings:set', (_e, settings: Record<string, unknown>) => …)` only checks `typeof === 'object'`; persists arbitrary keys.
- **Body:**
  > The settings IPC handler accepts any object and writes it to
  > `electron-store` verbatim. A compromised renderer could write keys
  > the main process later trusts (e.g. spoofed paths). Add a key
  > allowlist (`fullscreen`, `numberPrecision`, `tooltipDelay`, …) and
  > per-key type validation. Reject otherwise. Add to the IPC fuzz
  > harness already tracked in seed-issues.
- **De-dup:** **MERGE-INTO** the existing seed entry "IPC handler input validation tests"
  but file as a separate issue because the seed entry is test-only; this one is
  the actual handler hardening.

---

### F-04 — Wire dialogue trees into `dataLoader`

- **Severity:** P1
- **Milestone:** M2 Floor Manager
- **Labels:** `type:feature`, `area:engine`, `area:data`, `system:dialogue`, `milestone:m2-floor-manager`, `priority:p1-high`, `stream:experimental`
- **Template:** `feature.yml`
- **Evidence:** [`src/engine/dataLoader.ts` lines 35-66](../src/engine/dataLoader.ts#L35) — no glob for `src/data/dialogue/`. [`src/engine/GameEngine.ts` lines 37-48](../src/engine/GameEngine.ts#L37) — `DataBundle` has no `dialogueTrees`.
- **Body:**
  > `DialogueSystem` works on a `DialogueTree` argument but nothing in
  > the engine ever loads one. Add `import.meta.glob('/src/data/dialogue/*.json', { eager: true, import: 'default' })`
  > (literal pattern — see comment at dataLoader.ts:25-32) and a
  > `dialogueTrees: DialogueTree[]` field on `DataBundle`. Register
  > with a small dialogue registry in `GameEngine.registerData`. See
  > `.github/sol-answers-vex.md` Q2.
- **De-dup:** **MERGE-INTO** seed M2 "Build DialogueSystem renderer panel + node interpreter" as a sub-issue; the renderer ticket assumes the data is already available.

---

### F-05 — Implement dialogue token resolver (`{playerName}` etc.)

- **Severity:** P1 (Sol-blocked design decision — see Vex Q4)
- **Milestone:** M2 Floor Manager
- **Labels:** `type:feature`, `system:dialogue`, `area:engine`, `milestone:m2-floor-manager`, `priority:p1-high`, `status:needs-design`
- **Template:** `feature.yml`
- **Evidence:** [`src/types/dialogue.ts` lines 14-19](../src/types/dialogue.ts#L14) — `DialogueNode.text: string` is opaque to the runtime. No resolver exists.
- **Body:**
  > Dialogue authoring needs runtime substitution. Recommended syntax
  > (per `.github/sol-answers-vex.md` Q4): single curly braces, ICU-
  > compatible. Initial token set: `{playerName}`, `{characterName}`,
  > `{npcName}`, `{partyShort}`, `{week}`, `{year}`, `{pc}`, `{ap}`.
  > Unknown tokens render as literal and emit `log.warn`. Implement
  > inside `DialogueSystem` as `resolveTokens(text, ctx) → string`.
  > Add unit tests for each token + the unknown-token fallback.
- **De-dup:** new.

---

### F-06 — Validate per-store payload shape inside `applySavePayload`

- **Severity:** P1
- **Milestone:** M1 Cloakroom (cheap, ships with the v1→v2 migrator scaffolding)
- **Labels:** `type:bug`, `area:save`, `system:save`, `milestone:m1-cloakroom`, `priority:p1-high`, `stream:experimental`
- **Template:** `bug.yml`
- **Evidence:** [`src/engine/SaveSystem.ts` lines 264-279](../src/engine/SaveSystem.ts#L264) — casts each store to `object` and calls `setState` without per-field validation. [`src/engine/SaveSystem.ts` lines 165-176](../src/engine/SaveSystem.ts#L165) — `isValidPayload` only checks header.
- **Body:**
  > `applySavePayload` writes whatever `payload.stores.world` contains
  > into the world store. A corrupted v1 save with a valid `meta` but a
  > malformed `world` (e.g. `population` not an array) will load and
  > then crash the renderer at the first read. Add lightweight per-
  > store guards (top-level shape only — same depth as the existing
  > `isValid` in `dataLoader`). Reject with the existing `LoadResult`
  > discriminated union. GDD §13.3.
- **De-dup:** new.

---

### F-07 — Add `@playwright/test` to `devDependencies`

- **Severity:** P1 (CI hygiene; Rook §13.8)
- **Milestone:** M1 Cloakroom
- **Labels:** `type:chore`, `area:ci`, `milestone:m1-cloakroom`, `priority:p1-high`
- **Template:** `chore.yml`
- **Evidence:** [`package.json` lines 28-58](../package.json#L28) — no `@playwright/test` entry. `tests/e2e/` contains 30+ spec files. `playwright.config.ts` exists.
- **Body:**
  > Playwright is invoked by `tests/e2e/*.spec.ts` and `playwright.config.ts`
  > but is not declared in `package.json`. Fresh clones rely on a global
  > install or implicit hoisting. Add `@playwright/test` to
  > `devDependencies` and add `"e2e": "playwright test"` to `scripts`.
  > Required before any CI runner picks the repo up (Phase 6).
- **De-dup:** new — not in seed-issues.

---

### F-08 — Honour `Effect.delayDays` and `Effect.duration`, or remove them from the type

- **Severity:** P2
- **Milestone:** M2 Floor Manager (or earliest convenient; not blocking)
- **Labels:** `type:tech-debt`, `area:engine`, `system:effects`, `milestone:m2-floor-manager`, `priority:p2-normal`
- **Template:** `tech-debt.yml`
- **Evidence:** [`src/engine/applyEffect.ts` lines 13-16](../src/engine/applyEffect.ts#L13). [`src/types/effect.ts` lines 21-23](../src/types/effect.ts#L21) declare both fields.
- **Body:**
  > `Effect.delayDays` and `Effect.duration` are declared but the runtime
  > applies all effects immediately. Authors who set these expect them
  > to mean something. Either implement a scheduled-effects queue on
  > `worldStore` (deterministic, ticked by `TimeEngine.onDaily`) or drop
  > the fields from the type. Decide as part of M2.
- **De-dup:** new.

---

### F-09 — Replace `applyEffect` `grant_card` and `trigger_quest` stubs with real handlers

- **Severity:** P2
- **Milestone:** M4 Ironclad (after card registry lands)
- **Labels:** `type:tech-debt`, `area:engine`, `system:cards`, `system:quests`, `milestone:m4-ironclad`, `priority:p2-normal`
- **Template:** `tech-debt.yml`
- **Evidence:** [`src/engine/applyEffect.ts` lines 81-95](../src/engine/applyEffect.ts#L81-L95).
- **Body:**
  > `grant_card` only pushes a news headline; `trigger_quest` only sets a
  > flag. Both are documented stubs. Replace with calls into
  > `CardSystem.grant(cardId)` and `QuestSystem.start(questId)` so the
  > effect type matches its name. Keep the news/flag side effects as
  > diagnostics. Add unit tests covering both paths.
- **De-dup:** new.

---

### F-10 — `src/utils/id.ts` falls back to `Math.random()` — make `rng` required for engine callers

- **Severity:** P2 (determinism, §13.2)
- **Milestone:** M4 Ironclad
- **Labels:** `type:tech-debt`, `area:engine`, `area:ci`, `milestone:m4-ironclad`, `priority:p2-normal`
- **Template:** `tech-debt.yml`
- **Evidence:** [`src/utils/id.ts` lines 5-9](../src/utils/id.ts#L5).
- **Body:**
  > `makeId(prefix, rng?)` falls back to `Math.random()` when no rng is
  > passed. Engine code that omits `rng` silently desyncs from a save
  > replay. Either split into `makeId(prefix, rng)` (engine, required)
  > and `makeUiId(prefix)` (renderer, allowed) or wrap with an ESLint
  > rule that forbids the optional form inside `src/engine/` and
  > `src/systems/`.
- **De-dup:** new; complementary to seed M4 ESLint-determinism entries.

---

### F-11 — Extend determinism guard to forbid `Date.now()` in engine/systems/store

- **Severity:** P2
- **Milestone:** M4 Ironclad
- **Labels:** `type:chore`, `area:ci`, `milestone:m4-ironclad`, `priority:p2-normal`
- **Template:** `chore.yml`
- **Evidence:** [`src/test/determinism.test.ts` lines 138-152](../src/test/determinism.test.ts#L138) — only scans for `Math.random(`, not `Date.now()`. Per F-01 a real bug slipped through.
- **Body:**
  > Determinism guard scans `Math.random(` only. Extend to `Date.now(`
  > with the same allow-list comment (`// eslint-disable-line determinism/seeded-rng`)
  > so id-only uses (e.g. `applyEffect.ts:85`, `gameStore.ts:129`,
  > `uiStore.ts:15`) remain explicit. Mirrors the seed-issue M4 ESLint
  > rule but in test form so it runs on every PR before lint lands.
- **De-dup:** **MERGE-INTO** seed "ESLint rule: forbid `Date.now()` outside test/dev"; this is the test-shaped twin.

---

### F-12 — Replace `(children as any)` casts inside `ExtendedTooltip`

- **Severity:** P1 (type-safety, surface size)
- **Milestone:** M4 Ironclad
- **Labels:** `type:tech-debt`, `area:renderer`, `milestone:m4-ironclad`, `priority:p1-high`
- **Template:** `tech-debt.yml`
- **Evidence:** [`src/renderer/components/tooltip/ExtendedTooltip.tsx` lines 428-473](../src/renderer/components/tooltip/ExtendedTooltip.tsx#L428) — six `(children as any)` casts on event handler forwarding and ref access.
- **Body:**
  > `ExtendedTooltip` forwards mouse/focus handlers to a child by
  > escaping the type system. Six `as any` casts in 50 lines. Replace
  > with a `cloneElement` pattern that types `children` as
  > `ReactElement<TooltipChildProps>`. Removes the only large `as any`
  > cluster in the renderer.
- **De-dup:** new.

---

### F-13 — Add `Content-Security-Policy` meta tag to `index.html`

- **Severity:** P1 (security, §13.5)
- **Milestone:** M4 Ironclad
- **Labels:** `type:security`, `area:renderer`, `milestone:m4-ironclad`, `priority:p1-high`
- **Template:** `feature.yml`
- **Evidence:** [`index.html` lines 1-32](../index.html#L1) — no `Content-Security-Policy` `<meta>`. Verified via grep.
- **Body:**
  > `index.html` ships without a CSP meta tag. The seed-issue
  > "Add CSP meta tag + electron `session.webRequest` headers" is
  > scoped to all three transports (web/Capacitor/Electron); this
  > finding is the **renderer-side meta tag specifically** so it can
  > land before the Electron headers and Capacitor work catch up.
  > Recommend `default-src 'self'; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'`.
- **De-dup:** **MERGE-INTO** seed M4 "Add CSP meta tag + electron `session.webRequest` headers" as a sub-issue (web meta tag now, Electron + Capacitor headers in parent).

---

### F-14 — Document `DialogueOption.isHidden` vs. `requirements` semantics

- **Severity:** P3
- **Milestone:** M2 Floor Manager
- **Labels:** `type:docs`, `system:dialogue`, `milestone:m2-floor-manager`, `priority:p3-low`
- **Template:** `chore.yml`
- **Evidence:** [`src/systems/DialogueSystem.ts` lines 53-57](../src/systems/DialogueSystem.ts#L53), [`src/types/dialogue.ts` line 11](../src/types/dialogue.ts#L11).
- **Body:**
  > `visibleOptions` filters by `isHidden` and `requirements` separately:
  > `isHidden=true` always hides; `requirements` failure also hides.
  > Authors will conflate the two. Add a JSDoc note on the type and one
  > short paragraph in the wiki Authoring-Dialogue page distinguishing
  > "permanently hidden" from "gated by requirements (with optional
  > `failureHint`)".
- **De-dup:** orthogonal to seed M2 entry "Add `failureHint` field"; this is a docs-only cousin.

---

### F-15 — Scaffold `src/data/dialogue/` directory with one example tree

- **Severity:** P1
- **Milestone:** M2 Floor Manager
- **Labels:** `type:content`, `area:data`, `system:dialogue`, `milestone:m2-floor-manager`, `priority:p1-high`
- **Template:** `content.yml`
- **Evidence:** Directory does not exist. Required by F-04 loader and seed M2 "Wire first authored dialogue sequence to a quest beat".
- **Body:**
  > Create `src/data/dialogue/` with one example `DialogueTree` (e.g.
  > a chief-of-staff intro). File payload === `DialogueTree`. Embed
  > `failureHint` once and an `isHidden` once so the renderer panel
  > exercises both code paths. Schema header `$schemaVersion: 1`.
- **De-dup:** **MERGE-INTO** seed M2 "Wire first authored dialogue sequence to a quest beat"; this is the data-file half.

---

### F-16 — Persist `dialogueProgress` on `worldStore`

- **Severity:** P1
- **Milestone:** M2 Floor Manager
- **Labels:** `type:feature`, `area:store`, `area:save`, `system:dialogue`, `milestone:m2-floor-manager`, `priority:p1-high`, `breaking-change`
- **Template:** `feature.yml`
- **Evidence:** [`src/store/worldStore.ts` lines 45-69](../src/store/worldStore.ts#L45) — no `dialogueProgress` field.
- **Body:**
  > Add `dialogueProgress: Record<string, string>` (treeId → currentNodeId)
  > to `WorldState` and zero-init it in `EMPTY`. Captured in v2 of the
  > save schema (see F-02). Without this, save/load mid-conversation
  > drops the player back at root.
- **De-dup:** **MERGE-INTO** seed M2 "Persist dialogue progress on worldStore (schema bump)"; this is the data-shape half but split out so it can land before the renderer panel.

---

### F-17 — `src/data/quests/` and `src/data/events/` content sparseness — flag, don't fix

- **Severity:** P3
- **Milestone:** M5 Lectern (content pass alongside card flavour)
- **Labels:** `type:content`, `area:data`, `system:quests`, `system:events`, `milestone:m5-lectern`, `priority:p3-low`
- **Template:** `content.yml`
- **Evidence:** `src/data/quests/` contains only `starter-quests.json`. `src/data/events/` contains only `global-events.json`.
- **Body:**
  > Both folders contain a single file. Modders cannot drop a new file
  > in without colliding with the existing one. Split each into
  > thematic subfiles (`quests/onboarding.json`, `quests/personal-life.json`,
  > `events/political-cycle.json`, etc.). No new content needed in
  > this issue — purely a structural split.
- **De-dup:** orthogonal to seed M5 card-flavour content entry.

---

### F-18 — Inline `humaniseId` dictionary should accept overrides from data

- **Severity:** P3
- **Milestone:** M5 Lectern
- **Labels:** `type:tech-debt`, `area:i18n`, `milestone:m5-lectern`, `priority:p3-low`
- **Template:** `tech-debt.yml`
- **Evidence:** [`src/utils/humanize.ts`](../src/utils/humanize.ts) — dictionary is hardcoded.
- **Body:**
  > Mirrors seed-issue "Move humanise dictionary into the locale bundle"
  > but adds the override hook so scenario-specific cohorts (e.g. Cold
  > War "war hawks") can extend the dictionary without editing
  > `humanize.ts`. Should land as part of M5 i18n scaffolding.
- **De-dup:** **MERGE-INTO** seed M5 "Move humanise dictionary into the locale bundle"; treat as a sub-issue.

---

### F-19 — Add `tsconfig.web.json` strictness flags `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`

- **Severity:** P3
- **Milestone:** M5 Lectern
- **Labels:** `type:chore`, `area:ci`, `milestone:m5-lectern`, `priority:p3-low`
- **Template:** `chore.yml`
- **Evidence:** [`tsconfig.web.json` lines 7-15](../tsconfig.web.json#L7) — `strict: true` is set, but neither of the two optional flags. Many `world.relationships[id] ?? 0` patterns assume index safety that the compiler does not currently enforce.
- **Body:**
  > Enable `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`
  > in both `tsconfig.web.json` and `tsconfig.electron.json`. Expect a
  > one-time burst of failures around `worldStore.relationships[id]`,
  > `bills.find(…)?.x`, and option-bag callers. Land in M5 once the
  > content surface stabilises.
- **De-dup:** new.

---

### F-20 — Add `bench`, `lint:fix`, and `e2e:headed` scripts to `package.json`

- **Severity:** P2
- **Milestone:** M6 Telemetry
- **Labels:** `type:chore`, `area:ci`, `milestone:m6-telemetry`, `priority:p2-normal`
- **Template:** `chore.yml`
- **Evidence:** [`package.json` lines 11-26](../package.json#L11) — no `bench`, no `lint:fix`, no `e2e:headed`.
- **Body:**
  > Add three scripts so the M6 perf hard-gate and ergonomic dev work
  > are one command: `"bench": "vitest run bench/"`, `"lint:fix":
  > "eslint --fix \"src/**/*.{ts,tsx}\""`, `"e2e:headed": "playwright
  > test --headed"`. Depends on F-07.
- **De-dup:** **MERGE-INTO** seed M6 `bench/` entry; this is the package-script half.

---

### F-21 — `electron-store` schema declared but not enforced — add JSON schema

- **Severity:** P2 (security depth-in-defense)
- **Milestone:** M4 Ironclad
- **Labels:** `type:security`, `area:electron`, `milestone:m4-ironclad`, `priority:p2-normal`
- **Template:** `feature.yml`
- **Evidence:** [`src/main/main.ts` lines 27-37](../src/main/main.ts#L27) — `Store<StoreSchema>` declared as a TS interface only. `electron-store` accepts a runtime `schema` option that validates writes; not used.
- **Body:**
  > Pass a real JSON schema to `new Store({ schema: … })` so a corrupted
  > store on disk (or a malicious renderer that bypasses the IPC layer)
  > is rejected at the persistence boundary. GDD §13.5 IPC defence-in-
  > depth.
- **De-dup:** new.

---

### F-22 — `applyEffect` lacks an exhaustiveness `default` arm

- **Severity:** P3
- **Milestone:** M2 Floor Manager (cheap, fold into F-08)
- **Labels:** `type:tech-debt`, `area:engine`, `priority:p3-low`
- **Template:** `tech-debt.yml`
- **Evidence:** [`src/engine/applyEffect.ts` lines 19-98](../src/engine/applyEffect.ts#L19) — switch has no `default` clause; a future Effect variant will silently no-op.
- **Body:**
  > Add `default: { const _exhaustive: never = effect; log.warn('unknown effect', _exhaustive); }`
  > so a new variant added to the discriminated union surfaces a TypeScript
  > error at the call site.
- **De-dup:** new.

---

### F-23 — Capacitor config lacks `server.allowNavigation` allowlist

- **Severity:** P2 (security, §13.5)
- **Milestone:** M4 Ironclad
- **Labels:** `type:security`, `area:capacitor`, `milestone:m4-ironclad`, `priority:p2-normal`
- **Template:** `feature.yml`
- **Evidence:** [`capacitor.config.ts` lines 1-17](../capacitor.config.ts#L1) — `server` block sets `androidScheme` only.
- **Body:**
  > Add `server.allowNavigation: []` (empty) so any in-app navigation
  > to a non-bundle URL is denied. `allowMixedContent: false` is
  > already correct. Pair with the CSP work in F-13 / seed M4.
- **De-dup:** **MERGE-INTO** seed M4 CSP entry; sub-issue.

---

### F-24 — `dataLoader` validation only checks required fields are present, not their type

- **Severity:** P2
- **Milestone:** M5 Lectern (alongside i18n schema work)
- **Labels:** `type:tech-debt`, `area:engine`, `area:data`, `milestone:m5-lectern`, `priority:p2-normal`
- **Template:** `tech-debt.yml`
- **Evidence:** [`src/engine/dataLoader.ts` lines 165-172](../src/engine/dataLoader.ts#L165) — `isValid` only checks for `undefined`/`null`.
- **Body:**
  > A scenario with `id: 42` (number, not branded string) passes today.
  > Tighten the validator to accept a per-field type predicate, not just
  > a presence check. Run as part of the i18n/schema pass since both
  > touch the same loader.
- **De-dup:** new.

---

### F-25 — `worldStore.dismissEvent` and friends are not persisted-clean — verify on save round-trip

- **Severity:** P3
- **Milestone:** M4 Ironclad (folds into the save-fixture corpus seed entry)
- **Labels:** `type:tech-debt`, `area:save`, `priority:p3-low`
- **Template:** `tech-debt.yml`
- **Evidence:** [`src/store/worldStore.ts` lines 109-180](../src/store/worldStore.ts#L109) — actions mutate via `immer`; persisted shape is unverified.
- **Body:**
  > After F-06 lands, add a save round-trip test that fires every
  > worldStore action, saves, loads, and asserts state equality. Folds
  > into the seed M4 fixture corpus.
- **De-dup:** **MERGE-INTO** seed M4 fixture corpus entry.

---

### F-26 — Audit `(window as any)` in tests vs production

- **Severity:** P3
- **Milestone:** Unscheduled
- **Labels:** `type:tech-debt`, `area:test`, `priority:p3-low`
- **Template:** `tech-debt.yml`
- **Evidence:** [`src/test/setup.ts` lines 32, 53](../src/test/setup.ts#L32), [`src/engine/SaveSystem.test.ts` line 32](../src/engine/SaveSystem.test.ts#L32) — three `(window as any).politicalAscent` casts in test code.
- **Body:**
  > Test-only casts; safe but worth replacing with a typed
  > `declare global` augmentation so the bridge surface is enforced
  > everywhere it is referenced.
- **De-dup:** new.

---

### F-27 — `BillTemplate.stageDurations` override path lacks a unit test

- **Severity:** P3
- **Milestone:** M1 Cloakroom (folds with seed VotingSystem extraction)
- **Labels:** `type:tech-debt`, `area:engine`, `system:legislation`, `milestone:m1-cloakroom`, `priority:p3-low`
- **Template:** `tech-debt.yml`
- **Evidence:** [`src/systems/LegislationSystem.ts` lines 145-150](../src/systems/LegislationSystem.ts#L145) — `durationFor` reads `template.stageDurations` but no test exercises an override.
- **Body:**
  > Add one test under `LegislationSystem.test.ts` that drafts a bill
  > from a template carrying `stageDurations: { committee: 1 }` and
  > asserts `stageEndsOnDay = day + 1`. Locks the only mod-author-
  > facing override path on `BillTemplate`.
- **De-dup:** **MERGE-INTO** seed M1 VotingSystem extraction (same file area).

---

## 3. Design-blocked findings (need a Sol decision before issue creation)

| Id | Topic | Decision needed |
|---|---|---|
| F-05 | Dialogue token syntax | Curly-brace single (recommended) vs Mustache. Bridge can pick during Phase 5. |
| F-08 | `delayDays`/`duration` | Implement scheduler vs remove from type. M2 scope call. |
| F-17 | Quest/event file split | One-file vs themed split — content-team preference. Trivial mechanically. |

---

## 4. De-duplication audit against `seed-issues.md`

| New finding | Seed-issue overlap | Resolution |
|---|---|---|
| F-03 | "IPC handler input validation tests" (M4) | File F-03 separately — it's the **handler** hardening, not the test |
| F-04 | "Build DialogueSystem renderer panel + node interpreter" (M2) | Sub-issue under that parent |
| F-11 | "ESLint rule: forbid `Date.now()` outside test/dev" (M4) | Sub-issue (test-time twin of the lint rule) |
| F-13 | "Add CSP meta tag + electron `session.webRequest` headers" (M4) | Sub-issue (renderer meta tag specifically) |
| F-15 | "Wire first authored dialogue sequence to a quest beat" (M2) | Sub-issue (data-file half) |
| F-16 | "Persist dialogue progress on worldStore (schema bump)" (M2) | Sub-issue (data-shape half) |
| F-18 | "Move humanise dictionary into the locale bundle" (M5) | Sub-issue |
| F-20 | "Create `bench/` with §13.6.3 fixtures" (M6) | Sub-issue (package scripts) |
| F-23 | "Add CSP meta tag + electron `session.webRequest` headers" (M4) | Sub-issue (Capacitor side) |
| F-25 | "Build save-fixture corpus" (M4) | Sub-issue (action round-trip variant) |
| F-27 | "Extract VotingSystem from LegislationSystem" (M1) | Co-located unit test work |

---

## 5. Determinism / security findings (raised aggressively per §13.2 / §13.5)

> Filed at P0/P1 regardless of milestone. Sol owns; Jesse files.

- **F-01 (P0)** — `Date.now()` seeding `SeededRNG` in `LegislationSystem.draftBill`.
- **F-03 (P1)** — IPC `pa:settings:set` allowlist missing.
- **F-06 (P1)** — `applySavePayload` writes unvalidated store payloads.
- **F-12 (P1)** — six `as any` casts in `ExtendedTooltip` event forwarding.
- **F-13 (P1)** — no CSP meta tag on `index.html`.
- **F-21 (P2)** — `electron-store` runtime schema not enforced.
- **F-23 (P2)** — Capacitor `server.allowNavigation` not set.

---

## 6. Recommended order of execution (current branch + next)

**`exp--legislative-overhaul` (this branch, M1 scope) — must land before promotion:**
1. F-01 (P0 determinism break — same file as the in-progress legislative work).
2. F-06 (cheap save validation, blocks F-02 confidently).
3. F-07 (Playwright dep — Phase 6 CI cannot bootstrap without it).
4. F-27 (one new test, fits the VotingSystem extraction pass).

**Defer to a fresh `exp--m2-floor-manager` branch:** F-02, F-04, F-05, F-08, F-14, F-15, F-16, F-22.

**Phase-6 CI / M4 work:** F-03, F-09, F-10, F-11, F-12, F-13, F-21, F-23, F-25.

**M5 polish:** F-18, F-19, F-24.

**M6 perf:** F-20.

**Unscheduled:** F-17, F-26 (and the future-pass appendix below).

---

## Appendix — future-pass items (not filed in this round; capture if scope grows)

> 10 items observed but intentionally **not** filed to keep the primary list at ~30. Sol will revisit before the M5 → M6 transition.

1. `CharacterSystem` traits hardcoded in TS — already in seed M5; this pass found no new aspect.
2. `EconomySystem` lacks history pruning at the engine layer (only the store caps at 260 entries).
3. `CongressSystem` filter logic in `CongressPanel.tsx` is not exported as a pure utility — moves to `src/utils/` would unlock unit tests.
4. `AchievementEngine` does not emit an event when an achievement unlocks; renderer polls.
5. `cardPackEngine` rarity-curve constants hardcoded; could move to data.
6. `EventEngine` cooldown stamping uses `week` only — irregular if a save crosses a year boundary mid-cooldown.
7. `SkillSystem` exports a registry but no save-round-trip test.
8. `PopulationSystem` weekly tick re-iterates all groups — fine at 10 groups, watch at 30+ (already unscheduled in seed-issues).
9. `ContextMenu` has no `aria-activedescendant` for keyboard nav.
10. `ToastRoot` toast removal animation uses CSS only — no `prefers-reduced-motion` opt-out.

---

## Counts

- **27 new findings** (F-01 through F-27).
- **11 MERGE-INTO** notes against existing seed entries.
- **3 design-blocked** (F-05, F-08, F-17).
- **1 P0**, **8 P1**, **14 P2**, **4 P3**.
- **10 future-pass** items in the appendix (not filed).
