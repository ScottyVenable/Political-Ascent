# Label Taxonomy

Owner: **Jesse**. Source of truth for labels on `ScottyVenable/Political-Ascent`.

Apply via [`scripts/sync-labels.ps1`](../scripts/sync-labels.ps1). Do **not** create labels in the GitHub UI without updating this file first.

## Color groups

| Group | Hue | Hex root |
|---|---|---|
| `type:*` | red-orange | `#d73a4a` family |
| `area:*` | blue | `#1d76db` family |
| `system:*` | purple | `#5319e7` family |
| `milestone:*` | teal | `#006b75` family |
| `priority:*` | yellow→red gradient | per priority |
| `status:*` | grey-green | `#cfd3d7` / `#0e8a16` |
| `stream:*` | green-blue | `#0366d6` family |
| meta | distinct | per-label |

---

## type:* — what kind of work this is

| Label | Hex | Description |
|---|---|---|
| `type:feature` | `#d73a4a` | New player-visible feature, panel, or surface. |
| `type:bug` | `#b60205` | Defect or regression. |
| `type:system` | `#e99695` | New engine/system module under `src/systems/` or `src/engine/`. |
| `type:content` | `#f9d0c4` | Narrative, dialogue, card flavour, event, news, scenario authoring. |
| `type:research` | `#fbca04` | Design research / spike with bounded deliverable. |
| `type:chore` | `#fef2c0` | Tooling, infrastructure, config, dependency upgrade. |
| `type:tech-debt` | `#c5def5` | Refactor or cleanup with no behaviour change. |
| `type:a11y` | `#0e8a16` | Accessibility (WCAG 2.2 AA) issue. |
| `type:security` | `#5319e7` | Security finding or hardening. |
| `type:release` | `#1d76db` | Per-milestone release tracking issue. |
| `type:docs` | `#cfd3d7` | Documentation-only change. |

## area:* — where in the codebase

| Label | Hex | Description |
|---|---|---|
| `area:engine` | `#1d76db` | `src/engine/` core loop, RNG, tick orchestration. |
| `area:renderer` | `#2188ff` | `src/renderer/` React UI surfaces. |
| `area:ui` | `#79b8ff` | UI components, tokens, layout, interaction grammar. |
| `area:store` | `#0366d6` | Zustand stores under `src/store/`. |
| `area:data` | `#005cc5` | Static JSON content under `src/data/`. |
| `area:save` | `#044289` | Save read / write / migration. |
| `area:electron` | `#032f62` | Electron main process / preload. |
| `area:capacitor` | `#0e8a16` | Capacitor Android shell. |
| `area:ci` | `#6f42c1` | CI workflows / GitHub Actions. |
| `area:modding` | `#a371f7` | Mod loader and modding surface. |
| `area:i18n` | `#bfd4f2` | Localisation / locale bundles. |
| `area:audio` | `#cccccc` | Audio (MVP-deferred per §1.2; reserved). |

## system:* — which game system

| Label | Hex | Description |
|---|---|---|
| `system:legislation` | `#5319e7` | LegislationSystem (GDD §4.1). |
| `system:congress` | `#5319e7` | CongressSystem (§4.2). |
| `system:economy` | `#5319e7` | EconomySystem (§4.3). |
| `system:population` | `#5319e7` | PopulationSystem (§4.4). |
| `system:events` | `#5319e7` | EventEngine (§4.5). |
| `system:cards` | `#5319e7` | CardSystem (§4.6). |
| `system:character` | `#5319e7` | CharacterSystem (§4.7). |
| `system:quests` | `#5319e7` | QuestSystem (§4.8). |
| `system:achievements` | `#5319e7` | AchievementEngine (§4.9). |
| `system:influence` | `#5319e7` | InfluenceSystem (§4.10). |
| `system:faction` | `#5319e7` | FactionSystem / Reputation (§4.11). |
| `system:dialogue` | `#5319e7` | DialogueSystem (§4.12). |
| `system:speech` | `#5319e7` | SpeechSystem (§12.6). |
| `system:time` | `#5319e7` | Time scale / clock (§2.2). |
| `system:save` | `#5319e7` | Save schema / migrations (§5, §13.3). |

