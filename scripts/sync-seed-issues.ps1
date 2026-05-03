<#
.SYNOPSIS
    Skeleton script to create the seed issues defined in .github/seed-issues.md.

.DESCRIPTION
    NOT runnable as-is. This is a scaffold the user fills in (or extends) per
    issue. Each block uses `gh issue create` with --title / --body-file / --label
    / --milestone / --project. Sub-issues require the GitHub REST sub-issue API
    (gh api) and child issue numbers, so they are sketched as comments.

    Usage pattern:
      1. Run scripts/sync-labels.ps1 first.
      2. Run scripts/sync-milestones.ps1 second.
      3. Edit this file: set $ProjectNumber, populate $body for each block,
         then run.

    Owner: Jesse. The user must NOT run this script unmodified.

.NOTES
    `gh issue create --project` accepts the project title (e.g. "Political Ascent")
    rather than the number. Adjust to match the actual project title on
    ScottyVenable's account.
#>

$ErrorActionPreference = "Stop"
$Repo           = "ScottyVenable/Political-Ascent"
$ProjectTitle   = "Political Ascent"   # confirm via: gh project list --owner ScottyVenable

# Helper: write body to a temp file and create the issue
function New-PaIssue {
    param(
        [Parameter(Mandatory)] [string]   $Title,
        [Parameter(Mandatory)] [string]   $Body,
        [Parameter(Mandatory)] [string[]] $Labels,
        [Parameter(Mandatory)] [string]   $Milestone
    )
    $tmp = New-TemporaryFile
    try {
        $Body | Set-Content -Encoding UTF8 -Path $tmp.FullName
        $args = @(
            "issue", "create",
            "--repo", $Repo,
            "--title", $Title,
            "--body-file", $tmp.FullName,
            "--milestone", $Milestone,
            "--project", $ProjectTitle
        )
        foreach ($l in $Labels) { $args += @("--label", $l) }
        Write-Host "Creating: $Title" -ForegroundColor Cyan
        gh @args
    } finally {
        Remove-Item $tmp.FullName -ErrorAction SilentlyContinue
    }
}

# ===========================================================================
# M1 — Cloakroom
# ===========================================================================

New-PaIssue `
    -Title     "Extract VotingSystem from LegislationSystem" `
    -Body      "Voting logic currently lives inside LegislationSystem (GDD §14.1). Extract a VotingSystem module with a clean tally(bill, congress) -> VoteResult contract. Add src/systems/VotingSystem.ts and VotingSystem.test.ts (>=80% line coverage, L1 unit per §13.1.1). No Math.random outside the seeded RNG (§13.2). Update ARCHITECTURE.md." `
    -Labels    @("type:system","area:engine","system:legislation","system:congress","milestone:m1-cloakroom","stream:experimental","priority:p1-high") `
    -Milestone "M1 — Cloakroom — 0.2.0-alpha.1"

New-PaIssue `
    -Title     "Persist quest.startedDay on save" `
    -Body      "QuestSystemImpl.startedDays is in-memory only (GDD §14.1, §4.8). Quests started before save/load lose their start day. Persist on worldStore.activeQuests[].startedDay. Adds a save-schema field -> migration ladder entry per §13.3.3." `
    -Labels    @("type:bug","area:save","system:quests","milestone:m1-cloakroom","stream:experimental","priority:p1-high","breaking-change") `
    -Milestone "M1 — Cloakroom — 0.2.0-alpha.1"

New-PaIssue `
    -Title     "Implement or remove LegislationSystem.budgetReconciliation()" `
    -Body      "ARCHITECTURE.md §4.1 names a budgetReconciliation() hook that doesn't exist. Either build it or remove the reference. Decide as part of M1 scope. Cite GDD §14.1." `
    -Labels    @("type:tech-debt","area:engine","system:legislation","system:economy","milestone:m1-cloakroom","stream:experimental","priority:p2-normal") `
    -Milestone "M1 — Cloakroom — 0.2.0-alpha.1"

New-PaIssue `
    -Title     "Wire Skip-to-event time control to a real handler" `
    -Body      "Speed bar exposes a 'Skip to next event' slot but is currently a no-op (GDD §14.1). Wire it to advance the engine clock until the next queued event from EventEngine and surface the result in the news rail." `
    -Labels    @("type:bug","area:renderer","system:time","milestone:m1-cloakroom","stream:experimental","priority:p2-normal") `
    -Milestone "M1 — Cloakroom — 0.2.0-alpha.1"

