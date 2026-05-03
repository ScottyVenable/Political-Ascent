<#
.SYNOPSIS
    Create the M1–M8 milestones on ScottyVenable/Political-Ascent.

.DESCRIPTION
    Idempotent: tries to create each milestone; if one already exists with
    the same title, prints a notice and continues. Does not modify existing
    milestone state.

    Owner: Jesse. Mirrors .github/milestones.md.

.NOTES
    Run once after milestones.md is reviewed. Requires `gh` authenticated
    as a maintainer. Due dates are suggested offsets from "today" — adjust
    as needed before running, or leave them off.
#>

$ErrorActionPreference = "Stop"
$Repo  = "ScottyVenable/Political-Ascent"
$Today = Get-Date

function Get-DueIso([int]$WeeksFromNow) {
    return $Today.AddDays($WeeksFromNow * 7).ToString("yyyy-MM-ddT00:00:00Z")
}

$milestones = @(
    @{ t="M1 — Cloakroom — 0.2.0-alpha.1";     w=4;  d="Legislative overhaul. Gates: GDD §13.7.1 dev→exp. See ROADMAP.md §4 M1." }
    @{ t="M2 — Floor Manager — 0.3.0-alpha.1"; w=9;  d="Dialogue v1 + Faction foundation. Save schema v1→v2 migration. See ROADMAP.md §4 M2." }
    @{ t="M3 — Stump — 0.4.0-alpha.1";         w=14; d="Speech Composer + audience segments. See ROADMAP.md §4 M3." }
    @{ t="M4 — Ironclad — 0.5.0-alpha.1";      w=20; d="A11y + security + test/lint hardening. Closes Rook §13 gaps. See ROADMAP.md §4 M4." }
    @{ t="M5 — Lectern — 0.6.0-alpha.1";       w=26; d="Trait JSON + card flavour + i18n scaffolding. See ROADMAP.md §4 M5." }
    @{ t="M6 — Telemetry — 0.7.0-alpha.1";     w=32; d="Perf gates + CI maturity. Branch protection on alpha/stable. See ROADMAP.md §4 M6." }
    @{ t="M7 — Second Front — 0.8.0-alpha.1";  w=40; d="Cold War scenario. See ROADMAP.md §4 M7." }
    @{ t="M8 — Quorum — 1.0.0-rc.1";           w=48; d="First stable RC. Both columns of §13.7.1 fully green. See ROADMAP.md §4 M8." }
)

foreach ($m in $milestones) {
    $due = Get-DueIso $m.w
    Write-Host "Creating: $($m.t)  (due $due)" -ForegroundColor Cyan
    try {
        gh api -X POST "repos/$Repo/milestones" `
            -f "title=$($m.t)" `
            -f "state=open" `
            -f "description=$($m.d)" `
            -f "due_on=$due" | Out-Null
        Write-Host "  ok" -ForegroundColor Green
    } catch {
        Write-Host "  skipped (already exists or API error): $_" -ForegroundColor Yellow
    }
}

Write-Host "Done." -ForegroundColor Green
