#requires -Version 7.0
<#
.SYNOPSIS
    Apply the issue unification plan to live GitHub issues.

.DESCRIPTION
    Reads .github/issue-unification-plan-*.json and applies title/body/label/
    milestone changes via `gh issue edit`. Idempotent: re-running on already-
    unified issues is a no-op.

    Owner: Jesse. Generated as part of the 2026-05-02 unification pass.

.PARAMETER PlanPath
    Path to the issue-unification-plan-YYYY-MM-DD.json file.

.PARAMETER Repo
    GitHub repo in owner/name form. Defaults to ScottyVenable/Political-Ascent.

.PARAMETER Only
    Operate only on the listed issue numbers. Mutually exclusive with -Skip.

.PARAMETER Skip
    Skip the listed issue numbers.

.PARAMETER WhatIf
    Standard ShouldProcess: print what would happen without calling gh.

.EXAMPLE
    pwsh -File scripts/apply-issue-unification.ps1 `
        -PlanPath .github/issue-unification-plan-2026-05-02.json -WhatIf

.EXAMPLE
    pwsh -File scripts/apply-issue-unification.ps1 `
        -PlanPath .github/issue-unification-plan-2026-05-02.json `
        -Only 107,108

.NOTES
    Pre-requisites:
      1. scripts/sync-labels.ps1 must have been run (label taxonomy current).
      2. scripts/sync-milestones.ps1 must have been run (M1-M8 exist).
      3. `gh auth status` shows an authenticated user with repo + project scope.
#>
[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'High')]
param(
    [Parameter(Mandatory = $true)]
    [string] $PlanPath,

    [string] $Repo = 'ScottyVenable/Political-Ascent',

    [int[]] $Only,

    [int[]] $Skip
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

$logDir = Join-Path (Split-Path $PSScriptRoot -Parent) '.github\team\audits\issue-unification-logs'
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Force -Path $logDir -WhatIf:$false | Out-Null }
$logFile = Join-Path $logDir ("apply-{0}.log" -f (Get-Date -Format 'yyyy-MM-dd-HHmmss'))

function Write-Log {
    param([string] $Message, [string] $Level = 'INFO')
    $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $line = "[$ts] [$Level] $Message"
    Add-Content -Path $logFile -Value $line -WhatIf:$false
    switch ($Level) {
        'ERROR' { Write-Host $line -ForegroundColor Red }
        'WARN'  { Write-Host $line -ForegroundColor Yellow }
        'DRY'   { Write-Host $line -ForegroundColor Cyan }
        default { Write-Host $line }
    }
}

# ---------------------------------------------------------------------------
# Body templates
# ---------------------------------------------------------------------------

$ROADMAP_LINK = '[ROADMAP.md](../docs/ROADMAP.md)'
$GDD_LINK     = '[GDD.md](../docs/GDD.md)'

function Format-AcceptanceList {
    param([string[]] $Items)
    if ($null -eq $Items -or $Items.Count -eq 0) { return '- [ ] _N/A — see Technical notes._' }
    return ($Items | ForEach-Object { "- [ ] $_" }) -join "`n"
}

function Format-DependencyList {
    param([int[]] $Numbers)
    if ($null -eq $Numbers -or $Numbers.Count -eq 0) { return 'none' }
    return (($Numbers | ForEach-Object { "#$_" }) -join ', ')
}

function Get-MilestoneLabelFromList {
    param([string[]] $Labels)
    foreach ($l in $Labels) { if ($l -like 'milestone:*') { return $l } }
    return 'milestone:unscheduled'
}

function Get-MilestoneCodename {
    param([string] $Label)
    switch ($Label) {
        'milestone:m1-cloakroom'      { return 'M1 Cloakroom' }
        'milestone:m2-floor-manager'  { return 'M2 Floor Manager' }
        'milestone:m3-stump'          { return 'M3 Stump' }
        'milestone:m4-ironclad'       { return 'M4 Ironclad' }
        'milestone:m5-lectern'        { return 'M5 Lectern' }
        'milestone:m6-telemetry'      { return 'M6 Telemetry' }
        'milestone:m7-second-front'   { return 'M7 Second Front' }
        'milestone:m8-quorum'         { return 'M8 Quorum' }
        default                       { return 'Unscheduled' }
    }
}

