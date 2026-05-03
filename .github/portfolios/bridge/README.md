# Bridge Portfolio

Working portfolio for **Bridge** — Crew Dispatcher / Multi-Agent Router. Bridge does not implement work, so this portfolio is intentionally light: it holds routing logs and decision records that explain why a request was sequenced through specific specialists. Use it when a routing decision is non-obvious or when a flow needs to be reproducible later.

> Rationale for keeping a portfolio: although Bridge doesn't author deliverables, durable routing rationale (especially for multi-agent flows) is genuinely useful for Jesse's audits and for future Bridge runs that revisit similar requests. Most routing happens inline and never lands here — only retain notes that have lasting value.

- Agent file: [../../agents/Bridge.agent.md](../../agents/Bridge.agent.md)
- Team map: [../../TEAM.md](../../TEAM.md)

## Structure

| Subfolder | Purpose |
|---|---|
| `routing-logs/` | Notable multi-agent routing decisions worth preserving (sequence, rationale, outcome). |
| `decision-records/` | Cross-team coordination decisions: process changes, new flows, conflict resolutions. |

Subfolders are created on demand. **Most routing is ephemeral; do not log every dispatch.**

## File naming

- Routing logs: `routing-[topic]-[YYYY-MM-DD].md`.
- Decision records: `decision-[NNNN]-[slug].md`.

## Working rules

- Bridge does not edit source, content, or canonical taxonomy. Portfolio is read-mostly.
- Every entry references the issues / PRs / agent runs it describes.
- Sign entries with `- Bridge`.

## Promotion targets

| Type | Destination |
|---|---|
| Process changes that should bind the team | `.github/TEAM.md` (via PR) |
| Significant decision records | linked from `.github/TEAM.md` |

_Maintained by Bridge. Indexed by Jesse._
