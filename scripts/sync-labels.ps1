<#
.SYNOPSIS
    Materialise the Political Ascent label taxonomy on GitHub.

.DESCRIPTION
    Idempotently creates / updates every label documented in .github/labels.md
    via `gh label create --force`. Run once after editing labels.md to keep
    the live repo in sync.

    Repository: ScottyVenable/Political-Ascent

    Requires: GitHub CLI (`gh`) authenticated as a maintainer.

.NOTES
    Owner: Jesse. Do not run unless the label taxonomy doc has been reviewed.
#>

$ErrorActionPreference = "Stop"
$Repo = "ScottyVenable/Political-Ascent"

# Each entry: name, color (no #), description
$labels = @(
    # type:*
    @{ n="type:feature";       c="d73a4a"; d="New player-visible feature, panel, or surface." }
    @{ n="type:bug";           c="b60205"; d="Defect or regression." }
    @{ n="type:system";        c="e99695"; d="New engine/system module." }
    @{ n="type:content";       c="f9d0c4"; d="Narrative / content authoring." }
    @{ n="type:research";      c="fbca04"; d="Design research / spike." }
    @{ n="type:chore";         c="fef2c0"; d="Tooling / infra / config." }
    @{ n="type:tech-debt";     c="c5def5"; d="Refactor / cleanup, no behaviour change." }
    @{ n="type:a11y";          c="0e8a16"; d="Accessibility (WCAG 2.2 AA)." }
    @{ n="type:security";      c="5319e7"; d="Security finding or hardening." }
    @{ n="type:release";       c="1d76db"; d="Per-milestone release tracking." }
    @{ n="type:docs";          c="cfd3d7"; d="Documentation-only change." }
    # area:*
    @{ n="area:engine";        c="1d76db"; d="src/engine/." }
    @{ n="area:renderer";      c="2188ff"; d="src/renderer/." }
    @{ n="area:ui";            c="79b8ff"; d="UI components / tokens / interaction grammar." }
    @{ n="area:store";         c="0366d6"; d="Zustand stores under src/store/." }
    @{ n="area:data";          c="005cc5"; d="Static JSON content under src/data/." }
    @{ n="area:save";          c="044289"; d="Save read/write/migration." }
    @{ n="area:electron";      c="032f62"; d="Electron main / preload." }
    @{ n="area:capacitor";     c="0e8a16"; d="Capacitor Android shell." }
    @{ n="area:ci";            c="6f42c1"; d="CI workflows / GitHub Actions." }
    @{ n="area:modding";       c="a371f7"; d="Mod loader and modding surface." }
    @{ n="area:i18n";          c="bfd4f2"; d="Localisation / locale bundles." }
    @{ n="area:audio";         c="cccccc"; d="Audio (deferred per GDD §1.2)." }
    # system:*
    @{ n="system:legislation"; c="5319e7"; d="LegislationSystem (GDD §4.1)." }
    @{ n="system:congress";    c="5319e7"; d="CongressSystem (§4.2)." }
    @{ n="system:economy";     c="5319e7"; d="EconomySystem (§4.3)." }
    @{ n="system:population";  c="5319e7"; d="PopulationSystem (§4.4)." }
    @{ n="system:events";      c="5319e7"; d="EventEngine (§4.5)." }
    @{ n="system:cards";       c="5319e7"; d="CardSystem (§4.6)." }
    @{ n="system:character";   c="5319e7"; d="CharacterSystem (§4.7)." }
    @{ n="system:quests";      c="5319e7"; d="QuestSystem (§4.8)." }
    @{ n="system:achievements";c="5319e7"; d="AchievementEngine (§4.9)." }
    @{ n="system:influence";   c="5319e7"; d="InfluenceSystem (§4.10)." }
    @{ n="system:faction";     c="5319e7"; d="FactionSystem / Reputation (§4.11)." }
    @{ n="system:dialogue";    c="5319e7"; d="DialogueSystem (§4.12)." }
    @{ n="system:speech";      c="5319e7"; d="SpeechSystem (§12.6)." }
    @{ n="system:time";        c="5319e7"; d="Time scale / clock (§2.2)." }
    @{ n="system:save";        c="5319e7"; d="Save schema / migrations (§5, §13.3)." }
    # milestone:*
    @{ n="milestone:m1-cloakroom";     c="006b75"; d="M1 Legislative Overhaul (0.2.0)." }
    @{ n="milestone:m2-floor-manager"; c="006b75"; d="M2 Dialogue + Faction (0.3.0)." }
    @{ n="milestone:m3-stump";         c="006b75"; d="M3 Speech Composer (0.4.0)." }
    @{ n="milestone:m4-ironclad";      c="006b75"; d="M4 A11y + Security (0.5.0)." }
    @{ n="milestone:m5-lectern";       c="006b75"; d="M5 Content + i18n (0.6.0)." }
    @{ n="milestone:m6-telemetry";     c="006b75"; d="M6 Perf + CI (0.7.0)." }
    @{ n="milestone:m7-second-front";  c="006b75"; d="M7 Cold War scenario (0.8.0)." }
    @{ n="milestone:m8-quorum";        c="006b75"; d="M8 First stable RC (1.0.0-rc.1)." }
    # priority:*
    @{ n="priority:p0-critical"; c="b60205"; d="Crash / data loss / release blocker." }
    @{ n="priority:p1-high";     c="d93f0b"; d="Major feature broken or release-significant." }
    @{ n="priority:p2-normal";   c="fbca04"; d="Default for triaged work." }
    @{ n="priority:p3-low";      c="c2e0c6"; d="Polish / nice-to-have." }
    # status:*
    @{ n="status:needs-triage";  c="cfd3d7"; d="New, awaiting Jesse triage." }
    @{ n="status:needs-design";  c="d4c5f9"; d="Awaiting Sol/Vex design pass." }
    @{ n="status:needs-repro";   c="fbca04"; d="Bug not yet reproduced." }
    @{ n="status:blocked";       c="b60205"; d="Blocked on dependency." }
    @{ n="status:ready";         c="0e8a16"; d="Ready to pick up." }
    @{ n="status:in-progress";   c="1d76db"; d="Actively being worked." }
    @{ n="status:review";        c="6f42c1"; d="In code review." }
    @{ n="status:qa";            c="fef2c0"; d="In QA / verification." }
    # stream:*
    @{ n="stream:development";   c="bfd4f2"; d="Development stream. Targets development branch." }
    @{ n="stream:experimental";  c="79b8ff"; d="Experimental stream. Targets alpha branch." }
    @{ n="stream:stable";        c="0366d6"; d="Stable stream. Targets stable branch." }
    # meta
    @{ n="good-first-issue";     c="7057ff"; d="Beginner-friendly." }
    @{ n="help-wanted";          c="008672"; d="Outside contributors welcome." }
    @{ n="breaking-change";      c="b60205"; d="Save-incompatible or API-breaking." }
    @{ n="regression";           c="d93f0b"; d="Worked previously, broken now." }
    @{ n="flaky-test";           c="e99695"; d="Non-deterministic test." }
)

Write-Host "Syncing $($labels.Count) labels to $Repo ..." -ForegroundColor Cyan
foreach ($l in $labels) {
    Write-Host "  - $($l.n)" -ForegroundColor DarkGray
    gh label create $l.n --repo $Repo --color $l.c --description $l.d --force | Out-Null
}
Write-Host "Done. $($labels.Count) labels synced." -ForegroundColor Green
