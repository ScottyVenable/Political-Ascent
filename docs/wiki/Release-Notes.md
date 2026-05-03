# Release Notes

> **GDD reference:** §13.7 (promotion gates), ROADMAP.md §1
> **Implementation status:** Implemented (process)
> **Last reviewed:** 2026-05-02 (Vex, GDD v0.4-DRAFT)

This page summarises what has shipped and points you to the canonical records. It does not duplicate per-version notes — those live in the repository.

---

## How the Release Streams Work

Political Ascent ships through three streams. Each has its own stability bar and audience, and each is hosted on a long-lived GitHub branch.

| Stream | Branch | Who it is for | Where to find notes |
|---|---|---|---|
| **development** | `development` | Internal contributors; automated nightly builds | `docs/changelogs/development/` in the repository |
| **experimental** | `alpha` | Opt-in playtesters; pre-release tags (e.g. `v0.2.0-exp.YYYYMMDD`) | `docs/changelogs/experimental/` in the repository |
| **stable** | `stable` | Public players; milestone-aligned releases | [`docs/about/CHANGELOG.md`](https://github.com/ScottyVenable/Political-Ascent/blob/development/docs/about/CHANGELOG.md) — canonical user-facing record |

A feature must flow **development → experimental → stable**. It cannot skip a stream.

> The *stream* names (development/experimental/stable) are the canonical identifiers used in label namespaces, changelog folders, and the in-game Patch Notes tabs. The *branch* names (development/alpha/stable) are the GitHub refs that host each stream. The two are deliberately decoupled — changelog folder names are stable identifiers and do not change with branch renames.

---

## Current State

| Field | Value |
|---|---|
| Last development tag | `v0.1.0-alpha.1` (2026-04-24) |
| Most recent experimental | `v0.1.0-alpha.1-exp.20260429` (Android APK) |
| Stable releases | None yet — pre-alpha. First stable target: `1.0.0-rc.1` at M8. |
| Default branch | `development` |
| Active feature branch | `exp--legislative-overhaul` (M1 Cloakroom) → PR’d into `development` |

---

## Canonical Changelog

The [CHANGELOG.md](https://github.com/ScottyVenable/Political-Ascent/blob/development/docs/about/CHANGELOG.md) follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) format and covers stable-stream entries only. It is the authoritative user-facing record.

---

## Upcoming: Milestone Ladder

See [[Roadmap]] for the full development plan (M1 through M8). Each milestone ships to experimental first; if gates pass, it promotes to stable.

---

## Related

[[Roadmap]] · [[Contributing]] · [[FAQ]]
