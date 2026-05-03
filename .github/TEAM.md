# Team

Canonical team coordination map for **Political Ascent**. Each specialist owns a clear lane; this file is the single source of truth for who-does-what and how work moves between them.

Owner: **Jesse**. Update this file when adding, removing, or renaming agents.

---

## Roster

| Name | Role | Agent file | Portfolio |
|---|---|---|---|
| Bridge | Crew dispatcher / multi-agent router | [agents/Bridge.agent.md](agents/Bridge.agent.md) | _n/a — coordination only_ |
| Sol | Co-creative director / lead programmer | [agents/Sol.agent.md](agents/Sol.agent.md) | _works in repo `src/`_ |
| Vex | Content & lore architect | [agents/Vex.agent.md](agents/Vex.agent.md) | _works in repo `src/data/`, `docs/`_ |
| Rook | QA & release engineer | [agents/Rook.agent.md](agents/Rook.agent.md) | _works in `tests/`, CI_ |
| Robert | Master researcher | [agents/Robert.agent.md](agents/Robert.agent.md) | [portfolios/robert/](portfolios/robert/) |
| Lux | Visuals & art direction lead | [agents/Lux.agent.md](agents/Lux.agent.md) | [portfolios/lux/](portfolios/lux/) |
| Nova | Gameplay systems & balancing lead **(new)** | [agents/Nova.agent.md](agents/Nova.agent.md) | [portfolios/nova/](portfolios/nova/) |
| Jesse | Repository manager / community coordinator | [agents/Jesse.agent.md](agents/Jesse.agent.md) | [portfolios/jesse/](portfolios/jesse/) |

---

## Goals

- **Bridge** — Classify each request and route it to the smallest correct set of specialists, in dependency order.
- **Sol** — Land production-quality, deterministic, well-tested code that matches the GDD and engineering standards.
- **Vex** — Author content (text, lore, dialogue, events) that is internally consistent, schema-clean, and tonally on-brand.
- **Rook** — Verify build health, reproduce defects deterministically, and gate releases on objective pass/fail evidence.
- **Robert** — Supply the team with sourced, structured external knowledge and reference material so design decisions are informed.
- **Lux** — Define and protect the visual identity: art style, UI/UX language, color, typography, and asset specs that other roles can implement without ambiguity.
- **Nova** — Design and balance the core gameplay systems: mechanics, progression, economy, difficulty, and player-experience tuning, delivered as implementation-ready specs.
- **Jesse** — Keep the backlog, board, labels, milestones, wiki, and team docs accurate so coordination is fast and unambiguous.

---

## Portfolios & Storage

| Agent | Working dir | Images / assets | Promoted output |
|---|---|---|---|
| Bridge | `.github/portfolios/bridge/` (routing logs, decision records) | _n/a_ | Inline summaries to user |
| Sol | `.github/portfolios/sol/` for specs/prototypes; repo `src/`, `scripts/`, workflows for code | _n/a_ | Merged PRs into `development` |
| Vex | `.github/portfolios/vex/` for drafts; `src/data/`, `docs/wiki/`, `docs/about/` for promoted content | _n/a_ | Merged PRs |
| Rook | `.github/portfolios/rook/` for QA reports; `tests/`, `playwright-report/`, `test-results/` for runs | screenshot evidence in PR comments | QA reports + pass/fail signals |
| Robert | `.github/portfolios/robert/` | `.github/portfolios/robert/images/` | `docs/research/` (when promoted) |
| Lux | `.github/portfolios/lux/` | `.github/portfolios/lux/images/` | `docs/design/`, `docs/reference images/` (when promoted), Sol handoff briefs |
| Nova | `.github/portfolios/nova/` | `.github/portfolios/nova/images/` | `docs/design/systems/` (when promoted), Sol handoff specs |
| Jesse | `.github/portfolios/jesse/` for audits/snapshots; `.github/` (labels, milestones, board, wiki spec) for canonical files | _n/a_ | Issues, board fields, release notes |

**Memory**:
- `/memories/repo/` — repo-scoped facts (branch model, taxonomy, conventions). Shared by all agents.
- `/memories/session/` — per-conversation working notes.
- `/memories/` (user scope) — cross-workspace preferences.

---

## Handoff Matrix

Rows = sender. Columns = receiver. Cell = what is handed off.

