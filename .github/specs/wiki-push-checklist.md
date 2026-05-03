# Wiki Push Checklist

Owner: Jesse (repository ops). Wiki content owner: Vex. Engineering reference owner: Sol.

This checklist gates `scripts/push-wiki.ps1`. Do not push `docs/wiki/` to the
GitHub Wiki repo until every gate below passes. The wiki ships as documentation,
so a broken link or stale status block is a player-facing defect.

---

## (a) Pre-push gates

All seven gates must pass. If any gate is blocked on a pending answer, do not
push — file a tracking issue and wait.

1. **Vex's 6 open questions for Sol are resolved or explicitly deferred.**
   Sol delivered answers in [`sol-answers-vex.md`](sol-answers-vex.md) (Phase 4).
   5 of 6 are conclusive; Q4 (token syntax) is design-blocked. Each box must
   be checked before push.
   - [ ] **Q1** — Rider vs. amendment terminology. *Resolved:* "rider" is canonical in player copy; `PolicyModule` is the type. No rename. See [`sol-answers-vex.md`](sol-answers-vex.md) Q-1.
   - [ ] **Q2** — Dialogue `dataLoader` path. *Resolved:* `src/data/dialogue/*.json`; one file per `DialogueTree`. Loader wiring tracked as Sol-F-04. See [`sol-answers-vex.md`](sol-answers-vex.md) Q-2.
   - [ ] **Q3** — Speech fragment data path. *Resolved:* `src/data/speech/devices.json` and `src/data/speech/fragments.json`; M3 work. See [`sol-answers-vex.md`](sol-answers-vex.md) Q-3.
   - [ ] **Q4** — Dialogue token syntax. **Sol recommends `{token}` (single curly braces, ICU-compatible). Awaiting user/Bridge confirmation before authoring locks.** See [`sol-answers-vex.md`](sol-answers-vex.md) Q-4. Until confirmed, do not author tokenised dialogue copy on the wiki.
   - [ ] **Q5** — `applyEffect` schema canonical source. *Resolved:* `src/types/effect.ts` is the single source of truth. Mark `delayDays`/`duration` as reserved (Sol-F-08); `grant_card`/`trigger_quest` as stubs (Sol-F-09). See [`sol-answers-vex.md`](sol-answers-vex.md) Q-5.
   - [ ] **Q6** — Save schema v2 fields. *Resolved:* v2 adds `factions`, `quest.startedDay`, `dialogueProgress` on `payload.stores.world`. Migration ladder tracked as Sol-F-02. See [`sol-answers-vex.md`](sol-answers-vex.md) Q-6.
2. **Intra-wiki link lint passes.** Every `[[Target]]` and
   `[[Label|Target]]` resolves to a file present in `docs/wiki/`. Run the
   snippet in §(b).
3. **Status block present on every page.** Each `docs/wiki/*.md` (except
   `_Sidebar.md` and `_Footer.md`) contains a `> **GDD reference:**` line so
   readers can trace wiki claims back to the design doc.
4. **Sidebar / Footer paths match.** Every link target in `_Sidebar.md` and
   `_Footer.md` exists as a file in `docs/wiki/`. No orphan entries; no
   missing entries for top-level pages.
5. **Road-Ahead redirect stub in place.** `docs/wiki/Road-Ahead.md` exists
   and redirects to `docs/ROADMAP.md` (or its canonical successor). The
   wiki must not contain a competing roadmap.
6. **Scenario stubs are marked.** Pages describing unimplemented scenarios
   carry a visible `> **Status:** Stub — not yet implemented.` block so
   players are not misled.
7. **Working tree is clean.** `git status` reports no uncommitted changes
   under `docs/wiki/` before invoking `scripts/push-wiki.ps1`. The push
   script mirrors the on-disk tree; uncommitted edits ship silently.

---

## (b) PowerShell validation snippet (read-only)

Run from the repo root. Read-only — does not mutate files or push anything.
Reports broken `[[wiki-links]]`, pages missing the GDD status block, and
orphan pages absent from `_Sidebar.md`.