New-PaIssue `
    -Title     "[RELEASE] M1 — Cloakroom — 0.2.0-alpha.1" `
    -Body      "Track readiness for 0.2.0-alpha.1. Scope and exit criteria per ROADMAP.md §4 M1. Use the release.yml checklist to gate promotion to the experimental stream." `
    -Labels    @("type:release","milestone:m1-cloakroom","stream:experimental","priority:p1-high") `
    -Milestone "M1 — Cloakroom — 0.2.0-alpha.1"

# ===========================================================================
# M2 — Floor Manager
# ---------------------------------------------------------------------------
# NOTE: Sub-issues for FactionSystem and DialogueSystem parents must be linked
# via gh api after parent issues exist. Sketch:
#   gh api -X POST /repos/$Repo/issues/<parent_number>/sub_issues \
#     -f sub_issue_id=<child_database_id>
# Resolve child REST database id (NOT issue number) via:
#   gh api /repos/$Repo/issues/<child_number> --jq .id
# ===========================================================================

New-PaIssue `
    -Title     "Decide and implement FactionSystem (or formally fold into InfluenceSystem)" `
    -Body      "FactionSystem is referenced in old prose and the roadmap but does not exist as a module (GDD §14.1, §4.11; Vex §12 backlog). Decide: build the module OR delete the language and fold faction state into InfluenceSystem + CongressSystem. Default plan per ROADMAP.md M2 is to build it. Save schema bump -> migration ladder entry per §13.3.3." `
    -Labels    @("type:system","area:engine","system:faction","system:influence","milestone:m2-floor-manager","stream:experimental","priority:p1-high","status:needs-design") `
    -Milestone "M2 — Floor Manager — 0.3.0-alpha.1"

# ... (remaining M2/M3/M4/M5/M6/M7/M8 entries follow the same pattern;
# fill in from .github/seed-issues.md before running.)

# ===========================================================================
# Phase 4 additions (Sol findings)
# ---------------------------------------------------------------------------
# Source: .github/sol-phase4-backlog.md. 16 standalone findings filed below
# (F-05 deferred — awaiting user/Bridge confirmation of {token} syntax).
# 10 sub-issues are sketched as TODO blocks at the bottom — they require their
# parent issue numbers, which only exist after Phase 2 entries are created.
# ===========================================================================

# --- M1 Cloakroom (Phase 4) ---------------------------------------------------

New-PaIssue `
    -Title     "[Sol-F-01] Replace Date.now() RNG seed inside LegislationSystem.draftBill" `
    -Body      "LegislationSystem.draftBill seeds its RNG with Date.now(), which makes the resulting bill id non-deterministic across two replays of the same save. Per GDD §13.2 (strict determinism in engine/systems/store) this is a hard violation. Replace with world.seed + toEpochDays(currentDate) + world.pendingLegislation.length (the same idiom used by maybeSpawnNpcBill at line 254). Add a regression test under src/systems/LegislationSystem.test.ts that drafts twice from the same fixture seed and asserts identical bill ids. Evidence: src/systems/LegislationSystem.ts line 206." `
    -Labels    @("type:bug","area:engine","system:legislation","milestone:m1-cloakroom","priority:p0-critical","stream:experimental") `
    -Milestone "M1 — Cloakroom — 0.2.0-alpha.1"

New-PaIssue `
    -Title     "[Sol-F-06] Validate per-store payload shape inside applySavePayload" `
    -Body      "applySavePayload writes whatever payload.stores.world contains into the world store. A corrupted v1 save with a valid meta but a malformed world (e.g. population not an array) will load and then crash the renderer at the first read. Add lightweight per-store guards (top-level shape only — same depth as the existing isValid in dataLoader). Reject with the existing LoadResult discriminated union. GDD §13.3. Evidence: src/engine/SaveSystem.ts lines 264-279, 165-176." `
    -Labels    @("type:bug","area:save","system:save","milestone:m1-cloakroom","priority:p1-high","stream:experimental") `
    -Milestone "M1 — Cloakroom — 0.2.0-alpha.1"

