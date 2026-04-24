<#
.SYNOPSIS
    Sync docs/wiki/*.md to the GitHub Wiki for ScottyVenable/Political-Ascent.

.DESCRIPTION
    Clones (or pulls) the wiki git repo into a temp folder, copies every
    *.md file from docs/wiki/ (excluding README.md) into the wiki root,
    commits with message "docs(wiki): sync from docs/wiki", and pushes.

    If the wiki repo does not yet exist upstream, prints the manual
    one-time initialization URL and exits non-zero.

.NOTES
    Requires: git, and the current user to have push access to the repo.
#>

[CmdletBinding()]
param(
    [string]$Owner = 'ScottyVenable',
    [string]$Repo  = 'Political-Ascent'
)

$ErrorActionPreference = 'Stop'

# Resolve repo root (the script lives in scripts/, so its parent is the root).
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot   = Split-Path -Parent $ScriptRoot
$WikiSrc    = Join-Path $RepoRoot 'docs/wiki'

if (-not (Test-Path $WikiSrc)) {
    Write-Error "Source folder not found: $WikiSrc"
    exit 1
}

$WikiUrl    = "https://github.com/$Owner/$Repo.wiki.git"
$InitUrl    = "https://github.com/$Owner/$Repo/wiki/_new"
$WorkDir    = Join-Path $env:TEMP ("pa-wiki-" + [Guid]::NewGuid().ToString('N').Substring(0,8))

Write-Host "Wiki remote : $WikiUrl"
Write-Host "Work dir    : $WorkDir"

# Attempt to clone. If the wiki has never been initialized, the clone fails.
git clone $WikiUrl $WorkDir 2>&1 | Tee-Object -Variable cloneOutput | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Failed to clone the wiki repository."
    Write-Host ""
    Write-Host "The wiki has not been initialized yet. One-time manual step:"
    Write-Host "  1. Open $InitUrl"
    Write-Host "  2. Save any initial Home page (a single line is enough)."
    Write-Host "  3. Re-run this script."
    exit 2
}

# Copy docs/wiki/*.md (except README.md) into the wiki clone root.
Get-ChildItem -Path $WikiSrc -Filter '*.md' -File |
    Where-Object { $_.Name -ne 'README.md' } |
    ForEach-Object {
        $dest = Join-Path $WorkDir $_.Name
        Copy-Item -LiteralPath $_.FullName -Destination $dest -Force
        Write-Host "  copied $($_.Name)"
    }

Push-Location $WorkDir
try {
    git add -A | Out-Null

    # No-op safe: if nothing is staged, skip commit.
    git diff --cached --quiet
    if ($LASTEXITCODE -eq 0) {
        Write-Host "No changes to sync. Wiki is already up to date."
        exit 0
    }

    git commit -m 'docs(wiki): sync from docs/wiki' | Out-Null
    git push origin HEAD
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Push to wiki failed."
        exit 1
    }

    Write-Host ""
    Write-Host "Wiki synced successfully."
} finally {
    Pop-Location
    # Best-effort cleanup of the temp clone.
    try { Remove-Item -Recurse -Force $WorkDir -ErrorAction SilentlyContinue } catch {}
}
