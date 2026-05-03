# Wiki CI Spec

Owner: Jesse. Engineering reviewer: Rook. Content owner: Vex.

> **Status:** Implemented in [`.github/workflows/wiki-ci.yml`](workflows/wiki-ci.yml)
> as of `chore/ci-pipelines`. The workflow inlines the validation snippet from
> [`.github/wiki-push-checklist.md`](wiki-push-checklist.md) §(b) and posts a
> sticky PR comment. Open questions in §5 were resolved as the
> "default proposal" of each item: ubuntu-latest + pwsh, informational for
> the first two weeks, orphans = warning only.

---

## 1. Goal

On every pull request that touches `docs/wiki/**`, run the read-only wiki
validation defined in `.github/wiki-push-checklist.md` §(b) and surface the
results to the PR. Prevent broken intra-wiki links and missing GDD status
blocks from reaching `main`, where `scripts/push-wiki.ps1` would mirror them
to the live wiki.

Non-goal: this CI does not push to the wiki. Pushing remains a deliberate,
human-gated step driven by `scripts/push-wiki.ps1`.

---

## 2. Trigger

GitHub Actions `pull_request` event with a `paths` filter:

- `docs/wiki/**`
- `.github/wiki-push-checklist.md`     (validation snippet lives here)
- `.github/wiki-ci-spec.md`            (this file, so spec changes self-test)
- `scripts/validate-wiki.ps1`          (if/when extracted)

Run on `opened`, `synchronize`, and `reopened`. Skip drafts unless a label
override is added (TBD with Rook — see §5).

---

## 3. Job sketch

Single job, `wiki-validate`.

- **Runner:** `ubuntu-latest` (open question §5).
- **Shell:** `pwsh` for the validation step so the snippet runs unmodified
  from §(b) of the push checklist.
- **Steps:**
  1. `actions/checkout@v4` with `fetch-depth: 1`.
  2. Run the validation snippet from `.github/wiki-push-checklist.md` §(b),
     either inline or by invoking `scripts/validate-wiki.ps1` once that
     extraction lands. The snippet already counts:
     - broken intra-wiki `[[Target]]` links
     - pages missing `> **GDD reference:**`
     - orphan pages not referenced from `_Sidebar.md`
  3. Capture the three counts as step outputs.
  4. **Fail the job if** `brokenLinks > 0` **or** `missingStatus > 0`.
     Orphan count is informational only in v1 — see §5.
  5. Post a sticky PR comment summarising the three counts and listing the
     first N offenders for each category. Use a marker comment (e.g.
     `<!-- wiki-ci -->`) so subsequent runs edit the same comment instead
     of stacking new ones. `marocchino/sticky-pull-request-comment` or an
     equivalent is acceptable; final choice is Rook's.

The job should complete in well under a minute on a clean diff. No
network calls beyond `actions/checkout`.

---

## 4. Out of scope (v1)

Explicitly deferred. Do not bundle these into the first workflow.

- **External link checking.** Verifying `https://` links in wiki pages is a
  separate concern with separate failure modes (rate limits, transient
  outages). Track separately if/when needed.
- **Auto-fix.** CI does not rewrite wiki content. Authors fix locally and
  re-push.
- **Push automation.** `scripts/push-wiki.ps1` stays human-driven. CI does
  not mirror to the wiki repo on merge.
- **Cross-repo validation against the live wiki.** v1 only validates the
  in-repo `docs/wiki/**` tree. Drift detection vs. the live wiki is a
  separate proposal.

---

## 5. Open questions for Rook

These must be answered before the workflow is authored.

1. **Runner choice.** `ubuntu-latest` with `pwsh` is the smallest-surface
   option. Do we have a reason (existing toolchain, secrets, caching) to
   prefer `windows-latest`? Default proposal: `ubuntu-latest`.
2. **Required vs. informational.** Should this check be a required status
   for merging into `main`, or informational with branch-protection added
   later once it has proven stable? Default proposal: informational for the
   first two weeks, then promote to required.
3. **Orphan severity.** Treat orphan pages (present in `docs/wiki/` but not
   linked from `_Sidebar.md`) as a hard failure, a warning, or
   informational? Default proposal: warning in v1, failure once Vex
   confirms `_Sidebar.md` is the canonical index of every shipped page.

---

## 6. Dependencies

This CI spec is blocked on resolution of Vex's six open questions for Sol,
tracked in `.github/wiki-push-checklist.md` §(a)1:

- rider vs. amendment terminology
- dialogue `dataLoader` path
- speech fragment data path
- dialogue token syntax (`{pc.name}` vs. alternatives)
- canonical `applyEffect` schema source
- save schema v2 fields

Rationale: until those answers land, wiki content will continue to churn in
ways that produce false-positive CI failures (renames, link rewrites,
status-block updates). Standing up enforcement on a moving target wastes
review cycles. Once those six are resolved, wiki content stabilises enough
for CI to be useful rather than noisy.

— Jesse
