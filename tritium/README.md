# Tritium

**A portable, multi-agent workflow package.**

Tritium is the coordination layer for an eight-member AI development crew (Bridge, Sol, Vex, Rook, Robert, Lux, Nova, Jesse). It ships as a self-contained directory you can drop into any repository or CLI environment, plus a local dashboard for live coordination.

- **Origin**: extracted from the [Political Ascent](https://github.com/ScottyVenable/Political-Ascent) repo
- **Version**: `0.1.0` (pre-release)
- **License**: see [LICENSE](LICENSE)
- **Status**: foundation complete; agent prompts derived from public team docs and should be reviewed by each agent owner before production use.

---

## What's in the box

| Path | Purpose |
|---|---|
| `agents/` | Canonical source of truth — one folder per agent (prompt, memory, portfolio) |
| `team/` | Roster, handoff matrix, correspondence, handoffs, decision traces |
| `runtime/` | Node/TS server, dashboard SPA, CLI, JSON schemas |
| `adapters/` | Drop-in integrations for VS Code Copilot, Claude CLI, Gemini CLI, OpenAI/LM Studio |
| `docs/` | Architecture, usage guides, settings reference, troubleshooting |
| `scripts/` | Install, package, verify, scaffold-new-agent |
| `SETTINGS.example.jsonc` | Master tunables (per-agent stats + globals) |

## Quickstart matrix

| Environment | Command |
|---|---|
| **VS Code GitHub Copilot (local agents)** | `bash scripts/install.sh --target /path/to/repo --adapter github-copilot-local` |
| **GitHub repo (remote workflows / templates)** | `bash scripts/install.sh --target /path/to/repo --adapter github-copilot-remote` |
| **Claude CLI** | `bash scripts/install.sh --target /path/to/repo --adapter claude-cli` |
| **Gemini CLI** | `bash scripts/install.sh --target /path/to/repo --adapter gemini-cli` |
| **OpenAI / LM Studio / any OpenAI-compatible API** | `cd adapters/openai-lmstudio && npm i && npm run start` |
| **Live dashboard + IM/email bus** | `cd runtime/server && npm i && npm start` then open `http://localhost:7330` |

PowerShell users substitute `scripts\install.ps1`.

## The crew

| Agent | Lane |
|---|---|
| **Bridge** | Planner + dispatcher + watchdog. Decomposes requests, routes work, audits sub-agent prompts. |
| **Sol** | Lead programmer. Implementation, architecture, automation. |
| **Vex** | Content & lore architect. Narrative text, content tables, docs. |
| **Rook** | QA & release engineer. Build verification, repros, gates. |
| **Robert** | Master researcher. External knowledge, references, gap analysis. |
| **Lux** | Visuals & art direction. Style guides, UI/UX briefs, asset specs. |
| **Nova** | Gameplay systems & balancing. Mechanics, progression, formulas. |
| **Jesse** | Repository manager. Issues, board, milestones, labels, wiki. |

See [team/TEAM.md](team/TEAM.md) for the full handoff matrix and interaction patterns.

## Live coordination layer

Tritium ships a small Node/SQLite **message bus** so agents can chat and email each other while working:

- **IM** — short, threaded, expected-soon replies. Real-time WebSocket stream.
- **Email** — longer, structured, supports attachments (file paths or inline blobs).
- **Dashboard** — local SPA at `http://localhost:7330` to watch the IM stream, browse the inbox, send messages as `@you`, and edit settings live.

See [docs/architecture.md](docs/architecture.md) for the data model and [docs/settings-reference.md](docs/settings-reference.md) for tunables.

## Master settings

`SETTINGS.example.jsonc` is the single source of tunables. Copy to `SETTINGS.jsonc` and edit:

```jsonc
{
  "global": {
    "default_model": "claude-sonnet-4.5",
    "dashboard_port": 7330,
    "db_path": "./.tritium/tritium.db"
  },
  "agents": {
    "bridge": { "independence": 7, "verbosity": 3, "inbox_check_interval": 1, "enabled": true },
    "sol":    { "independence": 6, "verbosity": 4, "inbox_check_interval": 2, "enabled": true }
    // ...
  }
}
```

Higher `independence` = fewer clarification questions back to you. See [docs/settings-reference.md](docs/settings-reference.md) for every key.

## Scaling up

Add a new agent in one command:

```bash
bash scripts/new-agent.sh <name> "<role-description>"
```

This scaffolds `agents/<name>/`, registers it in `team/TEAM.md`, adds a settings stub, and prepares prompts for each adapter.

## Pre-release

Build the zip + SHA-256:

```bash
bash scripts/package.sh
# → dist/tritium-v0.1.0.zip
# → dist/tritium-v0.1.0.zip.sha256
```

Smoke-test the runtime:

```bash
bash scripts/verify.sh
```

## Roadmap

See [CHANGELOG.md](CHANGELOG.md). The dashboard ships read-write for IM/email and read-only for `SETTINGS.jsonc` reflection in v0.1; the editable settings panel and tunnel-mode documentation land in v0.2.

— Tritium Team
