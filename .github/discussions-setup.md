# Discussions Setup

Owner: Jesse. This document defines the canonical Discussions configuration for
the `Political-Ascent` repo: categories, pinned posts, moderation policy, and
the manual + scripted setup steps. Treat this as the source of truth — if the
live Discussions tab disagrees with this file, fix the tab, not the file.

---

## (1) Categories

Nine categories. Format column uses GitHub's three discussion formats:
**Discussion** (open-ended thread), **Announcement** (only maintainers can
post; community replies), **Q&A** (questions with a marked answer).

| Emoji | Name                | Format        | One-liner                                                                 |
| ----- | ------------------- | ------------- | ------------------------------------------------------------------------- |
| 📣    | Announcements       | Announcement  | Maintainer-only posts: releases, milestones, policy updates.              |
| 💡    | Ideas               | Discussion    | Suggest features, mechanics, content. Triaged into Issues by Jesse.       |
| ❓    | Q&A                 | Q&A           | Ask how to play, build, or contribute. Mark a reply as the answer.        |
| 🎬    | Show & Tell         | Discussion    | Share runs, screenshots, mods, fan content.                               |
| 🧪    | Playtesting Feedback| Discussion    | Structured feedback on builds, scenarios, balance.                        |
| 🧰    | Modding             | Discussion    | Authoring help: cards, dialogue, scenarios, scripts.                      |
| 📜    | Lore & Tone         | Discussion    | Worldbuilding, voice, characterization questions.                         |
| 🐞    | Bug Reports         | Announcement  | **Pinned + locked.** Single redirect post pointing users to Issues.       |
| 💬    | General             | Discussion    | Off-topic-but-adjacent chatter that doesn't fit elsewhere.                |

Notes:
- "Bug Reports" is intentionally an Announcement category with a single
  locked pinned post. Bugs belong in Issues so they hit the project board;
  Discussions are not triaged the same way.
- Q&A is the only category where "answered" semantics are enforced. Use it.

---

## (2) Pinned posts

Five posts, one per high-traffic category. Paste-ready titles and bodies
below. Pin in the GitHub web UI after creation (pinning is web-UI-only — see
§5). Sign each as `— Jesse` so authorship is consistent.

### 2.1 Announcements — "Welcome to Political Ascent Discussions"

**Title:** Welcome to Political Ascent Discussions

**Body:**
```
Welcome. This is the community space for Political Ascent.

Use the category list on the left to find the right place to post:
- 💡 Ideas — feature suggestions
- ❓ Q&A — questions with an answer you can mark
- 🧪 Playtesting Feedback — structured feedback on builds
- 🧰 Modding — authoring help
- 📜 Lore & Tone — world and voice questions
- 🎬 Show & Tell — share what you've made or played

Bugs go in Issues, not here. See the pinned post in 🐞 Bug Reports.

Read CONTRIBUTING.md and CODE_OF_CONDUCT.md before your first post.

— Jesse
```

### 2.2 Ideas — "How to post an idea"

**Title:** How to post an idea (read first)

**Body:**
```
Before posting, please:

1. Skim the Roadmap so you know what's already planned:
   docs/ROADMAP.md
2. Search existing Ideas threads — duplicates get merged.
3. If your idea is concrete and scoped, consider opening an Issue
   directly using the Feature template:
   .github/ISSUE_TEMPLATE/feature.yml

Good idea posts include:
- The player problem you're solving (not just the mechanic).
- One paragraph on how it interacts with existing systems.
- Optional: a sketch of UI or numbers.

Promising ideas get triaged into Issues by Jesse and linked back here.

— Jesse
```

### 2.3 Q&A — "Read this before asking"

**Title:** Read this before asking

**Body:**
```
Most first-time questions are answered in two places:

- FAQ wiki page: [[FAQ]]
- Getting Started wiki page: [[Getting-Started]]

If those don't cover it:
1. Search Q&A for your question.
2. Post a new question with: what you tried, what you expected,
   what happened. Include build version and OS.
3. When someone answers, mark the reply as the answer so the next
   person finds it fast.

— Jesse
```

### 2.4 Modding — "Modding index"

**Title:** Modding index — start here

**Body:**
```
Authoring guides live in the wiki. Start with the page that matches
what you want to make:

- [[Authoring-Cards]]      — card definitions and effects
- [[Authoring-Dialogue]]   — dialogue trees and tokens
- [[Authoring-Scenarios]]  — scenario configuration

Reference pages:
- [[Cards]], [[Dialogue]], [[Scenarios]], [[Concept-Glossary]]

Post questions, share mods, or request authoring features in this
category. Bug reports against the authoring tools go in Issues.

— Jesse
```

