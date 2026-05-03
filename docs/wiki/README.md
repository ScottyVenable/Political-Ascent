# Wiki Staging Area

This folder stages content for the **GitHub Wiki** at
<https://github.com/ScottyVenable/Political-Ascent/wiki>.

GitHub does not materialize the `.wiki.git` repository until at least one
page has been saved through the web UI. This is a one-time manual step.

---

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

**Note:** `Road-Ahead.md` is retained as a redirect stub pointing to `Roadmap.md`.
GitHub Wiki does not auto-redirect; the old URL continues to work as its own page.

---

## Information Architecture (v0.4-DRAFT)

The wiki is organised into five sections, reflected in `_Sidebar.md`:

| Section | Purpose |
|---|---|
| **Start Here** | Home, Getting-Started, FAQ |
| **Game Systems** | One page per system, plus cross-cutting mechanics |
| **Characters & Story** | Character, archetypes, dialogue, scenarios |
| **For Modders** | Modding-Guide, Save-Format, Authoring-* pages |
| **For Contributors** | Contributing, Design-Research, Concept-Glossary, Release-Notes, Roadmap |

---

## Status Block Convention

Every page must open with a status block immediately after the `# Title`:

```markdown
> **GDD reference:** §x.x
> **Implementation status:** Implemented | Partial | Designed | Stub
> **Last reviewed:** YYYY-MM-DD (Author, GDD version)
```

- **Implemented:** feature is live in the current build
- **Partial:** feature exists but not all described behaviour is shipped
- **Designed:** spec exists in GDD; not yet built
- **Stub:** placeholder page for a planned scenario or system

Update the `Last reviewed` date whenever you edit the page. Stale review dates are tracked.

---

## Voice and Tone Constraints

Wiki pages are **player-facing**. They are not internal design documentation.

- Write in the register established in `docs/GDD.md §12.1` (Tone Bible) and `§12.2` (Voice & Style Guide)
- Present-tense, declarative prose. Not "the system will allow you to" — "you can"
- Preferred terms: Political Capital, Action Points, Legislator, Bill stage, Faction, Leverage
- Banned: "influence points," "politician," "phase/status" (for bill), "approved/rejected" (for bill outcome)
- No emoji anywhere in wiki content
- Era-appropriate language in scenario pages; see `[[Voice-and-Tone]]`

---

## Editing

- Edit pages here in `docs/wiki/*.md`.
- Cross-link using `[[Page Name]]` wiki syntax.
- No emoji. See [../guides/ICONS_AND_ASSETS.md](../guides/ICONS_AND_ASSETS.md).
- Deep technical detail belongs in `docs/` not `docs/wiki/`.
- Add the status block when creating or substantially revising a page.

---

## File List (v0.4-DRAFT)

### Navigation
- `_Sidebar.md` — five-section navigation
- `_Footer.md` — wiki footer with links

### Start Here
- `Home.md` — landing page
- `Getting-Started.md` — setup and first session
- `FAQ.md` — common questions

### Game Systems
- `Game-Systems.md` — full system index
- `Legislation.md`, `Congress.md`, `Economy.md`, `Population.md`
- `Events.md`, `Cards.md`, `Quests.md`, `Achievements.md`
- `Factions.md`, `Influence-and-Reputation.md`
- `Dialogue.md`, `Speech-Composer.md`, `Time-and-Pacing.md`

### Characters & Story
- `Character.md`, `Skills.md`, `Archetypes.md`
- `Scenarios.md` — index
- `Scenario-Modern-America-2024.md` (full), plus eight stubs:
  `Scenario-Cold-War.md`, `Scenario-Civil-War-Reconstruction.md`,
  `Scenario-Gilded-Age.md`, `Scenario-Great-Depression.md`,
  `Scenario-World-War-I.md`, `Scenario-World-War-II.md`,
  `Scenario-War-on-Terror.md`, `Scenario-Founding-Era.md`
- `Voice-and-Tone.md`

### For Modders
- `Modding-Guide.md`, `Save-Format.md`
- `Authoring-Dialogue.md`, `Authoring-Cards.md`, `Authoring-Scenarios.md`

### For Contributors
- `Contributing.md`, `Design-Research.md`
- `Concept-Glossary.md`
- `Release-Notes.md`, `Roadmap.md`

### Redirect Stubs
- `Road-Ahead.md` → `[[Roadmap]]`
