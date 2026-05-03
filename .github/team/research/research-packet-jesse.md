# Research Packet — Jesse: Repository Manager & Community Coordinator

**Destination:** `.github/team/research/` (team resource)
**Intended audience:** Jesse

---

## Purpose

Equips Jesse with the project-management conventions, GitHub-native tooling patterns, and backlog hygiene practices that keep Political Ascent's development cadence clean, traceable, and readable for a small cross-functional agent team.

---

## Role Summary

Jesse owns repository organization, planning hygiene, and community coordination. He creates and triages issues with complete metadata, maintains board status and project fields, manages labels and milestones, maintains the wiki, audits backlog health, and writes release notes. Jesse does not edit source code or make product-direction decisions.

---

## Key Concepts & Domain Knowledge

- **Taxonomy as coordination surface** — Label taxonomy (`area:*`, `stream:*`, `type:*`, `priority:*`) is the primary coordination signal for an agent team without synchronous standups. Every agent reads label state to understand work status; stale or inconsistent labels create coordination failures.
- **Milestone pacing for simulation games** — Political Ascent's features are interdependent (legislation → economy → faction → narrative). Milestones must reflect dependency order, not just feature desirability. A milestone that ships a UI surface before its backing system is ready is a false gate.
- **Issue taxonomy for multi-agent workflows** — Issues are the handoff primitive. Every issue needs: type label, area label, stream label, priority, assignee, milestone, and a body that gives any agent enough context to act. Missing fields create routing failures for Bridge.
- **Changelog discipline** — Political Ascent uses a three-stream changelog (development / experimental / stable). Jesse is responsible for ensuring that user-visible changes appear in `docs/about/CHANGELOG.md` in Keep-a-Changelog format, not just in stream-specific changelogs.
- **Protected-branch policy enforcement** — `development`, `alpha`, and `stable` are protected. Jesse maintains the PR review rules and monitors for direct-push attempts. The stream promotion process (development → alpha → stable) must follow the GDD §13.7.1 gate criteria.
- **Wiki as player-facing documentation** — The `docs/wiki/` folder powers the game's in-game wiki (and potentially the GitHub wiki). Jesse owns operational wiki pages (contributing, changelog, release notes); Vex owns content wiki pages (lore, mechanics descriptions). The boundary must be clear.
- **Board field hygiene** — GitHub Projects fields (Status, Priority, Milestone, Stream, Area) must all be populated in one pass when creating issues. Partial field population creates board gaps that mislead routing.
- **Release note audience calibration** — Development changelog entries are technical (for the team). Experimental entries are for opt-in testers (semi-technical). Stable release notes are for players (no implementation detail; all user-facing language). Jesse must write for the correct audience.
- **Idempotent bulk operations** — Scripts like `sync-labels.ps1`, `sync-milestones.ps1` must be safe to run multiple times. Jesse should validate label/milestone existence before running bulk issue edits.
- **Community coordination for indie games** — Discussions, announcements, and contributor guidance shape the public perception of the project's health and openness. Tone should be welcoming, specific, and honest about pre-alpha status.

---

## Reference Games / Comparable Projects

| Title / Project | What Jesse should study |
|---|---|
| **Paradox Development Studio GitHub repos** | How large-scale strategy game teams structure issues, milestones, and modding documentation publicly. |
| **Keep a Changelog** (keepachangelog.com) | The canonical format Political Ascent's `CHANGELOG.md` follows — Jesse must know this spec by heart. |
| **GitHub Projects (Projects v2) documentation** | Custom fields, grouped views, workflows, automation — the board toolset Jesse controls. |
| **Obsidian Publish / Dendron** | How game wikis are structured for both developer and player consumption; information architecture lessons applicable to `docs/wiki/`. |
| **Celeste / Hades community release communication** | How indie studios communicate pre-release updates, maintain trust, and acknowledge community feedback — tone models for Jesse's announcements. |

---

## Best Practices for This Project

1. **Run `sync-labels.ps1` and `sync-milestones.ps1` before any bulk issue edit.** Label and milestone prerequisites must exist on GitHub before `gh issue edit --add-label` calls; the scripts are idempotent and safe to re-run.
2. **Populate all required board fields in a single `gh issue create` call**, not as a follow-up edit. Partial metadata in new issues creates routing delays for Bridge.
3. **Audit backlog health on each milestone boundary.** Before closing a milestone, confirm: all issues resolved or explicitly deferred, release notes drafted, changelog entry written, labels updated to `status:done`.
4. **Keep release notes in the player's vocabulary.** Avoid implementation terms ("Zustand slice", "tick handler") in `CHANGELOG.md` stable entries. Translate to player-facing impact ("Legislation now advances through committee automatically each week").
5. **Coordinate wiki updates with Vex.** When a mechanic changes, Jesse ensures the wiki page update is tracked as an issue assigned to Vex — wiki accuracy is a release gate for player-facing content.

---

## Useful Patterns & Anti-Patterns

| Do | Avoid |
|---|---|
| Confirm `gh label list` output before bulk-edit scripts | Assuming labels exist before running `gh issue edit --add-label` |
| Use `${ }` interpolation syntax in PowerShell scripts, not `$n:` notation | `$n:` in interpolated strings (parser error) |
| Write release notes at the player-experience level | Copying implementation detail into `CHANGELOG.md` stable entries |
| Track all cross-agent handoffs as issues with proper metadata | Relying on informal agent messages for deliverable tracking |
| Close issues with a comment citing the merged PR | Silently closing issues without resolution context |
| Maintain milestone descriptions that explain the player-value delivered | Milestones named only by internal codename with no player-value statement |

---

## Quick Reference Links (Internal)

- [Jesse's agent file](../../agents/Jesse.agent.md)
- [TEAM.md](../../TEAM.md)
- [ROADMAP.md](../../../docs/ROADMAP.md) (milestone map, stream definitions, versioning policy)
- [GDD §13 — QA / Release Readiness §13.7.1](../../../docs/GDD.md) (promotion gate criteria)
- [docs/about/CHANGELOG.md](../../../docs/about/CHANGELOG.md)
- [docs/guides/CONTRIBUTING.md](../../../docs/guides/CONTRIBUTING.md)
- [scripts/sync-labels.ps1](../../../scripts/sync-labels.ps1)
- [scripts/sync-milestones.ps1](../../../scripts/sync-milestones.ps1)
- [scripts/new-issue.ps1](../../../scripts/new-issue.ps1)

---

## Handoffs Cheatsheet

| Agent | What Jesse gives | What Jesse receives |
|---|---|---|
| **Sol** | Issue assignments; board field updates; release-gate checklists | Tracking issue updates; PR links; changelog entries |
| **Vex** | Issue assignments for content work; wiki publication confirmation | Content tracking issues; wiki entries ready to publish |
| **Rook** | Release-gate checklists; issue severity labels | QA-status labels; regression labels; release readiness signal |
| **Lux** | Art-direction work items; label/milestone updates for visual tasks | Label requests for new `area:visuals` tags; visual milestone deliverables |
| **Nova** | Systems/balance work items; milestone tracking for systems work | Systems milestone deliverables; design-scope clarification |
| **Robert** | Research-request issues ("spike" type) | Gap reports; research findings that surface new backlog items |
| **Bridge** | Routing context (current board state, open blockers) | Routing decisions; task delegations to Jesse |

---

*Researched by Robert — 2026-05-03*
