#Requires -Version 5.1
<#
.SYNOPSIS
    Political Ascent - Developer & Player launcher.

.DESCRIPTION
    A stylised interactive launcher for Windows developers and players. Offers
    an arrow-key menu for the most common tasks (install, run, build, package)
    and a non-interactive mode via `-Task` for CI/scripting.

    This script is self-contained: it uses only built-in PowerShell 5.1
    cmdlets and the .NET console APIs for the menu UI. No modules are
    required. The colour palette matches the game (blue/red/gold on dark).

.PARAMETER Task
    Optional. If supplied, the launcher runs the named task non-interactively
    and exits. Valid tasks:
        install, dev, typecheck, test, test:watch, test:coverage,
        build:web, build:electron, build:win, build:android,
        build:android-release, electron:dev, clean, docs, preflight.

    Example:
        pwsh .\launcher.ps1 -Task build:win

.EXAMPLE
    .\launcher.ps1
    Opens the interactive menu.

.EXAMPLE
    .\launcher.ps1 -Task dev
    Starts the Vite dev server without showing the menu.

.NOTES
    Requires Node.js >= 20 and npm. Android tasks additionally require the
    Android SDK (ANDROID_HOME) and Java 17+. Electron packaging requires an
    NSIS toolchain (bundled via electron-builder).
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [ValidateSet(
        'install', 'dev', 'typecheck', 'test', 'test:watch', 'test:coverage',
        'build:web', 'build:electron', 'build:win', 'build:android',
        'build:android-release', 'electron:dev', 'clean', 'docs', 'preflight',
        'sync:drive'
    )]
    [string]$Task
)

# ---------------------------------------------------------------------------
# Theme
# ---------------------------------------------------------------------------
$Script:Theme = @{
    Gold    = 'Yellow'
    Blue    = 'Cyan'
    Red     = 'Red'
    Muted   = 'DarkGray'
    Text    = 'Gray'
    Success = 'Green'
    Warning = 'Yellow'
    Danger  = 'Red'
    Header  = 'White'
}

# Resolve repo root relative to this script so it works from any CWD.
$Script:RepoRoot = Split-Path -Parent $PSCommandPath

# ---------------------------------------------------------------------------
# UI helpers
# ---------------------------------------------------------------------------
function Write-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "  +----------------------------------------------------------+" -ForegroundColor $Theme.Muted
    Write-Host "  |                                                          |" -ForegroundColor $Theme.Muted
    Write-Host "  |      " -NoNewline -ForegroundColor $Theme.Muted
    Write-Host "P O L I T I C A L   A S C E N T" -NoNewline -ForegroundColor $Theme.Gold
    Write-Host "             |" -ForegroundColor $Theme.Muted
    Write-Host "  |      " -NoNewline -ForegroundColor $Theme.Muted
    Write-Host "an american career  -  turn-based politics" -NoNewline -ForegroundColor $Theme.Text
    Write-Host "  |" -ForegroundColor $Theme.Muted
    Write-Host "  |                                                          |" -ForegroundColor $Theme.Muted
    Write-Host "  +----------------------------------------------------------+" -ForegroundColor $Theme.Muted
    Write-Host ""
}

function Write-Panel {
    param(
        [Parameter(Mandatory)][string]$Title,
        [Parameter(Mandatory)][string]$Body,
        [ValidateSet('info', 'success', 'warning', 'danger')][string]$Tone = 'info'
    )
    $color = switch ($Tone) {
        'success' { $Theme.Success }
        'warning' { $Theme.Warning }
        'danger'  { $Theme.Danger }
        default   { $Theme.Blue }
    }
    Write-Host ""
    Write-Host " +- $Title " -ForegroundColor $color -NoNewline
    Write-Host ("-" * [Math]::Max(0, 55 - $Title.Length)) -ForegroundColor $color
    foreach ($line in $Body -split "`n") {
        Write-Host " | " -ForegroundColor $color -NoNewline
        Write-Host $line -ForegroundColor $Theme.Text
    }
    Write-Host " +$("-" * 58)" -ForegroundColor $color
    Write-Host ""
}