New-PaIssue `
    -Title     "[Sol-F-07] Add @playwright/test to devDependencies" `
    -Body      "Playwright is invoked by tests/e2e/*.spec.ts and playwright.config.ts but is not declared in package.json. Fresh clones rely on a global install or implicit hoisting. Add @playwright/test to devDependencies and add 'e2e': 'playwright test' to scripts. Required before any CI runner picks the repo up (Phase 6). Evidence: package.json lines 28-58." `
    -Labels    @("type:chore","area:ci","milestone:m1-cloakroom","priority:p1-high") `
    -Milestone "M1 — Cloakroom — 0.2.0-alpha.1"

# --- M2 Floor Manager (Phase 4) -----------------------------------------------

New-PaIssue `
    -Title     "[Sol-F-02] Implement save-schema migration ladder (v1->v2 scaffolding)" `
    -Body      "SaveSystem.readSave currently rejects any save not at the current schema version (§13.3.3). M2 introduces v2 (factions, dialogueProgress, quest.startedDay — see sol-answers-vex.md Q6). Add a migrate(payload, fromVersion): SavePayload function chain so a v1 save loads cleanly into v2. Land the v1->v2 migrator alongside the first v2 field bump, with a fixture in src/test/fixtures/saves/v1/ to lock the upgrade. Without this, the M2 release breaks every existing playtester save. Evidence: src/engine/SaveSystem.ts lines 165-176, 218-228. Depends on F-06." `
    -Labels    @("type:feature","area:save","system:save","milestone:m2-floor-manager","priority:p1-high","stream:experimental","breaking-change") `
    -Milestone "M2 — Floor Manager — 0.3.0-alpha.1"

# F-05 (dialogue token resolver) — DESIGN-BLOCKED. Do not file until user/Bridge
# confirms {token} vs {{token}} syntax. Sol recommends single curly braces
# (ICU-compatible). When the decision lands, file with the chosen syntax baked
# into the body. See .github/sol-answers-vex.md Q4.

New-PaIssue `
    -Title     "[Sol-F-08] Honour Effect.delayDays and Effect.duration, or remove them from the type" `
    -Body      "Effect.delayDays and Effect.duration are declared but the runtime applies all effects immediately. Authors who set these expect them to mean something. Either implement a scheduled-effects queue on worldStore (deterministic, ticked by TimeEngine.onDaily) or drop the fields from the type. Decide as part of M2. Evidence: src/engine/applyEffect.ts lines 13-16; src/types/effect.ts lines 21-23." `
    -Labels    @("type:tech-debt","area:engine","system:effects","milestone:m2-floor-manager","priority:p2-normal","status:needs-design") `
    -Milestone "M2 — Floor Manager — 0.3.0-alpha.1"

New-PaIssue `
    -Title     "[Sol-F-14] Document DialogueOption.isHidden vs requirements semantics" `
    -Body      "visibleOptions filters by isHidden and requirements separately: isHidden=true always hides; requirements failure also hides. Authors will conflate the two. Add a JSDoc note on the type and one short paragraph in the wiki Authoring-Dialogue page distinguishing 'permanently hidden' from 'gated by requirements (with optional failureHint)'. Evidence: src/systems/DialogueSystem.ts lines 53-57; src/types/dialogue.ts line 11." `
    -Labels    @("type:docs","system:dialogue","milestone:m2-floor-manager","priority:p3-low") `
    -Milestone "M2 — Floor Manager — 0.3.0-alpha.1"

New-PaIssue `
    -Title     "[Sol-F-22] applyEffect lacks an exhaustiveness default arm" `
    -Body      "Add default: { const _exhaustive: never = effect; log.warn('unknown effect', _exhaustive); } so a new variant added to the discriminated union surfaces a TypeScript error at the call site. Evidence: src/engine/applyEffect.ts lines 19-98. Folds with F-08." `
    -Labels    @("type:tech-debt","area:engine","milestone:m2-floor-manager","priority:p3-low") `
    -Milestone "M2 — Floor Manager — 0.3.0-alpha.1"

# --- M4 Ironclad (Phase 4) ----------------------------------------------------

