# Wiki Staging Area

This folder stages content for the **GitHub Wiki** at
<https://github.com/ScottyVenable/Political-Ascent/wiki>.

GitHub does not materialize the `.wiki.git` repository until at least one
page has been saved through the web UI. This is a one-time manual step.

## One-time initialization

1. Sign in to GitHub.
2. Open <https://github.com/ScottyVenable/Political-Ascent/wiki/_new>.
3. Save any page (a single line is enough). This creates the wiki repo.

## Syncing content

After the wiki is initialized, run from the repository root:

```powershell
./scripts/push-wiki.ps1
```

The script clones the wiki repo into a temp folder, copies every
`*.md` file from `docs/wiki/` (except this `README.md`) into the wiki
root, commits with message `docs(wiki): sync from docs/wiki`, and
pushes to `origin`.

## Editing

- Edit pages here in `docs/wiki/*.md`.
- Cross-link using `[[Page Name]]` wiki syntax.
- No emoji. See [../guides/ICONS_AND_ASSETS.md](../guides/ICONS_AND_ASSETS.md).
- Keep pages concise; deep technical detail belongs in `docs/`.

## File list

- `Home.md` — landing page
- `Getting-Started.md` — setup and first run
- `Game-Systems.md` — index of system pages
- One page per system: `Character.md`, `Legislation.md`, `Congress.md`,
  `Population.md`, `Economy.md`, `Events.md`, `Cards.md`, `Quests.md`,
  `Skills.md`, `Achievements.md`
- `Scenarios.md` — scenario catalogue
- `Concept-Glossary.md` — in-game terms
- `Modding-Guide.md`, `Contributing.md`, `Release-Notes.md`
- `Design-Research.md`, `Road-Ahead.md`
- `_Sidebar.md`, `_Footer.md` — wiki navigation
