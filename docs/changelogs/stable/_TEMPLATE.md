# Political Ascent `<version>` — Stable

> Rename this file to `YYYY-MM-DD-<version>.md` before committing.
> Delete this blockquote.

**Tag:** `<version>` (e.g. `1.0.0`)
**Release date:** `YYYY-MM-DD`
**Milestone:** [ROADMAP M?](../../ROADMAP.md)
**Promotion gates:** exp→stable column of [GDD §13.7.1](../../GDD.md) — all green.

## Summary

One paragraph describing the release headline.

## Added

- ...

## Changed

- ...

## Deprecated

- ...

## Removed

- ...

## Fixed

- ...

## Security

- *(Required.)* List security-relevant changes since the previous stable, or state "No security-relevant changes since `<prior-version>`."

## Migration notes

*(Required if `meta.schemaVersion` increased since the previous stable.)*

- From `meta.schemaVersion = N` to `meta.schemaVersion = N+1`: <describe migration>.
- Forward-compatibility: <yes/no>.
- Backward-compatibility: <yes/no>.

## Risk register changes

Cross-references to [GDD §14](../../GDD.md):

- Retired: <list of risk ids>.
- Newly opened: <list of risk ids>.

## Smoke test results

| Platform | Status | Notes |
|---|---|---|
| Web | ✅ / ❌ | |
| Electron Windows | ✅ / ❌ | |
| Electron macOS | ✅ / ❌ | |
| Electron Linux | ✅ / ❌ | |
| Capacitor Android | ✅ / ❌ | |

## Known issues

- ...

## Acknowledgements

- ...
