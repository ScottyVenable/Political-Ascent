# Political Ascent — Stable Stream

Per-release notes for stable, public-facing builds. One file per version. Authoritative once a tag is promoted; do not amend after release.

This folder mirrors the in-game **Patch Notes** panel's "Stable" tab.

> Political Ascent is currently in pre-alpha. The first stable build will be `1.0.0` (or, in the rc window, `1.0.0-rc.1`). Until then this folder is intentionally sparse.

## What belongs here

- Per-version stable release notes.
- RC notes for `1.0.0-rc.*` and similar.

## File naming convention

`YYYY-MM-DD-<version>.md` for full stable releases (e.g. `2026-XX-XX-1.0.0.md`).
`YYYY-MM-DD-<version>-<slug>.md` permitted for RC or hotfix releases where a slug clarifies intent.

> Legacy entries written before this convention are preserved as-is. None exist yet.

## Template

See [`_TEMPLATE.md`](_TEMPLATE.md). Use the [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) sections. Stable entries must additionally include:

- A **Security** subsection (explicit "no security-relevant changes" note if empty).
- **Migration notes** if `meta.schemaVersion` increased since the prior stable.
- Cross-references to any [GDD §14](../../GDD.md) risk retired or newly opened.

## Promotion contract

A file lands here only after every gate in the **experimental → stable** column of [GDD §13.7.1](../../GDD.md) is green. The corresponding section in [docs/about/CHANGELOG.md](../../about/CHANGELOG.md) must be dated and the `[Unreleased]` block reset.
