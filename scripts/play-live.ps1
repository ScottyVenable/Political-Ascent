<#
.SYNOPSIS
    Start the Political Ascent dev server and open the live-play Playwright harness.

.DESCRIPTION
    Convenience wrapper for the Lead Director. Launches `npm run dev` in a
    background job, waits for the Vite server to answer on http://localhost:5173,
    then runs the headed Playwright live-play harness (`tests/e2e/live/playground.spec.ts`).
    The Playwright Inspector opens paused on the game root with the page objects
    instantiated, ready for manual exploration or agent-driven control via the
    Playwright MCP server.

.PARAMETER Port
    Port the Vite dev server should bind. Default: 5173.

.PARAMETER NoDev
    Skip starting the dev server (useful if it's already running in another shell).

.EXAMPLE
    pwsh ./scripts/play-live.ps1
#>
[CmdletBinding()]
param(
    [int] $Port = 5173,
    [switch] $NoDev
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $repoRoot
try {
    $devJob = $null
    if (-not $NoDev) {
        Write-Host "Starting Vite dev server on port $Port ..." -ForegroundColor Cyan
        $devJob = Start-Job -Name 'pa-dev-server' -ScriptBlock {
            param($dir)
            Set-Location $dir
            & cmd /c npm run dev
        } -ArgumentList $repoRoot

        # Poll until the dev server answers or we give up.
        $deadline = (Get-Date).AddSeconds(60)
        while ((Get-Date) -lt $deadline) {
            try {
                $resp = Invoke-WebRequest -Uri "http://localhost:$Port" -UseBasicParsing -TimeoutSec 2
                if ($resp.StatusCode -eq 200) { break }
            } catch {
                Start-Sleep -Milliseconds 500
            }
        }

        $ok = $false
        try {
            $ok = (Invoke-WebRequest -Uri "http://localhost:$Port" -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200
        } catch { $ok = $false }

        if (-not $ok) {
            Write-Host "Dev server did not become ready on port $Port within 60s." -ForegroundColor Red
            if ($devJob) { Stop-Job $devJob -ErrorAction SilentlyContinue | Out-Null; Remove-Job $devJob -ErrorAction SilentlyContinue | Out-Null }
            exit 1
        }
        Write-Host "Dev server ready." -ForegroundColor Green
    }

    Write-Host "Launching Playwright live-play harness (headed, paused) ..." -ForegroundColor Cyan
    & cmd /c npx playwright test tests/e2e/live/playground.spec.ts --headed --project=chromium-1440x900

    $exitCode = $LASTEXITCODE
    if ($devJob) {
        Write-Host "Stopping dev server ..." -ForegroundColor Cyan
        Stop-Job $devJob -ErrorAction SilentlyContinue | Out-Null
        Remove-Job $devJob -ErrorAction SilentlyContinue | Out-Null
    }
    exit $exitCode
}
finally {
    Pop-Location
}
