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

See `.github/COPILOT_INSTRUCTIONS.md` — the same standards apply to humans.