function Show-Section {
    param([Parameter(Mandatory)][string]$Title)
    Write-Host ""
    Write-Host " -- " -NoNewline -ForegroundColor $Theme.Muted
    Write-Host $Title -NoNewline -ForegroundColor $Theme.Gold
    Write-Host " $("-" * [Math]::Max(0, 50 - $Title.Length))" -ForegroundColor $Theme.Muted
}

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------
function Test-Preflight {
    Show-Section "Pre-flight checks"
    $results = @()

    # Node
    try {
        $node = & node --version 2>$null
        $ok = $LASTEXITCODE -eq 0 -and $node -match 'v(\d+)' -and [int]$matches[1] -ge 20
        $results += [pscustomobject]@{ Label = 'Node.js >= 20'; OK = $ok; Detail = $node }
    } catch {
        $results += [pscustomobject]@{ Label = 'Node.js >= 20'; OK = $false; Detail = 'not found' }
    }

    # npm
    try {
        $npm = & npm --version 2>$null
        $results += [pscustomobject]@{ Label = 'npm'; OK = ($LASTEXITCODE -eq 0); Detail = $npm }
    } catch {
        $results += [pscustomobject]@{ Label = 'npm'; OK = $false; Detail = 'not found' }
    }

    # Java (optional - only for Android)
    try {
        # Capture the native command result before piping, otherwise Windows
        # PowerShell can report a misleading exit status after Select-Object.
        $javaOutput = & java -version 2>&1
        $javaOk = $LASTEXITCODE -eq 0
        $javaVer = $javaOutput | Select-Object -First 1
        $results += [pscustomobject]@{ Label = 'Java (for Android)'; OK = $javaOk; Detail = $javaVer }
    } catch {
        $results += [pscustomobject]@{ Label = 'Java (for Android)'; OK = $false; Detail = 'not found (optional)' }
    }

    # ANDROID_HOME (optional - only for Android)
    $androidHome = $env:ANDROID_HOME
    $results += [pscustomobject]@{
        Label  = 'ANDROID_HOME (for Android)'
        OK     = [bool]$androidHome -and (Test-Path $androidHome)
        Detail = if ($androidHome) { $androidHome } else { 'unset (optional)' }
    }

    # node_modules present?
    $hasModules = Test-Path (Join-Path $Script:RepoRoot 'node_modules')
    $results += [pscustomobject]@{
        Label = 'node_modules installed'
        OK    = $hasModules
        Detail = if ($hasModules) { 'present' } else { "run '.\launcher.ps1 -Task install' first" }
    }

    foreach ($r in $results) {
        $mark = if ($r.OK) { '[OK]' } else { '[X]' }
        $color = if ($r.OK) { $Theme.Success } else { $Theme.Danger }
        Write-Host "   $mark " -ForegroundColor $color -NoNewline
        Write-Host $r.Label.PadRight(28) -ForegroundColor $Theme.Text -NoNewline
        Write-Host "  $($r.Detail)" -ForegroundColor $Theme.Muted
    }
    Write-Host ""

    return ($results | Where-Object { -not $_.OK -and $_.Label -notmatch 'optional|Android' }).Count -eq 0
}

# ---------------------------------------------------------------------------
# Command runner with a heartbeat
# ---------------------------------------------------------------------------
function Invoke-LaunchCommand {
    param(
        [Parameter(Mandatory)][string]$Label,
        [Parameter(Mandatory)][string[]]$Command
    )
    Show-Section $Label
    Write-Host "   > $($Command -join ' ')" -ForegroundColor $Theme.Muted
    Write-Host ""

    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $commandName = $Command[0]
    $commandArgs = @($Command | Select-Object -Skip 1)

    Push-Location $Script:RepoRoot
    try {
        # npm and npx are .cmd shims on Windows. Invoking them directly with
        # PowerShell's call operator can corrupt the command name/arguments and
        # yield false exit-code 1 failures (for example, "Unknown command: pm").
        if ($env:OS -eq 'Windows_NT' -and $commandName -in @('npm', 'npx')) {
            & cmd /c $commandName @commandArgs
        } else {
            & $commandName @commandArgs
        }
        $exit = $LASTEXITCODE
    } finally {
        Pop-Location
    }

    $sw.Stop()
    $duration = "{0:N1}s" -f $sw.Elapsed.TotalSeconds
    if ($exit -eq 0) {
        Write-Panel -Title "Done - $duration" -Tone 'success' -Body "$Label completed successfully."
    } else {
        Write-Panel -Title "Failed - $duration" -Tone 'danger' -Body "$Label exited with code $exit."
    }
    return $exit
}

