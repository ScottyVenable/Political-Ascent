<#
.SYNOPSIS
    Idempotently seed pinned Discussions for the Political-Ascent repo.

.DESCRIPTION
    Resolves the repository node ID and discussion category IDs via the
    GitHub GraphQL API, then creates the five pinned posts defined in
    `.github/discussions-setup.md` if they do not already exist (matched
    by title within their target category).

    This script does NOT pin discussions, lock categories, or delete the
    legacy welcome discussion — those steps are web-UI-only and listed in
    the manual follow-up output at the end of the run.

.PARAMETER Owner
    GitHub repository owner. Defaults to ScottyVenable.

.PARAMETER Repo
    GitHub repository name. Defaults to Political-Ascent.

.PARAMETER BodyDir
    Directory containing pinned-post body files (Markdown). Defaults to
    `.github/discussions` relative to the repo root.

.NOTES
    Owner: Jesse. Read `.github/discussions-setup.md` before running.
    Requires `gh` CLI authenticated with `discussion:write` scope.
#>
[CmdletBinding(SupportsShouldProcess)]
param(
    [string] $Owner   = 'ScottyVenable',
    [string] $Repo    = 'Political-Ascent',
    [string] $BodyDir = '.github/discussions'
)

$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# 0. Pre-flight
# ---------------------------------------------------------------------------
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw "gh CLI not found on PATH. Install from https://cli.github.com/."
}

if (-not (Test-Path $BodyDir)) {
    Write-Warning "Body directory '$BodyDir' does not exist. Create it and add pinned-post Markdown files."
}

# ---------------------------------------------------------------------------
# 1. Resolve repository node ID + discussion categories
# ---------------------------------------------------------------------------
$listQuery = @'
query($owner:String!, $repo:String!) {
  repository(owner:$owner, name:$repo) {
    id
    discussionCategories(first: 25) {
      nodes { id name slug emoji }
    }
  }
}
'@

Write-Host "==> Resolving repo + categories for $Owner/$Repo" -ForegroundColor Cyan
$raw = gh api graphql -f query=$listQuery -F owner=$Owner -F repo=$Repo
if ($LASTEXITCODE -ne 0) { throw "gh api graphql failed while listing categories." }

$resp     = $raw | ConvertFrom-Json
$repoId   = $resp.data.repository.id
$catNodes = $resp.data.repository.discussionCategories.nodes

if (-not $repoId)   { throw "Repository node ID not returned. Check owner/repo and auth." }
if (-not $catNodes) { throw "No discussion categories returned. Create them via the web UI first (see .github/discussions-setup.md §5.3)." }

# Build name -> id map for category lookup
$catMap = @{}
foreach ($c in $catNodes) { $catMap[$c.name] = $c.id }

Write-Host "    Repo node ID: $repoId"
Write-Host "    Categories found: $($catNodes.Count)"

# ---------------------------------------------------------------------------
# 2. Pinned-post manifest
# ---------------------------------------------------------------------------
# TODO: fill category IDs after categories exist via web UI.
# Currently looked up by Name from the live API; if you need to hard-pin
# specific category node IDs, replace the CategoryId field below.
$pinned = @(
    [pscustomobject]@{
        Category   = 'Announcements'
        Title      = 'Welcome to Political Ascent Discussions'
        BodyFile   = Join-Path $BodyDir 'announcements-welcome.md'
        CategoryId = $null  # TODO: fill category IDs after categories exist via web UI
    },
    [pscustomobject]@{
        Category   = 'Ideas'
        Title      = 'How to post an idea (read first)'
        BodyFile   = Join-Path $BodyDir 'ideas-how-to-post.md'
        CategoryId = $null  # TODO: fill category IDs after categories exist via web UI
    },
    [pscustomobject]@{
        Category   = 'Q&A'
        Title      = 'Read this before asking'
        BodyFile   = Join-Path $BodyDir 'qa-read-first.md'
        CategoryId = $null  # TODO: fill category IDs after categories exist via web UI
    },
    [pscustomobject]@{
        Category   = 'Modding'
        Title      = 'Modding index — start here'
        BodyFile   = Join-Path $BodyDir 'modding-index.md'
        CategoryId = $null  # TODO: fill category IDs after categories exist via web UI
    },
    [pscustomobject]@{
        Category   = 'Lore & Tone'
        Title      = 'Voice and tone primer'
        BodyFile   = Join-Path $BodyDir 'lore-voice-and-tone.md'
        CategoryId = $null  # TODO: fill category IDs after categories exist via web UI
    }
)

# ---------------------------------------------------------------------------
# 3. Idempotent create loop
# ---------------------------------------------------------------------------
$createMutation = @'
mutation($repoId:ID!, $catId:ID!, $title:String!, $body:String!) {
  createDiscussion(input:{
    repositoryId: $repoId,
    categoryId:   $catId,
    title:        $title,
    body:         $body
  }) { discussion { id url number title } }
}
'@

$searchQuery = @'
query($q:String!) {
  search(type: DISCUSSION, query: $q, first: 5) {
    nodes { ... on Discussion { id title url category { name } } }
  }
}
'@

foreach ($p in $pinned) {
    Write-Host ""
    Write-Host "==> [$($p.Category)] $($p.Title)" -ForegroundColor Cyan

    $catId = if ($p.CategoryId) { $p.CategoryId } else { $catMap[$p.Category] }
    if (-not $catId) {
        Write-Warning "    Category '$($p.Category)' not found on repo. Create it via web UI, then re-run."
        continue
    }

    if (-not (Test-Path $p.BodyFile)) {
        Write-Warning "    Body file missing: $($p.BodyFile). Skipping."
        continue
    }

    # Idempotency check: search for an existing discussion with the same title.
    $q     = "repo:$Owner/$Repo in:title `"$($p.Title)`""
    $found = gh api graphql -f query=$searchQuery -F q=$q | ConvertFrom-Json
    $hit   = $found.data.search.nodes |
             Where-Object { $_.title -eq $p.Title -and $_.category.name -eq $p.Category } |
             Select-Object -First 1

    if ($hit) {
        Write-Host "    Already exists: $($hit.url)" -ForegroundColor Yellow
        continue
    }

    if (-not $PSCmdlet.ShouldProcess("$($p.Category) :: $($p.Title)", 'createDiscussion')) {
        continue
    }

    $body = Get-Content -Raw -LiteralPath $p.BodyFile
    $res  = gh api graphql -f query=$createMutation `
                -F repoId=$repoId -F catId=$catId `
                -F title=$($p.Title) -F body=$body | ConvertFrom-Json

    if ($res.data.createDiscussion.discussion.url) {
        Write-Host "    Created: $($res.data.createDiscussion.discussion.url)" -ForegroundColor Green
    } else {
        Write-Warning "    createDiscussion returned no URL. Response: $($res | ConvertTo-Json -Depth 6)"
    }
}

# ---------------------------------------------------------------------------
# 4. Manual follow-ups
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "==> Manual follow-ups (web UI only)" -ForegroundColor Cyan
Write-Host "    1. Pin each of the 5 created discussions:"
Write-Host "         open the discussion -> ... menu -> Pin discussion"
Write-Host "    2. Lock the 'Bug Reports' redirect post so users cannot reply:"
Write-Host "         open the discussion -> ... menu -> Lock conversation"
Write-Host "    3. Delete the legacy welcome discussion seeded by GitHub:"
Write-Host "         see .github/discussions-setup.md section (4) for the click-path"
Write-Host ""
Write-Host "Done." -ForegroundColor Green
