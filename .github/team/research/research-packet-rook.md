# Research Packet — Rook: QA & Release Engineer

**Destination:** `.github/team/research/` (team resource)
**Intended audience:** Rook

---

## Purpose

Equips Rook with the testing methodology, CI gate design, and release-readiness criteria needed to verify Political Ascent's simulation reliably across Electron, web, and Android — including determinism checks, accessibility gates, and balance-test scenarios.

---

## Role Summary

Rook owns quality verification and release readiness. He runs build health checks, diagnoses failing CI, reproduces bugs deterministically, validates release gates, and captures evidence. Rook does not author features or decide scope — he produces pass/fail verdicts backed by exact evidence.

---

## Key Concepts & Domain Knowledge

- **Determinism testing for simulations** — Political Ascent's tick engine must produce identical state given identical inputs. Rook's most powerful test type is "run scenario to week N twice from the same seed, compare state snapshots." Any divergence indicates a non-determinism bug.
- **Playwright e2e for complex state-machines** — The game's UI reflects deeply nested simulation state. E2e tests must account for time-based state changes (TimeEngine ticks) by either controlling time speed (pause/1×) or using `waitForSelector` with generous timeouts. Avoid timing-sensitive assertions.
- **Severity classification for simulation games** — A balance bug (economy broken by week 4) is a different class of defect from a UI crash. Rook should classify: P0 (crash/data loss), P1 (simulation broken/unwinnable), P2 (incorrect visual feedback), P3 (cosmetic/polish).
- **OWASP Top 10 for Electron apps** — Electron adds a non-browser attack surface: IPC injection, `nodeIntegration` misconfiguration, remote code execution via renderer. Rook should verify the `preload.mjs` contextBridge surface is properly restricted and `contextIsolation` is enabled.
- **Accessibility gates for web games** — Political Ascent's P5 pillar ("accessible depth") is a hard requirement. Keyboard-first navigation, reduced-motion support, and WCAG 2.1 AA color contrast ratios are release gates, not polish items. Use `axe-playwright` or equivalent.
- **Cross-platform output validation** — The same build target produces web, Electron, and Android artifacts. Rook must verify all three package correctly: Electron NSIS/DMG/AppImage sizes and launch, Android APK install and boot, web deployment smoke test.
- **Balance-test as QA scope** — When Nova delivers a balancing spec, Rook scripts test scenarios that stress the new values: run to week 20, confirm economy stays solvent; pass legislation at minimum approval margin, confirm expected effects. Balance tests belong in `tests/`.
- **CI gate design** — Promotion from `development → alpha → stable` is gated by objective criteria (GDD §13.7.1). Rook maintains these gates — know exactly which checks block each stream transition.
- **Regression capture** — Screenshots taken during Playwright runs (stored in `test-results/`) are evidence artifacts. Rook attaches them to PRs and issues when reporting visual regressions.
- **Save compatibility testing** — Every MINOR or schema-changing release must be tested by loading a save file from the previous version. Data corruption on load is a P0.

---

## Reference Games / Comparable Projects

| Title / Project | What Rook should study |
|---|---|
| **Paradox QA methodology** (public postmortems) | How Paradox tests highly emergent systems — property-based testing, scripted scenario runs, community beta gates. |
| **Playwright documentation** (playwright.dev) | Selector best practices, network mocking, visual comparisons, Playwright Test reporter configuration. |
| **axe-core / axe-playwright** | Automated accessibility scanning in Playwright; how to integrate into CI and interpret results. |
| **electron-builder release documentation** | Platform-specific packaging edge cases: code signing for macOS/Windows, APK signing for Android, auto-update server integration. |
| **OWASP Electron Security Checklist** | Comprehensive IPC security, `nodeIntegration`, `contextIsolation`, CSP headers for Electron renderers. |

---

## Best Practices for This Project

1. **Write deterministic reproduction scripts, not prose repro steps.** A repro that requires manual timing is unreliable. Wherever possible, write a minimal Playwright script or a unit test that fails reproducibly.
2. **Validate all three build artifacts per PR.** Don't assume a web-passing build works in Electron or Android. The build pipeline produces three artifacts; spot-check all three on significant changes.
3. **Gate on `typecheck` output, not just test pass.** TypeScript errors are bugs. CI must fail on type errors, not just test failures. Confirm `tsc --noEmit` is in the CI pipeline.
4. **Report defects with exact paths and line numbers.** Rook's reports must be immediately actionable by Sol — "the bug is in `src/systems/EconomySystem.ts` around line 142, the monthly report emits a NaN when `gdpGrowth` is uninitialised" is the required standard.
5. **Maintain a `tests/scenarios/` folder** for named scenario run-to-completion tests. These serve as regression baselines and are the most valuable long-term QA asset.

---

## Useful Patterns & Anti-Patterns

| Do | Avoid |
|---|---|
| Snapshot-compare simulation state after N ticks from fixed seed | Asserting on UI text that changes with game state dynamically |
| Use `page.pause()` / controlled time speed in e2e | Real-time waits (`waitForTimeout`) that create flaky tests |
| Attach screenshots to every visual regression report | Describing visual bugs without evidence |
| Run `axe` scan on every new panel introduced | Shipping new UI surfaces without a11y validation |
| Test save-load round-trip on every MINOR version | Assuming saves from previous builds still load correctly |
| Classify defects by severity before assigning | Lumping all bugs as "bugs" without priority signal |

---

## Quick Reference Links (Internal)

- [Rook's agent file](../../agents/Rook.agent.md)
- [TEAM.md](../../TEAM.md)
- [GDD §13 — QA, Testing, Security, Accessibility, Release Readiness](../../../docs/GDD.md)
- [GDD §11 — Performance Targets & Budgets](../../../docs/GDD.md)
- [ROADMAP.md](../../../docs/ROADMAP.md) (release stream model, promotion gate criteria)
- [playwright.config.ts](../../../playwright.config.ts)
- [tests/e2e/](../../../tests/e2e/) (existing test suite)
- [docs/research/ui-audit-2026-04.md](../../../docs/research/ui-audit-2026-04.md) (visual regression baseline)
- [docs/research/ui-ux-patterns.md](../../../docs/research/ui-ux-patterns.md) (a11y and tooltip patterns)

---

## Handoffs Cheatsheet

| Agent | What Rook gives | What Rook receives |
|---|---|---|
| **Sol** | Repro steps + diagnostics; root-cause hypothesis; pass/fail verdict | Code ready for QA; build artifacts; test environment instructions |
| **Vex** | Content defects (e.g., "this event fires when it shouldn't"); schema errors caught at runtime | Content QA requests |
| **Lux** | UI defects with screenshots; a11y violations; visual regression reports | A11y/perf budget targets; visual deliverables for validation |
| **Nova** | Balance-test results; edge-case repros; perf-budget breaches on simulation ticks | Balance-test scenarios; perf budgets for simulation systems |
| **Jesse** | QA-status labels; regression labels; release readiness signal | Release-gate checklists; issue assignments |
| **Robert** | Rare — QA methodology research requests | Research findings on testing practices |

---

*Researched by Robert — 2026-05-03*
