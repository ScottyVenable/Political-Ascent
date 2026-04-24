# Political Ascent

A hybrid RPG / grand strategy / management simulation about navigating the world of politics — from first election to legacy.

> *Every vote has a cost. Every promise has a price.*

---

## Overview

- **Genre:** Political RPG + grand strategy + management sim
- **Platforms:** Windows, macOS, Linux (Electron desktop), Android (Capacitor APK)
- **Engine:** React 18 + TypeScript, Electron, Capacitor, Vite
- **State:** Zustand (+ immer)
- **Version:** 0.1.0-alpha.1 (MVP)

See `docs/GDD.md` for the full game design, `docs/ARCHITECTURE.md` for the technical design, and `docs/ROADMAP.md` for development priorities.

---

## Prerequisites

- **Node.js** 20+
- **npm** 10+
- **Java 17 + Android SDK** (only if building Android APK)
- **Gradle** (bundled wrapper used; system install not required)
- **PowerShell 5.1+** (for the `launcher.ps1` helper on Windows; optional)

---

## PowerShell launcher (Windows)

A stylised interactive launcher is provided at `launcher.ps1`.

```powershell
# Interactive menu
.\launcher.ps1

# Non-interactive — run a specific task
.\launcher.ps1 -Task dev
.\launcher.ps1 -Task build:win
.\launcher.ps1 -Task preflight
```

Tasks available via `-Task`:

| Task                    | What it does                              |
|-------------------------|-------------------------------------------|
| `install`               | `npm install`                             |
| `preflight`             | Check Node/npm/Java/ANDROID_HOME          |
| `dev`                   | Start Vite dev server                     |
| `typecheck`             | Run TypeScript type-check                 |
| `test`                  | Run the Vitest suite                      |
| `test:watch`            | Vitest in watch mode                      |
| `test:coverage`         | Vitest with coverage                      |
| `build:web`             | Build the web bundle                      |
| `electron:dev`          | Run Electron in dev mode                  |
| `build:electron`        | Package Electron (cross-platform)         |
| `build:win`             | Package Windows NSIS installer + portable |
| `build:android`         | Build Android debug APK                   |
| `build:android-release` | Build Android release APK                 |
| `clean`                 | Remove build artefacts                    |
| `docs`                  | Open the `docs/` folder                   |

---

## Quick start

```bash
npm install

# Web / dev server
npm run dev

# Type-check
npm run typecheck

# Tests
npm test

# Build the web bundle (consumed by both Electron and Capacitor)
npm run build:web
```

Open http://localhost:5173 to play in a browser during development.

---

## Desktop build (Electron)

Windows installer (NSIS) + portable:

```bash
npm run build:win
```

Cross-platform (macOS/Linux in CI; platform targets configured in `electron-builder.yml`):

```bash
npm run build:electron
```

Artifacts land in `bin/`.

---

## Android APK build (Capacitor + Gradle)

The Android project lives under `android/` and is a standard Capacitor-generated Gradle project.

### First-time setup

```bash
# Produce the web bundle that gets wrapped into the APK
npm run build:web

# Sync the bundle into android/app/src/main/assets/public
npm run cap:sync
```

### Debug APK

```bash
npm run android:build
```

The APK will be at:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Release APK

1. Create a keystore (one-time):

```bash
keytool -genkey -v \
  -keystore android/app/release.keystore \
  -alias political-ascent \
  -keyalg RSA -keysize 2048 -validity 10000
```

2. Add the signing credentials to `android/keystore.properties` (see `android/keystore.properties.example`).

3. Build:

```bash
npm run android:release
```

The signed APK lands in `android/app/build/outputs/apk/release/app-release.apk`.

### Requirements

- Android SDK Platform **34**
- Android Build Tools **34.0.0**
- `ANDROID_HOME` env var pointing at your SDK root
- Java 17

---

## Project structure

```
src/
  main/          Electron main process
  renderer/      React app (screens, panels, components, hooks)
  engine/        Pure game engine (no React)
  systems/       Individual simulation systems
  store/         Zustand stores
  data/          Static JSON game data
  types/         Shared TypeScript interfaces
  utils/         Pure utilities (RNG, math, formatting, logging)

android/         Capacitor-generated Android (Gradle) project
docs/            GDD, Architecture, Roadmap, guides
.github/         COPILOT_INSTRUCTIONS.md + CI
```

---

## Contributing

Read these, in order:

1. [AGENTS.md](AGENTS.md) — operating manual for AI agents and humans using them.
2. [.github/COPILOT_INSTRUCTIONS.md](.github/COPILOT_INSTRUCTIONS.md) — coding standards.
3. [docs/guides/CONTRIBUTING.md](docs/guides/CONTRIBUTING.md) — contributor workflow.
4. [docs/guides/ICONS_AND_ASSETS.md](docs/guides/ICONS_AND_ASSETS.md) — **no emoji in shipped content**; icon and sprite sourcing rules.
5. [docs/GDD.md](docs/GDD.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/ROADMAP.md](docs/ROADMAP.md) — design and plan.
6. [docs/research/](docs/research/) — reference research (Victoria 3, CK3, Anno 1800, and cross-cutting patterns) that informs design decisions.

## Testing

- Unit: `npm test` (Vitest).
- End-to-end + screenshots: `npm run test:e2e` (Playwright).
- See `AGENTS.md` §5 for the full testing expectations, including screenshot suite requirements for any UI change.