New-PaIssue `
    -Title     "[Sol-F-03] IPC pa:settings:set accepts unrestricted record; add allowlist + type guard" `
    -Body      "The settings IPC handler accepts any object and writes it to electron-store verbatim. A compromised renderer could write keys the main process later trusts (e.g. spoofed paths). Add a key allowlist (fullscreen, numberPrecision, tooltipDelay, ...) and per-key type validation. Reject otherwise. Add to the IPC fuzz harness already tracked in seed-issues. Evidence: src/main/main.ts lines 159-166. Distinct from 'IPC handler input validation tests' — that entry is test-only; this is the handler hardening." `
    -Labels    @("type:security","area:electron","milestone:m4-ironclad","priority:p1-high","stream:experimental") `
    -Milestone "M4 — Ironclad — 0.5.0-alpha.1"

New-PaIssue `
    -Title     "[Sol-F-09] Replace applyEffect grant_card and trigger_quest stubs with real handlers" `
    -Body      "grant_card only pushes a news headline; trigger_quest only sets a flag. Both are documented stubs. Replace with calls into CardSystem.grant(cardId) and QuestSystem.start(questId) so the effect type matches its name. Keep the news/flag side effects as diagnostics. Add unit tests covering both paths. Evidence: src/engine/applyEffect.ts lines 81-95." `
    -Labels    @("type:tech-debt","area:engine","system:cards","system:quests","milestone:m4-ironclad","priority:p2-normal") `
    -Milestone "M4 — Ironclad — 0.5.0-alpha.1"

New-PaIssue `
    -Title     "[Sol-F-10] src/utils/id.ts falls back to Math.random() — make rng required for engine callers" `
    -Body      "makeId(prefix, rng?) falls back to Math.random() when no rng is passed. Engine code that omits rng silently desyncs from a save replay. Either split into makeId(prefix, rng) (engine, required) and makeUiId(prefix) (renderer, allowed) or wrap with an ESLint rule that forbids the optional form inside src/engine/ and src/systems/. Evidence: src/utils/id.ts lines 5-9." `
    -Labels    @("type:tech-debt","area:engine","area:ci","milestone:m4-ironclad","priority:p2-normal") `
    -Milestone "M4 — Ironclad — 0.5.0-alpha.1"

New-PaIssue `
    -Title     "[Sol-F-12] Replace (children as any) casts inside ExtendedTooltip" `
    -Body      "ExtendedTooltip forwards mouse/focus handlers to a child by escaping the type system. Six 'as any' casts in 50 lines. Replace with a cloneElement pattern that types children as ReactElement<TooltipChildProps>. Removes the only large 'as any' cluster in the renderer. Evidence: src/renderer/components/tooltip/ExtendedTooltip.tsx lines 428-473." `
    -Labels    @("type:tech-debt","area:renderer","milestone:m4-ironclad","priority:p1-high") `
    -Milestone "M4 — Ironclad — 0.5.0-alpha.1"

New-PaIssue `
    -Title     "[Sol-F-21] electron-store schema declared but not enforced — add JSON schema" `
    -Body      "Pass a real JSON schema to new Store({ schema: ... }) so a corrupted store on disk (or a malicious renderer that bypasses the IPC layer) is rejected at the persistence boundary. GDD §13.5 IPC defence-in-depth. Evidence: src/main/main.ts lines 27-37." `
    -Labels    @("type:security","area:electron","milestone:m4-ironclad","priority:p2-normal") `
    -Milestone "M4 — Ironclad — 0.5.0-alpha.1"

# --- M5 Lectern (Phase 4) -----------------------------------------------------

New-PaIssue `
    -Title     "[Sol-F-17] src/data/quests/ and src/data/events/ content sparseness — split into thematic subfiles" `
    -Body      "Both folders contain a single file. Modders cannot drop a new file in without colliding with the existing one. Split each into thematic subfiles (quests/onboarding.json, quests/personal-life.json, events/political-cycle.json, etc.). No new content needed in this issue — purely a structural split." `
    -Labels    @("type:content","area:data","system:quests","system:events","milestone:m5-lectern","priority:p3-low","status:needs-design") `
    -Milestone "M5 — Lectern — 0.6.0-alpha.1"

