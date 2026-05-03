# Political Ascent — Development Stream

Informal patch notes for the bleeding-edge `development` branch and any `exp--*` feature branches in flight. Not promotion-binding; the canonical record is [docs/about/CHANGELOG.md](../../about/CHANGELOG.md).

This folder mirrors the in-game **Patch Notes** panel's "Development" tab.

## What belongs here

- Per-feature dev notes for branches that have merged to `development`.
- Aggregated nightly summaries (optional).
- Anything written before a version is cut on `experimental`.

## File naming convention

`YYYY-MM-DD-<version>-<slug>.md`

- `<version>` — the in-progress version this work targets (e.g. `0.2.0-alpha.1`).
- `<slug>` — short kebab-case description (e.g. `legislative-overhaul`).

Example: `2026-05-02-0.2.0-alpha.1-rider-stack.md`

> Legacy entries written before this convention (e.g. `v0.1.0-alpha.md`) are preserved as-is.

## Template

See [`_TEMPLATE.md`](_TEMPLATE.md). Use the [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) sections.

## Promotion

Items here are **not** promotion-binding on their own. To move work into `experimental`, mirror the entry into a new file under [`../experimental/`](../experimental/) at tag-cut time and verify the dev→exp gates in [GDD §13.7.1](../../GDD.md).
