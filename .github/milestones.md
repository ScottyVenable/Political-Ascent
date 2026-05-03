# Milestone Definitions

Owner: **Jesse**. Mirrors [docs/ROADMAP.md](../docs/ROADMAP.md) §4.

> Roadmap is the source of truth for scope. This file is the source of truth
> for the **GitHub milestone objects** that should exist on the repo.

## Conventions

- Title format: `M<N> — <Code Name> — <version>`
- Description: theme + exit criteria, citing GDD §13.7.1 and roadmap §4.
- Due date: suggested offset from "today" (project start). All offsets are
  illustrative; readiness gates govern actual cadence (per ROADMAP.md §1).
- State: open (closed when the version is tagged on the target stream).

## Milestones

### M1 — Cloakroom — `0.2.0-alpha.1`
- **Theme:** Make the bill lifecycle the most legible system in the game.
- **Suggested due:** +4 weeks
- **Exit criteria:** Player can draft → committee → floor → vote → sign/veto end-to-end with rider stack visible; save round-trip preserves day-indexed clock; VotingSystem has its own test file ≥80% line coverage. Gates: GDD §13.7.1 dev→exp.

### M2 — Floor Manager — `0.3.0-alpha.1`
- **Theme:** Convert two scaffolded systems (Dialogue, Faction) into shipped UI surfaces.
- **Suggested due:** +9 weeks
- **Exit criteria:** Dialogue node renders, choice writes a stat, faction standings persist, scenario victory/loss text renders. Save schema v1→v2 migration test green. Gates: GDD §13.7.1 dev→exp.
- **Depends on:** M1.

### M3 — Stump — `0.4.0-alpha.1`
- **Theme:** Ship the headline RPG-layer expression mechanic — Speech Composer.
- **Suggested due:** +14 weeks
- **Exit criteria:** Compose → audience-fit score → deliver → news headline reflects tone. String-content lint covers headline templates. Gates: §13.7.1 dev→exp.
- **Depends on:** M2.

### M4 — Ironclad — `0.5.0-alpha.1`
- **Theme:** Close every Rook §13 gap before content scope expands further.
- **Suggested due:** +20 weeks
- **Exit criteria:** axe wired, CSP active, save fixture corpus ≥5 fixtures, IPC fuzz harness, Date.now/console.log lints, .nvmrc, nested ErrorBoundary. Gates: dev→exp green AND experimental→stable column exercisable.
- **Depends on:** M1.

### M5 — Lectern — `0.6.0-alpha.1`
- **Theme:** Move authored content out of TS source and prepare for translation.
- **Suggested due:** +26 weeks
- **Exit criteria:** Zero trait/card-flavour strings in TS source. `en-US` locale bundle exists; runtime locale switch plumbed. Gates: §13.7.1 dev→exp.
- **Depends on:** M4.

### M6 — Telemetry — `0.7.0-alpha.1`
- **Theme:** Make performance a tracked artefact, not a vibe.
- **Suggested due:** +32 weeks
- **Exit criteria:** `bench/` exists with 1w / 13w / 52w / 5y fixtures; perf hard-gates block PRs; nightly-soak posts green/red status; branch protection enabled on `experimental` and `stable`. Gates: both columns of §13.7.1 runnable in CI.
- **Depends on:** M4, M5.

### M7 — Second Front — `0.8.0-alpha.1`
- **Theme:** Validate the engine actually supports a second scenario (Cold War).
- **Suggested due:** +40 weeks
- **Exit criteria:** Player can pick the new scenario, play one full beat, reach victory/loss text. Round-trips through save fixture corpus. Gates: §13.7.1 dev→exp.
- **Depends on:** M2, M3, M5.

### M8 — Quorum — `1.0.0-rc.1`
- **Theme:** Pass every gate in the experimental→stable column of §13.7.1.
- **Suggested due:** +48 weeks
- **Exit criteria:** Manual a11y checklist signed off, perf soft-gates green, Win/macOS/Linux + Android smoke green, CodeQL clean, signed binaries, stable changelog written, wiki release notes updated, GDD §14 reviewed. Both columns of §13.7.1 fully green.
- **Depends on:** M6, M7 (strictly serial).

## `gh api` calls (one per milestone)

These create the milestone objects. Run via [`scripts/sync-milestones.ps1`](../scripts/sync-milestones.ps1).

```bash
# Pattern (for reference; actual calls live in the script)
gh api -X POST repos/ScottyVenable/Political-Ascent/milestones \
  -f title="M1 — Cloakroom — 0.2.0-alpha.1" \
  -f state="open" \
  -f description="Theme: …  Exit criteria: …" \
  -f due_on="2026-05-30T00:00:00Z"
```