New-PaIssue `
    -Title     "[Sol-F-19] Add tsconfig strictness flags noUncheckedIndexedAccess and exactOptionalPropertyTypes" `
    -Body      "Enable noUncheckedIndexedAccess and exactOptionalPropertyTypes in both tsconfig.web.json and tsconfig.electron.json. Expect a one-time burst of failures around worldStore.relationships[id], bills.find(...)?.x, and option-bag callers. Land in M5 once the content surface stabilises. Evidence: tsconfig.web.json lines 7-15." `
    -Labels    @("type:chore","area:ci","milestone:m5-lectern","priority:p3-low") `
    -Milestone "M5 — Lectern — 0.6.0-alpha.1"

New-PaIssue `
    -Title     "[Sol-F-24] dataLoader validation only checks required fields are present, not their type" `
    -Body      "A scenario with id: 42 (number, not branded string) passes today. Tighten the validator to accept a per-field type predicate, not just a presence check. Run as part of the i18n/schema pass since both touch the same loader. Evidence: src/engine/dataLoader.ts lines 165-172." `
    -Labels    @("type:tech-debt","area:engine","area:data","milestone:m5-lectern","priority:p2-normal") `
    -Milestone "M5 — Lectern — 0.6.0-alpha.1"

# --- Unscheduled (Phase 4) ----------------------------------------------------

