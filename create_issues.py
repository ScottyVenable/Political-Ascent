import subprocess, re, sys

def run(args, input_data=None, timeout=60):
    try:
        if input_data is not None:
            r = subprocess.run(args, input=input_data, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8", timeout=timeout)
        else:
            r = subprocess.run(args, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8", timeout=timeout)
        return r.returncode, r.stdout, r.stderr
    except subprocess.TimeoutExpired as e:
        return 124, "", f"timeout: {e}"

REPO = "ScottyVenable/Political-Ascent"
OWNER = "ScottyVenable"
PROJECT = "6"

milestones = [
    ("exp--0.1--project-setup", "Initial project scaffolding: Vite, TS, Tailwind, ESLint, Prettier, Vitest, Playwright.", "area:ci", "type:chore", "P2"),
    ("exp--0.1--core-types", "Define core TS types, branded IDs, and JSON schemas.", "area:engine", "type:feature", "P2"),
    ("exp--0.1--app-shell", "Build main app shell with router and global layout.", "area:ui", "type:feature", "P2"),
    ("exp--0.1--character-system", "Character creation, traits, and background system.", "area:character", "type:feature", "P2"),
    ("exp--0.1--scenario-system", "Scenario loader and Modern America 2024 scenario.", "area:engine", "type:feature", "P2"),
    ("exp--0.1--time-system", "Deterministic clock, daily/weekly/monthly ticks.", "area:engine", "type:feature", "P2"),
    ("exp--0.1--action-system", "Player actions and Political Capital economy.", "area:engine", "type:feature", "P2"),
    ("exp--0.1--dashboard", "Primary dashboard with KPIs and headlines.", "area:ui", "type:feature", "P2"),
    ("exp--0.1--population-sim", "Population cohorts, mood, and radicalism drift.", "area:population", "type:feature", "P2"),
    ("exp--0.1--legislation-ui", "Bill drafting, committee flow, floor vote UI.", "area:legislation", "type:feature", "P2"),
    ("exp--0.1--congress-chamber", "Chamber rendering, whip actions, member pages.", "area:congress", "type:feature", "P2"),
    ("exp--0.1--event-system", "Event engine with conditions and choices.", "area:engine", "type:feature", "P2"),
    ("exp--0.1--card-system", "Card deck, draw, play, and discard rules.", "area:cards", "type:feature", "P2"),
    ("exp--0.1--quest-system", "Narrative quests with stages and rewards.", "area:quests", "type:feature", "P2"),
    ("exp--0.1--economy-dashboard", "Economic indicators dashboard.", "area:economy", "type:feature", "P2"),
    ("exp--0.1--skill-tree", "Skill tree progression and unlocks.", "area:skills", "type:feature", "P2"),
    ("exp--0.1--save-system", "Save/load with versioned JSON.", "area:save", "type:feature", "P2"),
    ("exp--0.1--achievements", "Achievement definitions and tracking.", "area:engine", "type:feature", "P2"),
    ("exp--0.1--polish", "Pre-0.1 polish: a11y, perf, screenshot regression pass.", "area:ui", "type:feature", "P2"),
]

extras = [
    ("Initialize GitHub Wiki with core pages", "Bootstrap the repository Wiki with core documentation pages covering design pillars, systems overview, contribution flow, and glossary.", ["type:docs", "area:docs", "priority:P1", "status:triage"]),
    ("Playwright screenshot baseline suite", "Establish a Playwright screenshot baseline suite to catch UI regressions across primary views and themes.", ["type:chore", "area:ci", "priority:P1", "status:triage"]),
    ("Docs bootstrap: AGENTS.md, ICONS_AND_ASSETS, research folder", "Create foundational documentation: AGENTS.md for agent guidance, ICONS_AND_ASSETS for asset conventions, and a research/ folder for design notes.", ["type:docs", "area:docs", "priority:P1", "status:triage"]),
]

ACCEPTANCE = {
    "project-setup": ["Vite + TypeScript project builds clean", "Tailwind, ESLint, Prettier configured", "Vitest unit test runs green", "Playwright e2e runs green in CI"],
    "core-types": ["Branded ID types defined", "JSON schemas checked into repo", "Schema validation utilities exported", "Unit tests cover type guards"],
    "app-shell": ["Router with top-level routes wired", "Global layout with nav and footer", "Responsive shell passes a11y smoke", "Shell covered by a Playwright test"],
    "character-system": ["Character creation flow implemented", "Traits applied to starting stats", "Backgrounds selectable with effects", "Persisted in save state"],
    "scenario-system": ["Scenario loader reads JSON", "Modern America 2024 scenario ships", "Scenario selectable at new game", "Covered by integration tests"],
    "time-system": ["Deterministic tick with seed", "Daily/weekly/monthly events fire", "Time controls in UI", "Unit tests verify determinism"],
    "action-system": ["Action registry with costs", "Political Capital economy balanced baseline", "Action UI with confirmation", "Tests cover cost/reward paths"],
    "dashboard": ["KPI tiles render live state", "Headlines feed updates on tick", "Keyboard navigable", "Screenshot baseline captured"],
    "population-sim": ["Cohort model implemented", "Mood updates on events", "Radicalism drift over time", "Deterministic and tested"],
    "legislation-ui": ["Bill drafting form", "Committee flow visualized", "Floor vote screen with tally", "E2E covers full bill path"],
    "congress-chamber": ["Chamber seating renders members", "Whip actions available", "Member detail pages", "Performance acceptable at 535 seats"],
    "event-system": ["Condition DSL evaluated", "Choices mutate state deterministically", "Authoring schema documented", "Unit tests for sample events"],
    "card-system": ["Deck, hand, discard piles modeled", "Draw/play/discard rules enforced", "UI for hand and play", "Tests cover edge cases"],
    "quest-system": ["Quest stages progress on triggers", "Rewards granted on completion", "Quest log UI", "Authoring schema documented"],
    "economy-dashboard": ["GDP, unemployment, inflation tiles", "Time-series charts render", "Responsive layout", "Screenshot baseline captured"],
    "skill-tree": ["Tree data schema defined", "Unlock prerequisites enforced", "UI renders and is navigable", "Persisted in save"],
    "save-system": ["Versioned JSON save format", "Load validates and migrates", "Autosave hook on tick", "Tests cover round-trip"],
    "achievements": ["Achievement definitions in data", "Tracker updates on events", "UI list with progress", "Persisted across sessions"],
    "polish": ["a11y audit issues resolved", "Perf budget met on dashboard", "Screenshot regression pass green", "Release checklist satisfied"],
}

def acceptance(title):
    tl = title.lower()
    for k, v in ACCEPTANCE.items():
        if k in tl:
            return v
    if "wiki" in tl:
        return ["Home page created", "Systems overview page created", "Contribution guide page", "Glossary page"]
    if "screenshot baseline" in tl:
        return ["Baseline captured for primary views", "CI job runs Playwright snapshots", "Diff artifacts uploaded on failure", "Docs describe update workflow"]
    if "docs bootstrap" in tl:
        return ["AGENTS.md committed", "ICONS_AND_ASSETS.md committed", "research/ folder with README", "Links added to repo README"]
    return ["Scope agreed", "Implementation merged", "Tests added", "Docs updated"]

def build_body(scope, title):
    bullets = acceptance(title)
    return scope.strip() + "\n\nDone when:\n" + "\n".join(f"- [ ] {b}" for b in bullets) + "\n"

# Get existing issue titles to skip duplicates
code, out, err = run(["gh", "issue", "list", "--repo", REPO, "--limit", "200", "--state", "all", "--json", "number,title,url"])
import json as _json
existing = {i["title"]: i for i in _json.loads(out)} if code == 0 else {}

results = []

def create_issue(title, body, labels):
    if title in existing:
        return existing[title]["url"], int(existing[title]["number"]), True
    args = ["gh", "issue", "create", "--repo", REPO, "--title", title, "--body-file", "-"]
    for lb in labels:
        args += ["--label", lb]
    code, out, err = run(args, input_data=body)
    if code != 0:
        base = ["gh", "issue", "create", "--repo", REPO, "--title", title, "--body-file", "-"]
        code2, out2, err2 = run(base, input_data=body)
        if code2 != 0:
            print(f"FAILED {title}: {err2}", file=sys.stderr)
            return None, None, False
        url = out2.strip().splitlines()[-1].strip()
        m = re.search(r"/issues/(\d+)", url)
        num = int(m.group(1)) if m else None
        for lb in labels:
            run(["gh", "issue", "edit", str(num), "--repo", REPO, "--add-label", lb])
        return url, num, False
    url = out.strip().splitlines()[-1].strip()
    m = re.search(r"/issues/(\d+)", url)
    num = int(m.group(1)) if m else None
    return url, num, False

def add_to_project(url):
    code, out, err = run(["gh", "project", "item-add", PROJECT, "--owner", OWNER, "--url", url], timeout=45)
    if code != 0:
        print(f"  project add failed: {err[:200]}", file=sys.stderr)
    return code == 0

for title, scope, area, typ, prio in milestones:
    body = build_body(scope, title)
    labels = [typ, area, f"priority:{prio}", "status:triage"]
    url, num, was_existing = create_issue(title, body, labels)
    if url is None:
        results.append(("-", title, "ERROR", "no"))
        continue
    added = add_to_project(url)
    results.append((num, title, url, "yes" if added else "no"))
    print(f"{'Exists' if was_existing else 'Created'} #{num} {title} -> added={added}")

for title, scope, labels in extras:
    body = build_body(scope, title)
    url, num, was_existing = create_issue(title, body, labels)
    if url is None:
        results.append(("-", title, "ERROR", "no"))
        continue
    added = add_to_project(url)
    results.append((num, title, url, "yes" if added else "no"))
    print(f"{'Exists' if was_existing else 'Created'} #{num} {title} -> added={added}")

print("\n=== FINAL TABLE ===")
print(f"{'num':<5} | {'title':<60} | {'url':<65} | added")
print("-" * 150)
for num, title, url, added in results:
    print(f"{str(num):<5} | {title:<60} | {url:<65} | {added}")

