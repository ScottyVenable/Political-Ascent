# Political Ascent — Experimental Stream

Patch notes for `experimental` pre-release tags (versioned `v*.*.*-exp.YYYYMMDD` or similar). Each tag gets its own file. Files may be amended until the parent version promotes to stable.

This folder mirrors the in-game **Patch Notes** panel's "Experimental" tab.

## What belongs here

- Per-tag notes for `experimental` pre-releases.
- Stacked PR aggregations cut for opt-in playtest builds (e.g. APK pre-releases).
- The "what changed since the last exp tag" delta.

## File naming convention

`YYYY-MM-DD-<version>-<slug>.md`

- `<version>` — full pre-release version (e.g. `0.2.0-alpha.1-exp.20260502`).
- `<slug>` — short kebab-case description of the headline feature for the tag.

Example: `2026-05-02-0.2.0-alpha.1-exp.20260502-rider-stack.md`

> Legacy entries written before this convention are preserved as-is.

## Template

See [`_TEMPLATE.md`](_TEMPLATE.md). Use the [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) sections.

## Promotion

To move from this stream to `stable`, every gate in the **experimental → stable** column of [GDD §13.7.1](../../GDD.md) must be green. The corresponding entry should be mirrored into [`../stable/`](../stable/) and the canonical [docs/about/CHANGELOG.md](../../about/CHANGELOG.md) `[Unreleased]` block must be converted to a dated version section.