# F-26 has no milestone. gh issue create requires --milestone in our helper;
# call gh directly without --milestone so the issue lands milestone-less.
$tmp26 = New-TemporaryFile
try {
    "Test-only casts; safe but worth replacing with a typed declare global augmentation so the bridge surface is enforced everywhere it is referenced. Evidence: src/test/setup.ts lines 32, 53; src/engine/SaveSystem.test.ts line 32." |
        Set-Content -Encoding UTF8 -Path $tmp26.FullName
    Write-Host "Creating: [Sol-F-26] Audit (window as any) in tests vs production" -ForegroundColor Cyan
    gh issue create `
        --repo $Repo `
        --title "[Sol-F-26] Audit (window as any) in tests vs production" `
        --body-file $tmp26.FullName `
        --project $ProjectTitle `
        --label "type:tech-debt" --label "area:test" --label "priority:p3-low"
} finally {
    Remove-Item $tmp26.FullName -ErrorAction SilentlyContinue
}

# ===========================================================================
# Phase 4 sub-issues — TODO: requires parent issue numbers
# ---------------------------------------------------------------------------
# Each sub-issue below must be created as a normal issue first, then linked to
# its parent via the GitHub REST sub-issue API. Pattern:
#
#   # 1) Create the child issue (use New-PaIssue or gh issue create)
#   # 2) Resolve the child REST database id (NOT the issue number):
#   #      $childId = gh api /repos/$Repo/issues/<child_number> --jq .id
#   # 3) POST it as a sub-issue of the parent:
#   #      gh api -X POST /repos/$Repo/issues/<parent_number>/sub_issues `
#   #        -f sub_issue_id=$childId
#
# Fill in <parent_number> after the Phase 2 parent issues exist.
# ===========================================================================

# [Sol-F-04] Wire dialogue trees into dataLoader
#   Parent: "Build DialogueSystem renderer panel + node interpreter" (M2)
#   TODO: New-PaIssue ... ; gh api sub_issues link
#   Body: dataLoader does not glob src/data/dialogue/. Add
#   import.meta.glob('/src/data/dialogue/*.json', { eager: true, import: 'default' })
#   and a dialogueTrees: DialogueTree[] field on DataBundle. Register via a
#   small dialogue registry in GameEngine.registerData. See sol-answers-vex.md Q2.
#   Labels: type:feature,area:engine,area:data,system:dialogue,milestone:m2-floor-manager,priority:p1-high,stream:experimental

# [Sol-F-15] Scaffold src/data/dialogue/ directory with one example tree
#   Parent: "Build DialogueSystem renderer panel + node interpreter" (M2)
#   TODO: New-PaIssue ... ; gh api sub_issues link
#   Body: Create src/data/dialogue/ with one example DialogueTree (e.g. chief-
#   of-staff intro). Embed failureHint once and isHidden once. Schema header
#   $schemaVersion: 1.
#   Labels: type:content,area:data,system:dialogue,milestone:m2-floor-manager,priority:p1-high

# [Sol-F-16] Persist dialogueProgress on worldStore
#   Parent: "Build DialogueSystem renderer panel + node interpreter" (M2)
#   TODO: New-PaIssue ... ; gh api sub_issues link
#   Body: Add dialogueProgress: Record<string, string> (treeId -> currentNodeId)
#   to WorldState and zero-init in EMPTY. Captured in v2 of the save schema
#   (depends on F-02). Evidence: src/store/worldStore.ts lines 45-69.
#   Labels: type:feature,area:store,area:save,system:dialogue,milestone:m2-floor-manager,priority:p1-high,breaking-change

# [Sol-F-11] Extend determinism test guard to forbid Date.now()
#   Parent: "ESLint rule: forbid Date.now() outside test/dev" (M4)
#   TODO: New-PaIssue ... ; gh api sub_issues link
#   Body: Extend src/test/determinism.test.ts to scan for Date.now( with the
#   same allow-list comment idiom. Evidence: src/test/determinism.test.ts
#   lines 138-152.
#   Labels: type:chore,area:ci,milestone:m4-ironclad,priority:p2-normal

# [Sol-F-13] Add Content-Security-Policy meta tag to index.html
#   Parent: "Add CSP meta tag + electron session.webRequest headers" (M4)
#   TODO: New-PaIssue ... ; gh api sub_issues link
#   Body: index.html ships without a CSP meta tag. Recommended:
#   default-src 'self'; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com;
#   style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'.
#   Evidence: index.html lines 1-32.
#   Labels: type:security,area:renderer,milestone:m4-ironclad,priority:p1-high

# [Sol-F-23] Add server.allowNavigation: [] to Capacitor config
#   Parent: "Add CSP meta tag + electron session.webRequest headers" (M4)
#   TODO: New-PaIssue ... ; gh api sub_issues link
#   Body: Add server.allowNavigation: [] (empty) so any in-app navigation to a
#   non-bundle URL is denied. allowMixedContent: false already correct.
#   Evidence: capacitor.config.ts lines 1-17.
#   Labels: type:security,area:capacitor,milestone:m4-ironclad,priority:p2-normal

# [Sol-F-25] worldStore action round-trip save fixture
#   Parent: "Build save-fixture corpus under src/test/fixtures/saves/" (M4)
#   TODO: New-PaIssue ... ; gh api sub_issues link
#   Body: After F-06 lands, add a save round-trip test that fires every
#   worldStore action, saves, loads, and asserts state equality. Evidence:
#   src/store/worldStore.ts lines 109-180.
#   Labels: type:tech-debt,area:save,milestone:m4-ironclad,priority:p3-low

# [Sol-F-27] BillTemplate.stageDurations override unit test
#   Parent: "Extract VotingSystem from LegislationSystem" (M1)
#   TODO: New-PaIssue ... ; gh api sub_issues link
#   Body: Add one test that drafts a bill from a template carrying
#   stageDurations: { committee: 1 } and asserts stageEndsOnDay = day + 1.
#   Evidence: src/systems/LegislationSystem.ts lines 145-150.
#   Labels: type:tech-debt,area:engine,system:legislation,milestone:m1-cloakroom,priority:p3-low

# [Sol-F-18] Allow data-driven overrides for humaniseId dictionary
#   Parent: "Move humanise dictionary into the locale bundle" (M5)
#   TODO: New-PaIssue ... ; gh api sub_issues link
#   Body: Add an override hook so scenario-specific cohorts can extend the
#   dictionary without editing humanize.ts. Evidence: src/utils/humanize.ts.
#   Labels: type:tech-debt,area:i18n,milestone:m5-lectern,priority:p3-low

# [Sol-F-20] Add bench, lint:fix, e2e:headed scripts to package.json
#   Parent: "Create bench/ with §13.6.3 fixtures (1w / 13w / 52w / 5y)" (M6)
#   TODO: New-PaIssue ... ; gh api sub_issues link
#   Body: Add three scripts: "bench": "vitest run bench/", "lint:fix":
#   "eslint --fix \"src/**/*.{ts,tsx}\"", "e2e:headed": "playwright test --headed".
#   Depends on F-07. Evidence: package.json lines 11-26.
#   Labels: type:chore,area:ci,milestone:m6-telemetry,priority:p2-normal

Write-Host "Skeleton complete. Extend per seed-issues.md before running on a real repo." -ForegroundColor Yellow