# ---------------------------------------------------------------------------
# Task definitions
# ---------------------------------------------------------------------------
$Script:Tasks = [ordered]@{
    'install'             = @{ Label = 'Install dependencies';                   Command = @('npm', 'install') }
    'dev'                 = @{ Label = 'Run Vite dev server (web)';              Command = @('npm', 'run', 'dev') }
    'typecheck'           = @{ Label = 'Type-check';                             Command = @('npm', 'run', 'typecheck') }
    'test'                = @{ Label = 'Run tests (single pass)';                Command = @('npm', 'test') }
    'test:watch'          = @{ Label = 'Run tests in watch mode';                Command = @('npm', 'run', 'test:watch') }
    'test:coverage'       = @{ Label = 'Run tests with coverage';                Command = @('npm', 'run', 'test:coverage') }
    'build:web'           = @{ Label = 'Build web bundle';                       Command = @('npm', 'run', 'build:web') }
    'electron:dev'        = @{ Label = 'Run Electron (dev)';                     Command = @('npm', 'run', 'dev:electron') }
    'build:electron'      = @{ Label = 'Package Electron app';                   Command = @('npm', 'run', 'build:electron') }
    'build:win'           = @{ Label = 'Package Windows installer (NSIS)';       Command = @('npm', 'run', 'build:win') }
    'build:android'       = @{ Label = 'Build Android debug APK';                Command = @('npm', 'run', 'android:build') }
    'build:android-release' = @{ Label = 'Build Android release APK';            Command = @('npm', 'run', 'android:release') }
}

function Invoke-Clean {
    Show-Section 'Clean build artefacts'
    $targets = @('node_modules', 'dist', 'dist-electron', 'bin', 'coverage', 'android/app/build', 'android/build', '.vite')
    foreach ($t in $targets) {
        $p = Join-Path $Script:RepoRoot $t
        if (Test-Path $p) {
            Write-Host "   removing $t" -ForegroundColor $Theme.Muted
            Remove-Item -Recurse -Force $p -ErrorAction SilentlyContinue
        }
    }
    Write-Panel -Title 'Clean complete' -Tone 'success' -Body 'All build artefacts removed.'
}

function Invoke-Docs {
    $docsPath = Join-Path $Script:RepoRoot 'docs'
    if (Test-Path $docsPath) {
        Start-Process explorer.exe -ArgumentList $docsPath
        Write-Panel -Title 'Docs' -Tone 'info' -Body "Opened $docsPath"
    } else {
        Write-Panel -Title 'Docs' -Tone 'warning' -Body 'docs/ folder not found.'
    }
}

# ---------------------------------------------------------------------------
# Non-interactive dispatcher
# ---------------------------------------------------------------------------
function Invoke-SyncDrive {
    # Delegates to the standalone scripts/sync-drive.ps1 so the logic
    # can be invoked outside the launcher (CI, scheduled tasks, etc.).
    $script = Join-Path $Script:RepoRoot 'scripts/sync-drive.ps1'
    if (-not (Test-Path $script)) {
        Write-Panel -Title 'Sync with Drive' -Tone 'danger' -Body "Missing helper: $script"
        return 1
    }
    Write-Panel -Title 'Sync with Drive' -Tone 'info' -Body 'Mirroring repo to Google Drive backup folder...'
    # Run in the current host (Windows PowerShell 5.1 or PowerShell 7+).
    # Hard-coding `pwsh` made the task unusable on stock Windows where
    # only Windows PowerShell ships, even though that host is fully
    # capable of executing the script.
    & $script
    return $LASTEXITCODE
}

function Invoke-Task {
    param([Parameter(Mandatory)][string]$Name)
    switch ($Name) {
        'preflight'  { if (Test-Preflight) { return 0 } else { return 1 } }
        'clean'      { Invoke-Clean; return 0 }
        'docs'       { Invoke-Docs; return 0 }
        'sync:drive' { return (Invoke-SyncDrive) }
        default {
            if ($Script:Tasks.Contains($Name)) {
                $t = $Script:Tasks[$Name]
                return (Invoke-LaunchCommand -Label $t.Label -Command $t.Command)
            } else {
                Write-Panel -Title 'Unknown task' -Tone 'danger' -Body "No task named '$Name'."
                return 1
            }
        }
    }
}