## milestone:* — roadmap milestone

| Label | Hex | Description |
|---|---|---|
| `milestone:m1-cloakroom` | `#006b75` | M1 Legislative Overhaul (0.2.0). |
| `milestone:m2-floor-manager` | `#006b75` | M2 Dialogue + Faction (0.3.0). |
| `milestone:m3-stump` | `#006b75` | M3 Speech Composer (0.4.0). |
| `milestone:m4-ironclad` | `#006b75` | M4 A11y + Security (0.5.0). |
| `milestone:m5-lectern` | `#006b75` | M5 Content + i18n (0.6.0). |
| `milestone:m6-telemetry` | `#006b75` | M6 Perf + CI (0.7.0). |
| `milestone:m7-second-front` | `#006b75` | M7 Cold War scenario (0.8.0). |
| `milestone:m8-quorum` | `#006b75` | M8 First stable RC (1.0.0-rc.1). |

> Note: GitHub milestones (the first-class kind) are also created — see `milestones.md`. The `milestone:*` label is for cross-referencing on issues that intentionally do not occupy a milestone slot (e.g. tech-debt that maps to a milestone's theme).

## priority:* — triage priority

| Label | Hex | Description |
|---|---|---|
| `priority:p0-critical` | `#b60205` | Crash, data loss, security critical, release blocker. |
| `priority:p1-high` | `#d93f0b` | Major feature broken or release-significant. |
| `priority:p2-normal` | `#fbca04` | Default for triaged work. |
| `priority:p3-low` | `#c2e0c6` | Polish, nice-to-have, deferrable. |

## status:* — workflow position

| Label | Hex | Description |
|---|---|---|
| `status:needs-triage` | `#cfd3d7` | New, awaiting Jesse triage. |
| `status:needs-design` | `#d4c5f9` | Awaiting Sol/Vex design pass. |
| `status:needs-repro` | `#fbca04` | Bug not yet reproduced by maintainer. |
| `status:blocked` | `#b60205` | Blocked on dependency. |
| `status:ready` | `#0e8a16` | Ready to pick up. |
| `status:in-progress` | `#1d76db` | Actively being worked. |
| `status:review` | `#6f42c1` | In code review. |
| `status:qa` | `#fef2c0` | In QA / verification. |

## stream:* — release stream target

Stream names are independent of GitHub branch names. The folder structure under `docs/changelogs/` retains the stream identifiers; the branch names (`development` / `alpha` / `stable`) host the streams.

| Label | Hex | Description |
|---|---|---|
| `stream:development` | `#bfd4f2` | Development stream. Targets `development` branch. |
| `stream:experimental` | `#79b8ff` | Experimental stream. Targets `alpha` branch. |
| `stream:stable` | `#0366d6` | Stable stream. Targets `stable` branch. |

## meta — discoverability and PR signals

| Label | Hex | Description |
|---|---|---|
| `good-first-issue` | `#7057ff` | Beginner-friendly. |
| `help-wanted` | `#008672` | Outside contributors welcome. |
| `breaking-change` | `#b60205` | Save-incompatible or API-breaking. |
| `regression` | `#d93f0b` | Worked previously, broken now. |
| `flaky-test` | `#e99695` | Test passes/fails non-deterministically. |

---

## Counts

| Category | Count |
|---|---|
| `type:*` | 11 |
| `area:*` | 12 |
| `system:*` | 15 |
| `milestone:*` | 8 |
| `priority:*` | 4 |
| `status:*` | 8 |
| `stream:*` | 3 |
| meta | 5 |
| **Total** | **66** |