### 2.5 Lore & Tone — "Voice and tone primer"

**Title:** Voice and tone primer

**Body:**
```
Political Ascent has a deliberate voice. Before proposing lore,
characters, or copy, please read:

- [[Voice-and-Tone]]                — wiki primer
- GDD §12.1 (Tone & Boundaries)
- GDD §12.2 (Characterization Rules)

Two recurring asks:
- We do not satirize real living politicians by name.
- We do not editorialize on contested real-world policy outcomes.

Within those bounds, this is the place for worldbuilding talk:
fictional factions, regional flavor, archetype voice, etc.

— Jesse
```

---

## (3) Moderation policy

Six rules. Pin a condensed version of this list in the General category if
volume warrants it.

1. **Bugs go to Issues, not Discussions.** Bug Reports category is a locked
   redirect. Posts that look like bug reports elsewhere get moved or closed
   with a pointer to the Issue tracker.
2. **GDD §12.1 is binding.** Posts that satirize real living politicians by
   name, or that editorialize on contested real-world policy outcomes, will
   be edited or removed. This is a creative-direction rule, not a political
   one — it applies across the political spectrum.
3. **Code of Conduct applies everywhere.** See `.github/CODE_OF_CONDUCT.md`.
   Harassment, slurs, and personal attacks result in removal and, on repeat,
   a block.
4. **No low-effort or AI-spam posts.** Posts that are obviously generated
   without a human point of view get removed.
5. **Stay on-topic per category.** Off-topic posts get moved to General or
   closed. Repeated category misuse gets a warning.
6. **Maintainers may consolidate.** Duplicate Ideas threads get merged;
   resolved Q&A threads get marked answered; stale playtest threads get
   archived. This is housekeeping, not censorship.

---

## (4) Removing the existing first Discussion

GitHub seeds new repos with a default "👋 Welcome" discussion. Delete it
before pinning the new Announcements post so the category is clean.

Web UI click-path:

1. Go to `https://github.com/ScottyVenable/Political-Ascent/discussions`.
2. Click the existing welcome/first discussion entry to open it.
3. Click the **…** (kebab) menu in the top-right of the discussion.
4. Click **Delete discussion**.
5. Confirm in the modal dialog (type the title or click **Delete** depending
   on the current GitHub UI).

There is no GraphQL `deleteDiscussion` mutation exposed for non-admin tokens
in the standard schema, so this step is web-UI-only by design.

---

## (5) Setup commands

Documented for reference. Do not run blind — read each call first. None of
these create or modify pinned state; pinning is web-UI-only.

### 5.1 List existing categories (read-only)

```powershell
gh api graphql -f query='
  query($owner:String!, $repo:String!) {
    repository(owner:$owner, name:$repo) {
      id
      discussionCategories(first: 25) {
        nodes { id name slug emoji description }
      }
    }
  }
' -F owner=ScottyVenable -F repo=Political-Ascent
```

Capture the `repository.id` and each category `id` — both are required to
create discussions via GraphQL.

### 5.2 Create a discussion (per pinned post)

```powershell
gh api graphql -f query='
  mutation($repoId:ID!, $catId:ID!, $title:String!, $body:String!) {
    createDiscussion(input:{
      repositoryId: $repoId,
      categoryId:   $catId,
      title:        $title,
      body:         $body
    }) { discussion { id url number } }
  }
' -F repoId=<REPO_NODE_ID> -F catId=<CATEGORY_NODE_ID> `
  -F title='Welcome to Political Ascent Discussions' `
  -F body=@.github/discussions/announcements-welcome.md
```

`scripts/sync-discussions.ps1` wraps this in an idempotent loop over the
five pinned posts. Use the script rather than hand-running the mutation.

### 5.3 Category creation — web UI only

GitHub does not currently expose a stable GraphQL mutation for creating
discussion categories on non-Enterprise repos. Create the nine categories
in §1 manually:

1. `https://github.com/ScottyVenable/Political-Ascent/discussions` →
   gear icon → **Manage categories**.
2. **New category** for each row in §1. Set name, emoji, description, and
   format exactly as listed.
3. After all categories exist, run `scripts/sync-discussions.ps1` to seed
   the pinned posts, then pin them via the web UI per §2.

### 5.4 Pinning — web UI only

Pinning a discussion is a web-UI action: open the discussion → **…** menu →
**Pin discussion**. Up to 4 pins are visible at the top of the Discussions
tab; the rest are reachable via "View all pinned".

— Jesse