function New-IssueBody {
    <#
    Compose a templated body from a plan item.
    Sections vary by body_kind. preserve_original=true appends the prior body.
    #>
    param(
        [Parameter(Mandatory)] $Item,
        [string] $OriginalBody = ''
    )

    $kind        = $Item.body_kind
    $summary     = $Item.body_summary
    $acceptance  = Format-AcceptanceList -Items $Item.acceptance
    $contextNote = if ($Item.PSObject.Properties['context_notes']) { $Item.context_notes } else { 'See `.github/seed-issues.md` for the source-of-truth backlog.' }
    $milestone   = Get-MilestoneCodename -Label (Get-MilestoneLabelFromList -Labels $Item.labels_add)
    $oosNote     = if ($Item.PSObject.Properties['out_of_scope']) { $Item.out_of_scope } else { 'Anything outside the acceptance criteria above. File follow-up issues for adjacent work.' }

    $context = @"
- GDD: see $GDD_LINK §-references in Technical notes
- Roadmap: $milestone — $ROADMAP_LINK
- Dependencies: none
- Source: $contextNote
"@

    $technical = if ($Item.PSObject.Properties['technical_notes']) { $Item.technical_notes } else { 'See file pointers and design-doc links in the Source line above.' }

    $body = switch ($kind) {
        'bug' {
@"
## Summary

$summary

## Reproduction

See ``## Original report`` below for the original repro steps; the unification pass preserves them verbatim.

## Expected behaviour

The acceptance criteria below describe the expected resolution.

## Actual behaviour

See ``## Original report`` below.

## Context

$context

## Acceptance criteria

$acceptance

## Technical notes

$technical

## Out of scope

$oosNote
"@
        }
        'research' {
@"
## Summary

$summary

## Question

What is the right scope and authoring contract? Produce the deliverable below before any implementation work.

## Context

$context

## Deliverable

A design report under ``docs/research/`` plus follow-up implementation sub-issues if warranted.

## Acceptance criteria

$acceptance

## Out of scope

$oosNote
"@
        }
        default {
@"
## Summary

$summary

## Context

$context

## Acceptance criteria

$acceptance

## Technical notes

$technical

## Out of scope

$oosNote
"@
        }
    }

    if ($Item.PSObject.Properties['preserve_original'] -and $Item.preserve_original -and $OriginalBody) {
        $body += "`n`n---`n`n## Original report`n`n> Preserved verbatim from issue body prior to the 2026-05-02 unification pass.`n`n"
        $body += ($OriginalBody -split "`n" | ForEach-Object { "> $_" }) -join "`n"
    }

    # Preserve any pre-existing ## Sub-issues block
    $subIssuesMatch = [regex]::Match($OriginalBody, '(?ms)^##\s+Sub-issues\s*\r?\n(.+?)(?=^##\s|\z)')
    if ($subIssuesMatch.Success) {
        $body += "`n`n## Sub-issues`n`n" + $subIssuesMatch.Groups[1].Value.TrimEnd()
    }

    return $body
}

# ---------------------------------------------------------------------------
# Idempotency check
# ---------------------------------------------------------------------------

