<#
.SYNOPSIS
    Create a GitHub issue for Political Ascent and add it to Project #6.

.DESCRIPTION
    Interactive + non-interactive wrapper around `gh issue create` that
    enforces the project's issue hygiene:
      - type label (bug | feature | docs | chore | ui-regression)
      - area label (engine, legislation, congress, ui, docs, ...)
      - priority label (p0 | p1 | p2 | p3)
      - auto-adds the new issue to Project board #6 (ScottyVenable/Political-Ascent)
      - sets Status field to "Backlog" on the project item

    Run without arguments for an interactive prompt. Pass any subset of
    arguments to skip those prompts. All arguments are optional.

.PARAMETER Title
    Short issue title. Required (prompted if omitted).

.PARAMETER Body
    Issue body (markdown). Multi-line supported. Prompted if omitted.

.PARAMETER Type
    One of: bug, feature, docs, chore, ui-regression.

.PARAMETER Area
    One of: engine, legislation, congress, population, economy, cards,
    quests, skills, ui, character, dialogue, save, settings, android,
    docs, ci, agents.

.PARAMETER Priority
    One of: p0, p1, p2, p3. Defaults to p2.

.PARAMETER Milestone
    Optional milestone title (e.g. "v0.1"). Skipped if omitted.

.PARAMETER NoProject
    Skip the auto-add to Project #6.

.EXAMPLE
    pwsh ./scripts/new-issue.ps1
    # Fully interactive.

.EXAMPLE
    pwsh ./scripts/new-issue.ps1 -Title "Bill drafting panel clips at 1280x720" `
        -Type ui-regression -Area ui -Priority p1

.NOTES
    Requires `gh` CLI authenticated with `project` scope.
#>
[CmdletBinding()]
param(
    [string] $Title,
    [string] $Body,
    [ValidateSet('bug', 'feature', 'docs', 'chore', 'ui-regression')]
    [string] $Type,
    [ValidateSet(
        'engine', 'legislation', 'congress', 'population', 'economy',
        'cards', 'quests', 'skills', 'ui', 'character', 'dialogue',
        'save', 'settings', 'android', 'docs', 'ci', 'agents'
    )]
    [string] $Area,
    [ValidateSet('p0', 'p1', 'p2', 'p3')]
    [string] $Priority,
    [string] $Milestone,
    [switch] $NoProject
)

$ErrorActionPreference = 'Stop'
$Repo = 'ScottyVenable/Political-Ascent'
$ProjectOwner = 'ScottyVenable'
$ProjectNumber = 6

function Read-Required {
    param([string] $Label, [string] $Current, [string[]] $AllowedValues)
    if ($Current) { return $Current }
    while ($true) {
        if ($AllowedValues) {
            $prompt = "$Label [$($AllowedValues -join '|')]"
        } else {
            $prompt = $Label
        }
        $value = Read-Host -Prompt $prompt
        if (-not $value) { continue }
        if ($AllowedValues -and ($AllowedValues -notcontains $value)) {
            Write-Host "  '$value' is not one of: $($AllowedValues -join ', ')" -ForegroundColor Yellow
            continue
        }
        return $value
    }
}

function Read-Multiline {
    param([string] $Label, [string] $Current)
    if ($Current) { return $Current }
    Write-Host "$Label (end with a single '.' on its own line):"
    $lines = New-Object System.Collections.Generic.List[string]
    while ($true) {
        $line = Read-Host
        if ($line -eq '.') { break }
        $lines.Add($line)
    }
    return ($lines -join [Environment]::NewLine)
}

# --- Gather fields -----------------------------------------------------------

$Title    = Read-Required -Label 'Title'    -Current $Title
$Type     = Read-Required -Label 'Type'     -Current $Type     -AllowedValues @('bug','feature','docs','chore','ui-regression')
$Area     = Read-Required -Label 'Area'     -Current $Area     -AllowedValues @('engine','legislation','congress','population','economy','cards','quests','skills','ui','character','dialogue','save','settings','android','docs','ci','agents')
if (-not $Priority) { $Priority = 'p2' }

if (-not $Body) {
    $Body = Read-Multiline -Label 'Body'
}
if (-not $Body) {
    $Body = "(no description provided)"
}

# --- Build label set ---------------------------------------------------------

$labels = @("type:$Type", "area:$Area", "priority:$Priority")

# --- Create the issue --------------------------------------------------------

Write-Host "`nCreating issue in $Repo ..." -ForegroundColor Cyan

$tempBody = New-TemporaryFile
Set-Content -Path $tempBody -Value $Body -Encoding UTF8

$ghArgs = @(
    'issue', 'create',
    '--repo', $Repo,
    '--title', $Title,
    '--body-file', $tempBody.FullName
)
foreach ($label in $labels) {
    $ghArgs += @('--label', $label)
}
if ($Milestone) {
    $ghArgs += @('--milestone', $Milestone)
}

$issueUrl = & gh @ghArgs
Remove-Item $tempBody -ErrorAction SilentlyContinue

if ($LASTEXITCODE -ne 0 -or -not $issueUrl) {
    Write-Host "gh issue create failed." -ForegroundColor Red
    exit 1
}
Write-Host "Created: $issueUrl" -ForegroundColor Green

# --- Add to project ----------------------------------------------------------

if (-not $NoProject) {
    Write-Host "Adding to Project #$ProjectNumber ..." -ForegroundColor Cyan
    & gh project item-add $ProjectNumber --owner $ProjectOwner --url $issueUrl | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Added to project." -ForegroundColor Green
    } else {
        Write-Host "Could not add to project (issue was still created)." -ForegroundColor Yellow
    }
}

Write-Host "`nDone: $issueUrl"