# ---------------------------------------------------------------------------
# Interactive arrow-key menu
# ---------------------------------------------------------------------------
$Script:Menu = @(
    @{ Key = 'install';               Label = '1. Install dependencies' }
    @{ Key = 'preflight';             Label = '2. Pre-flight checks' }
    @{ Key = 'dev';                   Label = '3. Run dev server (web)' }
    @{ Key = 'typecheck';             Label = '4. Type-check' }
    @{ Key = '__tests';               Label = '5. Tests ...' }
    @{ Key = 'build:web';             Label = '6. Build web bundle' }
    @{ Key = 'electron:dev';          Label = '7. Run Electron (dev)' }
    @{ Key = 'build:electron';        Label = '8. Package Electron app' }
    @{ Key = 'build:win';             Label = '9. Package Windows installer' }
    @{ Key = 'build:android';         Label = '10. Build Android debug APK' }
    @{ Key = 'build:android-release'; Label = '11. Build Android release APK' }
    @{ Key = 'clean';                 Label = '12. Clean build artefacts' }
    @{ Key = 'docs';                  Label = '13. Open docs folder' }
    @{ Key = 'sync:drive';            Label = '14. Sync with Drive (backup to Google Drive)' }
    @{ Key = '__exit';                Label = '15. Exit' }
)

$Script:TestMenu = @(
    @{ Key = 'test';           Label = '1. Run tests (single pass)' }
    @{ Key = 'test:watch';     Label = '2. Run tests in watch mode' }
    @{ Key = 'test:coverage';  Label = '3. Run tests with coverage' }
    @{ Key = '__back';         Label = '4. Back' }
)

function Show-Menu {
    param(
        [Parameter(Mandatory)][array]$Items,
        [Parameter(Mandatory)][string]$Title
    )
    $selected = 0

    while ($true) {
        Write-Banner
        Show-Section $Title
        for ($i = 0; $i -lt $Items.Count; $i++) {
            if ($i -eq $selected) {
                Write-Host "  > " -ForegroundColor $Theme.Gold -NoNewline
                Write-Host $Items[$i].Label -ForegroundColor $Theme.Gold
            } else {
                Write-Host "    " -NoNewline
                Write-Host $Items[$i].Label -ForegroundColor $Theme.Text
            }
        }
        Write-Host ""
        Write-Host "   Up/Down navigate   Enter select   Esc/Q quit" -ForegroundColor $Theme.Muted

        $keyInfo = [System.Console]::ReadKey($true)
        switch ($keyInfo.Key) {
            'UpArrow'    { $selected = ($selected - 1 + $Items.Count) % $Items.Count }
            'DownArrow'  { $selected = ($selected + 1) % $Items.Count }
            'Enter'      { return $Items[$selected].Key }
            'Escape'     { return '__exit' }
            'Q'          { return '__exit' }
        }
    }
}

function Start-InteractiveLauncher {
    while ($true) {
        $choice = Show-Menu -Items $Script:Menu -Title 'Main menu'
        switch ($choice) {
            '__exit' { Write-Host ""; Write-Host "   Goodbye." -ForegroundColor $Theme.Muted; Write-Host ""; return }
            '__tests' {
                $t = Show-Menu -Items $Script:TestMenu -Title 'Tests'
                if ($t -ne '__back' -and $t -ne '__exit') {
                    Write-Banner
                    [void](Invoke-Task $t)
                    Write-Host "   Press any key to return..." -ForegroundColor $Theme.Muted
                    [void][System.Console]::ReadKey($true)
                }
            }
            default {
                Write-Banner
                [void](Invoke-Task $choice)
                Write-Host "   Press any key to return..." -ForegroundColor $Theme.Muted
                [void][System.Console]::ReadKey($true)
            }
        }
    }
}

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if ($Task) {
    Write-Banner
    exit (Invoke-Task $Task)
} else {
    Start-InteractiveLauncher
}
