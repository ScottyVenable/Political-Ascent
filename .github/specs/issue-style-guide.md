# Issue Style Guide

Owner: **Jesse**. Canonical title and body conventions for issues on
[ScottyVenable/Political-Ascent](https://github.com/ScottyVenable/Political-Ascent)
and [Project #9](https://github.com/users/ScottyVenable/projects/9).

> All issues on Project #9 must conform to this style. Drift is enforced by
> [`scripts/apply-issue-unification.ps1`](../scripts/apply-issue-unification.ps1)
> and audited per [`.github/issue-audit-checklist.md`](issue-audit-checklist.md).

---

## 1. Title format

> `<Imperative verb> <subject> [<scope-tag>]`

- **Imperative mood verb first.** Use `Add`, `Build`, `Document`, `Extract`,
  `Fix`, `Implement`, `Investigate`, `Migrate`, `Persist`, `Refactor`, `Remove`,
  `Replace`, `Wire`. Avoid passive voice or noun phrases.
- **One scope tag in square brackets at the end**, naming the most specific
  area or system the work touches. Use exactly one of:
  - `[area:engine]`, `[area:renderer]`, `[area:ui]`, `[area:store]`,
    `[area:data]`, `[area:save]`, `[area:electron]`, `[area:capacitor]`,
    `[area:ci]`, `[area:modding]`, `[area:i18n]`, `[area:audio]`,
    `[area:security]`, `[area:docs]`
  - `[system:legislation]`, `[system:congress]`, `[system:economy]`,
    `[system:population]`, `[system:events]`, `[system:cards]`,
    `[system:character]`, `[system:quests]`, `[system:achievements]`,
    `[system:influence]`, `[system:faction]`, `[system:dialogue]`,
    `[system:speech]`, `[system:time]`, `[system:save]`
- **Length.** Target ≤60 chars; hard max 80 (including the scope tag).
- **Forbidden in titles.**
  - Issue-number prefixes (`#17:`), source codes (`Sol-F-13`, `Vex §12.1`,
    `Phase 4`), bracketed type prefixes (`[BUG]`, `[CHORE]`, `[FEATURE]`).
    These belong in the body's `Context` section.
  - Emoji (🚨 🐛 ✨ etc.). Release-tracker issues are no exception.
  - Em-dashes used as title-style flourishes (`UI: Cards — physical objects`).
    Rewrite to imperative form.
  - Trailing period.

### Examples

| ✅ Good | ❌ Bad |
|---|---|
| `Add CSP meta tag to index.html [area:security]` | `[Sol-F-13] CSP missing 🚨` |
| `Migrate trait flavour text to JSON [system:character]` | `csp` |
| `Render hemicycle seat layout [system:congress]` | `Congress: hemicycle seat layout` |
| `Fix Playwright reporter folder clash [area:ci]` | `Playwright is broken — folder clash` |
| `Track 0.2.0 alpha release [area:ci]` | `M1 release tracking — Cloakroom` |

---

## 2. Body format

All issues must use these sections, in this order. Use `N/A` if a section is
genuinely empty — do not omit the heading.

```markdown
## Summary

One paragraph (2–4 sentences). Plain language. What changes and why.

## Context

- GDD: §X.Y ([link](../docs/GDD.md))
- Roadmap: M{N} {Codename} ([link](../docs/ROADMAP.md))
- Dependencies: #{N}, #{N}
- Source: Sol F-XX / Vex §12.X / Rook §13.X / Phase {N} discovery / user-reported

## Acceptance criteria

- [ ] Specific, testable item 1
- [ ] Specific, testable item 2
- [ ] ...

## Technical notes

File pointers, schema impacts, perf / security / a11y considerations.
Link to design docs when applicable.

## Out of scope

What this issue explicitly does NOT cover. List sibling/follow-up issues if
known.
```

### Sub-issues append-only block

Parent issues that have GitHub-linked sub-issues append a `## Sub-issues`
section after `## Out of scope`:

```markdown
## Sub-issues

- [ ] #123 — Design FactionSystem data shape and tick contract
- [ ] #124 — Implement FactionSystem.ts module + tests
- [ ] #125 — Persist faction standings on worldStore
```

> The unification script preserves this block verbatim. Do not edit it by
> hand; manage sub-issue relationships through the GitHub UI or
> `gh api graphql` calls and let the checklist follow.

---

## 3. Required labels

Every issue must carry **all** of:

| Slot | Cardinality | Default if unset |
|---|---|---|
| `type:*` | exactly 1 | (must be set; `type:chore` if truly unclassifiable) |
| `priority:*` | exactly 1 | `priority:p2-normal` |
| `status:*` | exactly 1 | `status:needs-triage` |
| `stream:*` | exactly 1 | `stream:development` |
| `milestone:*` | exactly 1 | `milestone:unscheduled` |
| `area:*` | ≥0 | (omit if none apply) |
| `system:*` | ≥0 | (omit if none apply) |

> The `priority:P0` / `priority:P1` / `priority:P2` / `priority:P3` legacy
> labels are deprecated. Migrate to `priority:p0-critical`,
> `priority:p1-high`, `priority:p2-normal`, `priority:p3-low`. The legacy
> `status:triage` label maps to `status:needs-triage`.

**Required milestone object.** Every issue must be assigned to one of the
GitHub milestones M1–M8 **or** to a milestone titled exactly `Unscheduled`.
If `Unscheduled` does not yet exist, the unification script creates it on
first run.

---

## 4. Project #9 fields

After labels are clean, every Project #9 item must have these custom fields
populated per [`.github/project-board.md`](project-board.md):

| Field | Required | Default if unknown |
|---|---|---|
| Status | yes | `Backlog` |
| Priority | yes | matches `priority:*` label |
| Estimate / Size | yes | leave blank, but set `status:needs-triage` |
| Stream | yes | matches `stream:*` label |
| Milestone | yes | matches GitHub milestone |
| System | optional | mirrors `system:*` labels |
| Area | optional | mirrors `area:*` labels |

If the field options on the board don't yet match the label taxonomy
(e.g. `P3` missing, no `Triaged` status, no `QA` status, no `Stream` /
`Milestone` single-select fields), see the click-paths section in the
unification report — `gh` cannot create these without GraphQL mutation.

---

## 5. Allowed deviations

Document any title or body deviation in the per-pass unification report under
"Style-guide deviations the user opted into." Examples that may be
permissible:

- Release-tracking issues (`type:release`) may carry the format
  `Track {version} {codename} release [area:ci]` — the `Track` verb is
  imperative and the scope tag still applies.
- Issues authored by Copilot agents (`copilot/*` branches) may keep their
  agent-generated subject line **only if** it conforms to §1.

---

## 6. References

- [`.github/seed-issues.md`](seed-issues.md) — content source-of-truth.
- [`.github/labels.md`](labels.md) — full label taxonomy.
- [`.github/milestones.md`](milestones.md) — milestone definitions.
- [`.github/ISSUE_TEMPLATE/*.yml`](ISSUE_TEMPLATE/) — body templates per type.
- [`.github/issue-audit-checklist.md`](issue-audit-checklist.md) — audit
  procedure.
- [`.github/project-board.md`](project-board.md) — Project #9 contract.

— Jesse