function Test-AlreadyConforms {
    param(
        [Parameter(Mandatory)] $LiveIssue,
        [Parameter(Mandatory)] $Item
    )
    if ($LiveIssue.title -ne $Item.new_title) { return $false }

    $required = @('## Summary','## Context','## Acceptance criteria','## Out of scope')
    foreach ($r in $required) {
        if (-not ($LiveIssue.body -like "*$r*")) { return $false }
    }

    $liveLabels = @($LiveIssue.labels | ForEach-Object { $_.name })
    foreach ($l in $Item.labels_add) {
        if ($liveLabels -notcontains $l) { return $false }
    }
    return $true
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if (-not (Test-Path $PlanPath)) {
    Write-Log "Plan file not found: $PlanPath" 'ERROR'
    exit 1
}

if ($Only -and $Skip) {
    Write-Log "-Only and -Skip are mutually exclusive." 'ERROR'
    exit 1
}

Write-Log "Loading plan: $PlanPath"
$plan = Get-Content $PlanPath -Raw | ConvertFrom-Json
Write-Log ("Plan version {0}, generated {1}, {2} items." -f $plan.version, $plan.generated, $plan.items.Count)

# Verify gh is available
$ghVersion = (& gh --version 2>$null | Select-Object -First 1)
if (-not $ghVersion) { Write-Log 'gh CLI not found on PATH.' 'ERROR'; exit 1 }
Write-Log "gh: $ghVersion"

$dryRun = $WhatIfPreference

$summary = [ordered]@{
    total      = 0
    skipped    = 0
    conformed  = 0
    edited     = 0
    failed     = 0
}

foreach ($item in $plan.items) {
    $n = [int] $item.number
    $summary.total++

    if ($Only -and ($Only -notcontains $n)) { $summary.skipped++; continue }
    if ($Skip -and ($Skip  -contains $n)) { $summary.skipped++; continue }

    Write-Log ("--- #{0} ({1}) ---" -f $n, $item.classification)

    # Re-fetch live issue
    try {
        $liveJson = & gh issue view $n --repo $Repo --json number,title,body,labels,milestone,state 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Log ("Failed to fetch #{0}: {1}" -f $n, ($liveJson -join ' ')) 'ERROR'
            $summary.failed++
            continue
        }
        $live = $liveJson | ConvertFrom-Json
    } catch {
        Write-Log ("Exception fetching #{0}: {1}" -f $n, $_.Exception.Message) 'ERROR'
        $summary.failed++
        continue
    }

    if ($live.state -ne 'OPEN') {
        Write-Log ("#{0} is {1}; skipping per policy (do not edit closed issues)." -f $n, $live.state) 'WARN'
        $summary.skipped++
        continue
    }

    if (Test-AlreadyConforms -LiveIssue $live -Item $item) {
        Write-Log ("#{0} already conforms; skipping." -f $n)
        $summary.conformed++
        continue
    }

    # Compute new body
    $newBody  = New-IssueBody -Item $item -OriginalBody $live.body
    $newTitle = $item.new_title
    $milestoneTitle = if ($item.PSObject.Properties['milestone']) { $item.milestone } else { 'Unscheduled' }

    # Compute label diff against live state
    $liveLabels = @($live.labels | ForEach-Object { $_.name })
    $toAdd      = @($item.labels_add    | Where-Object { $_ -and ($liveLabels -notcontains $_) })
    $toRemove   = @($item.labels_remove | Where-Object { $_ -and ($liveLabels -contains $_) })

    $tmpFile = [System.IO.Path]::GetTempFileName()
    try {
        Set-Content -Path $tmpFile -Value $newBody -Encoding utf8 -WhatIf:$false

        $addList    = ($toAdd -join ',')
        $removeList = ($toRemove -join ',')
        $bodyBytes  = (Get-Item $tmpFile).Length
        $action = "Edit issue #${n}: '$($live.title)' -> '$newTitle' | +[$addList] -[$removeList] | milestone='$milestoneTitle' | body bytes=$bodyBytes"
        if (-not $PSCmdlet.ShouldProcess("issue #$n on $Repo", $action)) {
            Write-Log $action 'DRY'
            $summary.skipped++
            continue
        }

        $editArgs = @('issue','edit', $n, '--repo', $Repo,
                      '--title', $newTitle,
                      '--body-file', $tmpFile)
        if ($milestoneTitle) { $editArgs += @('--milestone', $milestoneTitle) }
        foreach ($l in $toAdd)    { $editArgs += @('--add-label', $l) }
        foreach ($l in $toRemove) { $editArgs += @('--remove-label', $l) }

        Write-Log ("gh " + ($editArgs -join ' '))
        $out = & gh @editArgs 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Log ("Edit failed for #{0}: {1}" -f $n, ($out -join ' ')) 'ERROR'
            $summary.failed++
        } else {
            Write-Log ("Edited #{0}." -f $n)
            $summary.edited++
        }
    } finally {
        Remove-Item -Force $tmpFile -ErrorAction SilentlyContinue
    }
}

Write-Log "----- summary -----"
$summary.GetEnumerator() | ForEach-Object { Write-Log ("{0,-10} {1}" -f $_.Key, $_.Value) }
Write-Log ("Log: {0}" -f $logFile)
