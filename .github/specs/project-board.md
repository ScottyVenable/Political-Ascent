# Project Board Structure — Project #9

Owner: **Jesse**. Source of truth for the structure of
[Project #9](https://github.com/users/ScottyVenable/projects/9).

> Jesse cannot mutate Project #9 directly without API access. This document is
> the contract. The user (or a future automation pass) is expected to apply it
> via the GitHub web UI or the `gh project` CLI commands listed at the bottom.

## 1. Custom fields

| Field | Type | Options / Range |
|---|---|---|
| **Status** | Single-select | `Backlog`, `Triaged`, `Ready`, `In Progress`, `In Review`, `QA`, `Done` |
| **Milestone** | Single-select | `M1 Cloakroom`, `M2 Floor Manager`, `M3 Stump`, `M4 Ironclad`, `M5 Lectern`, `M6 Telemetry`, `M7 Second Front`, `M8 Quorum`, `Unscheduled` |
| **Stream** | Single-select | `development`, `experimental`, `stable` (stream names; map to branches `development`, `alpha`, `stable` respectively — see [labels.md](labels.md) `stream:*`) |
| **Priority** | Single-select | `P0 Critical`, `P1 High`, `P2 Normal`, `P3 Low` |
| **Estimate** | Single-select | `XS (≤ ½ day)`, `S (1–2 days)`, `M (3–5 days)`, `L (1–2 weeks)`, `XL (> 2 weeks)` |
| **System** | Multi-select (text labels) | mirrors the `system:*` label taxonomy (legislation, congress, economy, population, events, cards, character, quests, achievements, influence, faction, dialogue, speech, time, save) |
| **Area** | Multi-select (text labels) | mirrors `area:*` (engine, renderer, ui, store, data, save, electron, capacitor, ci, modding, i18n, audio) |

> Note: GitHub Projects (v2) does not natively support multi-select. For
> **System** and **Area**, either (a) use the matching `system:*` / `area:*`
> labels on the issue and rely on board filters that read labels, or (b) create
> Project text fields with comma-separated values. Option (a) is preferred
> because labels are searchable from the issues list too.

## 2. Views

| View | Type | Filter | Group by | Sort |
|---|---|---|---|---|
| **Backlog** | Table | `Status:Backlog OR Status:Triaged` | `Milestone` | `Priority` desc |
| **Active Sprint** | Board | `Status != Backlog AND Status != Done` | `Status` | `Priority` desc |
| **By System** | Table | (none) | label `system:*` | `Milestone` asc |
| **Release Readiness** | Table | `Stream:experimental OR Stream:stable` | `Milestone` | `Status` |
| **Triage** | Table | `Status:Backlog AND label:status:needs-triage` | `Priority` | `created` asc |
| **My Plate** | Board | `Assignee:@me` | `Status` | `Priority` desc |

## 3. Issue lifecycle

```
[new issue] → Backlog (status:needs-triage)
            ↓ Jesse triage (label, priority, estimate, milestone, stream)
          Triaged
            ↓ design / repro complete
           Ready (status:ready)
            ↓ assignee picks up
        In Progress (status:in-progress)
            ↓ PR opened
         In Review (status:review)
            ↓ approved + merged
              QA (status:qa)
            ↓ verified on the target stream
            Done
```

**Entry rules:**
- New issues land in `Backlog` with `status:needs-triage`.
- Issues without a milestone or priority cannot leave `Backlog`.

**Triage rules (Jesse's pass):**
- Set `Milestone`, `Priority`, `Estimate`, `Stream`, and the appropriate
  `system:*` / `area:*` labels.
- Move to `Triaged`. If design clarification is needed, add `status:needs-design`
  and leave in `Triaged`.

**Exit rules:**
- An issue leaves the board (status `Done`) only after the related PR is merged
  on the target stream **and** the changelog entry exists in
  `docs/changelogs/<stream>/`.

## 4. CLI bootstrap

The user (project owner) runs these once. Replace `<PROJECT_NUMBER>` with `9`.

```powershell
$owner = "ScottyVenable"
$proj  = 9

# Status (already exists by default with similar values; verify via UI)
gh project field-create $proj --owner $owner --name "Status" --data-type SINGLE_SELECT `
  --single-select-options "Backlog,Triaged,Ready,In Progress,In Review,QA,Done"

gh project field-create $proj --owner $owner --name "Milestone" --data-type SINGLE_SELECT `
  --single-select-options "M1 Cloakroom,M2 Floor Manager,M3 Stump,M4 Ironclad,M5 Lectern,M6 Telemetry,M7 Second Front,M8 Quorum,Unscheduled"

gh project field-create $proj --owner $owner --name "Stream" --data-type SINGLE_SELECT `
  --single-select-options "development,experimental,stable"

gh project field-create $proj --owner $owner --name "Priority" --data-type SINGLE_SELECT `
  --single-select-options "P0 Critical,P1 High,P2 Normal,P3 Low"

gh project field-create $proj --owner $owner --name "Estimate" --data-type SINGLE_SELECT `
  --single-select-options "XS,S,M,L,XL"
```

> `gh project field-create` requires `gh` ≥ 2.41 and the `project` scope on
> your token (`gh auth refresh -s project,read:project`).

Views must be created via the web UI; the `gh` CLI does not expose view
mutation as of this writing. Recreate the six views in §2 manually.
