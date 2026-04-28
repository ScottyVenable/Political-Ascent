<#
.SYNOPSIS
    Sync the Political Ascent codebase to a Google Drive folder.

.DESCRIPTION
    Mirrors the local repository to a backup folder on Google Drive,
    excluding noisy generated content (node_modules, dist, build,
    test-results, .git internals, OS junk). Uses robocopy in /MIR mode
    so deletions on the source are reflected at the destination.

    Closes docs/todo.md item 18. Implementation notes:
      - We never sync .git/ (the GitHub remote is the canonical version
        history; the Drive copy is for cross-device file access).
      - We never sync node_modules / dist / build / test-results /
        playwright-report / coverage — those are 100% reproducible
        from a fresh `npm install` and would explode the Drive quota.
      - robocopy's /MIR flips destination state to match source, so
        files removed locally also disappear from the backup.
      - Read-only attributes are stripped (/A-:R) so future runs can
        overwrite cleanly.

    The script is idempotent and safe to run repeatedly.

.PARAMETER Destination
    Drive folder to sync into. Defaults to the canonical user path
    "G:\My Drive\Entertainment\Game Development\Political Ascent".

.PARAMETER WhatIf
    Pass-through to robocopy in /L mode — lists what would be copied
    without writing anything.

.EXAMPLE
    .\scripts\sync-drive.ps1
    Mirrors the repo to the default Drive backup path.

.EXAMPLE
    .\scripts\sync-drive.ps1 -Destination "D:\Backups\PA"
    Mirrors to a custom path.
#>

[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [Parameter(Mandatory = $false)]
    [string]$Destination = "G:\My Drive\Entertainment\Game Development\Political Ascent"
)

$ErrorActionPreference = 'Stop'

# Resolve the repo root from the location of this script so the command
# works whether you call it from anywhere on disk.
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)

if (-not (Test-Path $RepoRoot -PathType Container)) {
    throw "Could not resolve repo root from script path: $PSCommandPath"
}

# Folders we never sync. Each entry is a directory name relative to the
# repo root that robocopy will skip via /XD.
$ExcludedDirs = @(
    'node_modules',
    '.git',
    'dist',
    'dist-electron',
    'build',
    'release',
    'test-results',
    'playwright-report',
    'coverage',
    '.vite',
    '.next',
    '.turbo',
    'android\app\build',
    'android\.gradle',
    'android\build',
    'android\capacitor-cordova-android-plugins\build'
)

# File patterns we never sync. /XF takes filenames or wildcards.
$ExcludedFiles = @(
    '*.log',
    '*.tsbuildinfo',
    '.DS_Store',
    'Thumbs.db'
)

# Make sure the destination drive is reachable before robocopy starts —
# robocopy's own error message for a missing drive is unhelpful.
$DestRoot = [System.IO.Path]::GetPathRoot($Destination)
if (-not (Test-Path $DestRoot)) {
    throw "Destination drive not available: $DestRoot. Is Google Drive mounted?"
}

# Ensure the destination folder exists. robocopy can create it but we
# prefer an explicit, fail-fast guard.
if (-not (Test-Path $Destination)) {
    if ($PSCmdlet.ShouldProcess($Destination, 'Create destination folder')) {
        New-Item -ItemType Directory -Path $Destination -Force | Out-Null
    }
}

Write-Host ""
Write-Host "Syncing repo -> Drive" -ForegroundColor Cyan
Write-Host "  Source     : $RepoRoot"
Write-Host "  Destination: $Destination"
Write-Host ""

# Build the robocopy argument list.
#   /MIR   mirror (copy + purge)
#   /R:1   retry once on transient failures (Drive sync conflicts)
#   /W:2   two-second wait between retries
#   /NFL   no per-file listing (keeps output readable)
#   /NDL   no per-directory listing
#   /NP    no progress percentages (terminal-friendly)
#   /A-:R  strip read-only attribute on destination so re-runs work
$RoboArgs = @(
    "$RepoRoot",
    "$Destination",
    '/MIR',
    '/R:1',
    '/W:2',
    '/NFL',
    '/NDL',
    '/NP',
    '/A-:R'
)

if ($ExcludedDirs.Count -gt 0) {
    $RoboArgs += '/XD'
    foreach ($d in $ExcludedDirs) {
        $RoboArgs += (Join-Path $RepoRoot $d)
    }
}

if ($ExcludedFiles.Count -gt 0) {
    $RoboArgs += '/XF'
    foreach ($f in $ExcludedFiles) {
        $RoboArgs += $f
    }
}

# WhatIf -> robocopy /L (list only, do not copy).
if ($WhatIfPreference) {
    $RoboArgs += '/L'
    Write-Host "(WhatIf: dry run — robocopy will only list pending changes.)" -ForegroundColor Yellow
    Write-Host ""
}

& robocopy @RoboArgs
$Code = $LASTEXITCODE

# robocopy exit codes are bitfields:
#   0   No files copied. No mismatch.
#   1   Files copied successfully.
#   2   Extra files/dirs detected (informational).
#   3   1 + 2.
#   4   Mismatched files/dirs (informational).
#   8+  At least one failure occurred.
# Anything <= 7 is a success.
if ($Code -le 7) {
    Write-Host ""
    Write-Host "Sync complete. (robocopy code $Code)" -ForegroundColor Green
    exit 0
} else {
    Write-Host ""
    Write-Host "Sync failed. (robocopy code $Code)" -ForegroundColor Red
    exit $Code
}
