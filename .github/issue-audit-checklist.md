# Issue Audit Checklist

Owner: **Jesse**. Procedure for reconciling pre-existing issues on
[ScottyVenable/Political-Ascent](https://github.com/ScottyVenable/Political-Ascent)
and [Project #9](https://github.com/users/ScottyVenable/projects/9) with the
new template / label / milestone taxonomy.

> Jesse cannot read live board state from the agent environment. The user
> drives this audit; Jesse can re-triage individual issues once URLs or
> exported JSON are pasted into the conversation.

## Step 1 — Export the current state

```powershell
# All open issues, including labels and milestone, as JSON
gh issue list --repo ScottyVenable/Political-Ascent --state open --limit 500 `
    --json number,title,labels,milestone,assignees,createdAt,updatedAt,body `
    > issues-open.json

# Closed issues from the last 90 days (smaller pull, in case any need re-opening)
gh issue list --repo ScottyVenable/Political-Ascent --state closed --limit 200 `
    --search "closed:>=$(Get-Date).AddDays(-90).ToString('yyyy-MM-dd')" `
    --json number,title,labels,milestone,closedAt `
    > issues-closed-recent.json

# Project #9 items (requires `project` token scope)
gh project item-list 9 --owner ScottyVenable --format json > project-9-items.json
```

## Step 2 — Reconcile each open issue

For every entry in `issues-open.json`, fill in this row:

| Field | Decision |
|---|---|
| **Template-of-record** | One of: feature / bug / system / content / research / chore / tech-debt / a11y / security / release |
| **type:* label** | Exactly one |
| **area:* labels** | One or more |
| **system:* labels** | Zero or more (only for issues that touch a named system) |
| **milestone (GitHub)** | One of M1–M8, or none (Unscheduled) |
| **milestone:* label** | Mirror the GitHub milestone for cross-ref |
| **priority:* label** | Exactly one (p0/p1/p2/p3) |
| **stream:* label** | development / experimental / stable |
| **status:* label** | The current workflow status |
| **estimate (Project field)** | XS/S/M/L/XL |
| **action** | Keep as-is / Re-title / Re-template / Close as superseded by seed issue `<title>` / Split into sub-issues |

## Step 3 — Flag misfits

An issue does **not fit** the new templates if:
- Its body lacks a GDD section reference and no §reference can reasonably be added.
- Its scope crosses three or more `system:*` labels (split it).
- It is a "tracking issue" that does not match the `release.yml` shape (convert
  it to a release tracker or close it in favour of one).
- It targets the legacy Project #6 instead of #9 (the legacy `scripts/new-issue.ps1`
  hard-codes #6 — re-add to #9).

## Step 4 — Issue rewrite recipe

When an existing issue must be migrated to a new template, use this recipe:

> 1. Pick the template that matches the work type (see §1 of `labels.md`).
> 2. Copy the issue body into the relevant template's first textarea field
>    (usually `Summary`). Strip any legacy "Type / Area / Priority" prose
>    that the template now collects in structured fields.
> 3. Add a GDD §-reference. If you cannot identify one, the issue probably
>    needs a research spike first — convert it to `research.yml`.
> 4. Apply the full label set: exactly one `type:*`, exactly one
>    `priority:*`, at least one `area:*`, the matching `milestone:*`, the
>    `stream:*` it targets, and the current `status:*`.
> 5. Set the GitHub milestone to one of M1–M8 (or leave unset and add the
>    `milestone:` label only if intentionally Unscheduled).
> 6. Add to Project #9 with all custom fields populated (Status, Milestone,
>    Stream, Priority, Estimate). Issues without all five cannot leave
>    `Backlog`.
> 7. Comment on the issue with a one-line note: `Migrated to <template>.yml
>    template per labels.md / seed-issues.md. — Jesse` so the audit trail
>    is visible.

## Step 5 — Report back

When the audit pass is complete, paste the resulting summary table into a
chat with Jesse (or attach it as a comment on the M1 release tracking
issue). Jesse will spot-check the rewrites and flag any that drift from the
taxonomy.
