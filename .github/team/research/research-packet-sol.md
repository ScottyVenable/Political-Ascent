# Research Packet — Sol: Co-Creative Director & Lead Programmer

**Destination:** `.github/team/research/` (team resource, no promotion needed)
**Intended audience:** Sol

---

## Purpose

Equips Sol with the specific engineering patterns, architectural references, and cross-cutting concerns needed to implement Political Ascent's simulation stack cleanly and sustainably across Electron, web, and Android targets.

---

## Role Summary

Sol owns implementation quality and technical direction. He writes and refactors application code (`src/`), maintains engineering standards, handles CI/workflow updates, and is the final integration point for specs from Lux (UI), Nova (systems), and Vex (content). All code from other agents routes through Sol for merging.

---

## Key Concepts & Domain Knowledge

- **Deterministic simulation design** — Political Ascent's systems must behave identically on replays and across platforms. Avoid `Math.random()` without a seeded PRNG; any non-deterministic path must be quarantined behind clearly marked I/O boundaries.
- **Zustand store topology** — With 10+ systems (Legislation, Congress, Economy, etc.) sharing state, store slice isolation and selector memoization directly affect render frequency. Understand the difference between slice-per-system vs. normalized entity stores.
- **Vite + Electron + Capacitor build pipeline** — Three separate build targets (web, Electron main/preload, Android WebView). Know which modules are browser-only vs. Node-only; the `tsconfig.electron.json` / `tsconfig.web.json` split must be respected.
- **TypeScript strict mode discipline** — Strict null checks and `noImplicitAny` prevent entire classes of save-corruption bugs. Runtime type assertions at data-load boundaries (JSON → typed game state) are essential.
- **Tick-based time engine patterns** — `TimeEngine` fans out daily/weekly/monthly/annual hooks. Adding a new system requires registering tick handlers correctly; missed or double-registered hooks produce subtle drift bugs.
- **Immutable effect application** — `applyEffect.ts` is pure; all system mutations flow through it. Understanding this boundary is critical before touching any system that emits effects.
- **Save/load compatibility** — Schema changes to persisted state require migration helpers. The `SaveSystem` must version every save; breaking changes without migration paths corrupt player saves.
- **Cross-platform IPC (Electron)** — `preload.mjs` defines the contextBridge surface. Exposing arbitrary Node APIs to the renderer is a security violation. Validate all IPC messages.
- **Playwright e2e integration** — Tests in `tests/e2e/` use Playwright against the live renderer. Sol's builds must boot in test mode; headless compatibility is a hard gate.
- **Performance budgets in simulation** — Weekly ticks process population, economy, congress, influence simultaneously. Profile tick duration; keep frame-blocking synchronous computation under 16 ms.

---

## Reference Games / Comparable Projects

| Title | What Sol should study |
|---|---|
| **Crusader Kings III** (Paradox) | How Paradox structures scripted triggers and effects — a declarative effect model that maps cleanly to Political Ascent's `applyEffect` pattern. |
| **Victoria 3** (Paradox) | POP-system tick performance at scale; how simulation updates are batched and deferred to avoid frame drops. |
| **Democracy 4** (Positech) | A web/desktop hybrid built on a simple graph-of-effects model — architecturally closest to Political Ascent's influence propagation. Small team, shipped. |
| **Electron Fiddle / Electron Forge** | Reference implementations for secure Electron IPC, auto-update patterns, and platform-specific packaging. |
| **Zustand docs / pmndrs patterns** | Middleware (devtools, persist, immer) integration patterns; best practices for large stores. |

---

## Best Practices for This Project

1. **Branch-per-feature, never directly to `development`.** Feature branches (`feat/sol-*`, `fix/sol-*`) must pass `typecheck + lint + build` before PR. The pipeline is the release gate.
2. **Register system tick handlers in `GameEngine`, not inline.** Systems that self-schedule break the tick fan-out contract and are difficult to test deterministically.
3. **Separate content data from logic.** `src/data/` files are Vex's domain. Sol's job is to validate them at load time (`dataLoader.ts`) and reject invalid shapes loudly, not silently coerce them.
4. **Never add `any` casts to bridge Nova's spec tables.** If a system spec from Nova requires a new type, define it in `src/types/` and PR the addition explicitly — this keeps the type graph honest.
5. **Always update `docs/about/CHANGELOG.md`** for any user-visible behavior change, in the same PR as the code change.

---

## Useful Patterns & Anti-Patterns

| Do | Avoid |
|---|---|
| Seed PRNG with scenario ID for deterministic events | `Math.random()` in event resolution |
| Validate all JSON at `dataLoader` boundary with a Zod or manual guard | Silent coercion of malformed data |
| Use `immer` or spread patterns to produce new state slices | Direct mutation of Zustand state outside store actions |
| Gate Android-only APIs behind `Capacitor.isNativePlatform()` | Assuming `window.electron` exists in Capacitor context |
| Write tick handlers as pure functions taking state, returning deltas | Handlers that call `store.setState` directly mid-tick |
| Profile weekly tick in browser DevTools before merging large system changes | Shipping tick changes without performance baseline |

---

## Quick Reference Links (Internal)

- [Sol's agent file](../../agents/Sol.agent.md)
- [TEAM.md](../../TEAM.md)
- [GDD §4 — Game Systems](../../../docs/GDD.md) (system inventory, tick cadences, implementation status)
- [GDD §6 — Architecture Overview](../../../docs/GDD.md)
- [GDD §7 — Tech Stack & Toolchain](../../../docs/GDD.md)
- [GDD §11 — Performance Targets](../../../docs/GDD.md)
- [GDD §13 — QA / Release Readiness](../../../docs/GDD.md)
- [ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)
- [ROADMAP.md](../../../docs/ROADMAP.md) (milestone map, release stream model)
- [docs/research/game-feel-foundation-2026-04.md](../../../docs/research/game-feel-foundation-2026-04.md) (token system, shell restructure)
- [docs/research/political-simulation-fidelity.md](../../../docs/research/political-simulation-fidelity.md) (abstraction principles)

---

## Handoffs Cheatsheet

| Agent | What Sol gives | What Sol receives |
|---|---|---|
| **Vex** | Schema / interface change notes when `src/data/` shapes evolve | Content needing schema validation; authoring questions about data ranges |
| **Rook** | Code ready for QA; reproduction environment; build artifacts | Repro steps + diagnostics; pass/fail verdicts; regression reports |
| **Lux** | Implemented surfaces for visual review (links to live renderer panels) | Finalized UI/UX specs, asset briefs, design tokens, style-guide diffs |
| **Nova** | Implementation feedback on system specs (feasibility, perf, type constraints) | Finalized system specs, formulas, data tables, balancing parameters |
| **Jesse** | Tracking issue updates; PR links; changelog entries | Issue assignments; board field updates; release-gate checklists |
| **Bridge** | N/A (Sol is a leaf node — receives routed tasks) | Task descriptions + context from Bridge |
| **Robert** | Research questions (competitor patterns, technical references) | Structured research findings with citations |

---

*Researched by Robert — 2026-05-03*