| ↓ from \ to → | Sol | Vex | Rook | Robert | Lux | Nova | Jesse |
|---|---|---|---|---|---|---|---|
| **Sol** | — | schema/interface change notes | code ready for QA | research questions | implemented surfaces for visual review | implementation feedback on system specs (feasibility, perf) | tracking issue updates |
| **Vex** | content schema needs | — | content QA requests | tone/lore research asks | narrative tone & lore for visual translation | narrative constraints on mechanics; lore-driven systems | content tracking |
| **Rook** | repro steps + diagnostics | content defects | — | _rare_ | UI defects with screenshots | balance-test results, edge-case repros, perf-budget breaches | QA-status / regression labels |
| **Robert** | research findings, citations | tone/setting references | _rare_ | — | reference images, mood boards (`portfolios/robert/images/`) | competitor balancing data, systems references, genre benchmarks | gap reports |
| **Lux** | finalized visual specs, UI/UX briefs, asset briefs | visual language proposals (for narrative alignment) | a11y/perf budget targets, visual deliverables for validation | reference-image asks | — | visual readability constraints for systems feedback | work items, label requests |
| **Nova** | finalized system specs, formulas, data tables, balancing parameters | system constraints affecting narrative beats | balance-test scenarios, perf budgets for simulation | research requests on systems & balance | systems that need visual feedback / readability | — | work items, milestone alignment |
| **Jesse** | issue assignments, board fields | issue assignments | release-gate checklists | research requests | art-direction work items, label/milestone updates | systems/balance work items, milestone tracking | — |

---

## Interaction Patterns

Typical multi-agent flows. Bridge selects and sequences these.

### Feature flow (full pipeline)
```
Robert (research) → Vex (narrative) → Nova (systems & balance) → Lux (visuals) → Sol (implementation) → Rook (QA) → Jesse (tracking & release notes)
```

### UI / panel work
```
Lux (UI/UX brief + visual spec) → Sol (implementation) → Rook (a11y + perf validation) → Jesse (label + status)
```
Robert may be pulled in early for reference images. Vex is consulted if the surface contains player-facing copy.

### Visual identity update (palette / typography / motif)
```
Lux (proposal + style guide diff) → Vex (tone alignment review) → Sol (token/CSS implementation) → Rook (visual regression) → Jesse (changelog + announcement)
```

### Content drop
```
Vex (authoring) → Sol (schema validation if needed) → Rook (lint/tests) → Jesse (tracking)
```

### Systems / balance work
```
Robert (competitor & genre data) → Nova (system spec + balancing model) → Vex (narrative alignment) → Lux (visual readability review) → Sol (implementation) → Rook (balance tests + perf) → Jesse (tracking)
```

### Bug fix
```
Rook (repro) → Sol (fix) → Rook (verify) → Jesse (close + label)
```

### Research spike
```
Jesse (issue) → Robert (investigation) → requesting agent (consume findings)
```

---

## Coordination Rules

- **Branch protection**. No direct commits to `development`, `alpha`, or `stable`. All work lands via PR into `development`. See `/memories/repo/branch-model.md`.
- **Branch naming**. `feat/<slug>`, `fix/<slug>`, `chore/<slug>`, `docs/<slug>`. Some agents prefix with their name (e.g. `feat/sol-…`); not required.
- **Signing**. End every report, PR comment, issue comment, and handoff with `- <Name>` (e.g. `- Lux`, `- Jesse`).
- **Portfolios are working drafts**. Files under `.github/portfolios/<agent>/` are pre-promotion. When a deliverable is final, the header must declare its destination (`docs/`, `src/data/`, Sol-handoff, etc.).
- **No cross-portfolio writes**. Agents only write to their own portfolio. Sharing happens by reference (link) or by Jesse copying into a shared docs path.
- **No source-code edits from non-engineering agents**. Vex, Robert, Lux, Jesse hand off to Sol for any change under `src/` (Vex may edit `src/data/*.json` content tables when schema is unchanged).
- **Lux specifically does not author final art assets**. Lux produces specs and briefs; final assets are sourced or implemented downstream of Lux's specs.
- **Nova specifically does not implement code**. Nova produces system specifications, formulas, data tables, and balancing parameters; Sol implements them.

---

## Memory & Storage Conventions

| Location | Purpose | Example |
|---|---|---|
| `/memories/` | Cross-workspace user prefs | style preferences, recurring lessons |
| `/memories/repo/` | Repo-scoped canonical facts | `branch-model.md`, `team-roster.md` |
| `/memories/session/` | Per-conversation scratch | active task plan, in-progress notes |
| `.github/portfolios/<agent>/` | Agent working drafts | research reports, style guides, briefs |
| `.github/portfolios/<agent>/images/` | Reference images & exports | mood boards, palettes, screenshots |
| `.github/portfolios/<agent>/README.md` | Index & subfolder map | required for each agent with a portfolio |
| `docs/research/` | Promoted research (from Robert) | competitor analyses, design references |
| `docs/design/` | Promoted design specs (from Lux/Vex/Nova) | visual style guides, UX flows, systems specs |
| `docs/design/systems/` | Promoted systems specs (from Nova) | core loop, progression, economy, balance models |

File naming inside portfolios: `[topic]-[descriptor].[ext]` for assets; `[YYYY-MM]-[slug].md` for dated reports.

---

_Last updated: 2026-05-02 (Nova integration + portfolio rollout). Maintained by Jesse._