```powershell
# Wiki validation (read-only). Run from repo root.
$wikiDir   = 'docs/wiki'
$pages     = Get-ChildItem -Path $wikiDir -Filter '*.md' -File
$pageNames = $pages.BaseName

Write-Host "==> Wiki pages: $($pages.Count)" -ForegroundColor Cyan

# 1. Intra-wiki link check: [[Target]] or [[Label|Target]]
$linkPattern = '\[\[(?:[^\]\|]+\|)?([^\]\|]+)\]\]'
$brokenLinks = @()
foreach ($p in $pages) {
    $content = Get-Content -Raw -LiteralPath $p.FullName
    $matches = [regex]::Matches($content, $linkPattern)
    foreach ($m in $matches) {
        $target = $m.Groups[1].Value.Trim()
        if ($pageNames -notcontains $target) {
            $brokenLinks += [pscustomobject]@{
                Page   = $p.Name
                Target = $target
            }
        }
    }
}
Write-Host "==> Broken intra-wiki links: $($brokenLinks.Count)" -ForegroundColor Yellow
$brokenLinks | Format-Table -AutoSize

# 2. Status-block presence: '> **GDD reference:**'
$skip = @('_Sidebar', '_Footer')
$missingStatus = $pages |
    Where-Object { $skip -notcontains $_.BaseName } |
    Where-Object {
        -not (Select-String -Path $_.FullName -Pattern '> \*\*GDD reference:\*\*' -SimpleMatch -Quiet)
    }
Write-Host "==> Pages missing GDD status block: $($missingStatus.Count)" -ForegroundColor Yellow
$missingStatus | Select-Object Name | Format-Table -AutoSize

# 3. Orphan pages not referenced in _Sidebar.md
$sidebar = Get-Content -Raw -LiteralPath (Join-Path $wikiDir '_Sidebar.md')
$orphans = $pages |
    Where-Object { $skip -notcontains $_.BaseName } |
    Where-Object { $sidebar -notmatch [regex]::Escape($_.BaseName) }
Write-Host "==> Orphan pages not in _Sidebar.md: $($orphans.Count)" -ForegroundColor Yellow
$orphans | Select-Object Name | Format-Table -AutoSize

if ($brokenLinks.Count -gt 0 -or $missingStatus.Count -gt 0) {
    Write-Host "FAIL: fix issues above before pushing wiki." -ForegroundColor Red
    exit 1
} else {
    Write-Host "OK: wiki validation passed." -ForegroundColor Green
}
```

Save as `scripts/validate-wiki.ps1` if you want a reusable command. Either
way, run it locally before each push.

---

## (c) Push procedure

1. **Read `scripts/push-wiki.ps1` first.** Do not run a script you have not
   reviewed in the current branch state. Confirm source path, target wiki
   remote, and any auth assumptions.
2. **Branch check.** Confirm you are on the integration branch the wiki
   should mirror (typically `main`). Pushing wiki content from a feature
   branch silently ships unmerged work.
3. **Manual dry-run via robocopy `/L`.** Before invoking the script, mirror
   the source tree in list-only mode to preview what would change:
   ```powershell
   $src = (Resolve-Path 'docs/wiki').Path
   $dst = (Resolve-Path '..\Political-Ascent.wiki').Path  # adjust to your local clone
   robocopy $src $dst /MIR /L
   ```
   Review the listing. Investigate any unexpected adds, deletes, or
   overwrites before proceeding.
4. **Run the script.** `pwsh -File scripts/push-wiki.ps1`. Capture output to
   a log file for the post-push checklist:
   ```powershell
   pwsh -File scripts/push-wiki.ps1 *>&1 | Tee-Object -FilePath "wiki-push-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
   ```
5. **Rollback.** If the push lands bad content, revert the wiki repo locally
   to the previous commit and force-push to the wiki remote:
   ```powershell
   # In your local Political-Ascent.wiki clone
   git reset --hard HEAD~1
   git push --force-with-lease origin master
   ```
   GitHub wiki repos use `master` as the default branch. `--force-with-lease`
   is preferred over `--force` so a concurrent edit does not get clobbered.

---

## (d) Post-push verification

- [ ] Open the live wiki in a browser; confirm the home page renders.
- [ ] Click 3 randomly chosen sidebar entries; confirm each loads without
      "Page not found".
- [ ] Spot-check one page that had a status-block edit; confirm the GDD
      reference renders.
- [ ] Confirm `_Sidebar.md` and `_Footer.md` show their links correctly.
- [ ] Archive the push log under `docs/changelogs/development/` if the push
      represented a documented milestone.
- [ ] Update the wiki section of `HANDOFF.md` if any owner-relevant facts
      changed (paths, redirects, deferred questions).

---

## (e) Future improvements

Tracked here so they do not get lost. None of these block the current push
flow, but each represents accumulated risk.

- **No `-DryRun` flag on `scripts/push-wiki.ps1`.** Currently the only dry
  run is the manual robocopy `/L` in §(c)3. Add a first-class `-DryRun`
  switch that runs the same validation snippet plus a robocopy preview and
  exits without pushing.
- **No pre-flight lint hook.** The validation snippet in §(b) is run by
  convention, not enforced. Wire it into `push-wiki.ps1` (and ideally CI —
  see `wiki-ci-spec.md`) so a broken link cannot reach the live wiki.
- **No log retention.** Push output is not persisted by default. Either add
  `Tee-Object` inside the script or document a retention policy under
  `docs/changelogs/`.
- **Hard-coded `master` assumption.** Rollback and push assume the wiki
  remote uses `master`. If GitHub flips wiki defaults to `main`, the script
  and this checklist both break silently. Detect the default branch at
  runtime via `git remote show` instead.

— Jesse
