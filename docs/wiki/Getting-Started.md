# Getting Started

> **GDD reference:** §7.1 (build matrix), §2 (core loop)
> **Implementation status:** Implemented
> **Last reviewed:** 2026-05-02 (Vex, GDD v0.4-DRAFT)

Political Ascent is in early alpha. This page explains how to build and run it from source.

---

## Requirements

- Node.js 20 LTS (`.nvmrc` pins the version when it ships in M4)
- npm 10 or newer
- Git
- (Optional) Android Studio for the Android build

## Clone and Install

```bash
git clone https://github.com/ScottyVenable/Political-Ascent.git
cd Political-Ascent/political-ascent-project
npm ci
```

## Run the Web Build

```bash
npm run dev
```

Open the URL printed by Vite (typically `http://localhost:5173`).

## Run the Desktop Build (Electron)

```bash
npm run dev:electron
```

## Tests

```bash
npm test                   # unit tests (Vitest)
npm run test:e2e           # Playwright end-to-end
npm run test:e2e:update    # update screenshot baselines
```

## Your First Session

1. Launch the game and select **New Game**.
2. Choose a **background** (Citizen, Veteran, or Executive) — this shapes your starting stats and native traits.
3. Set your **ideology** on the two-axis compass.
4. Pick your **starting traits** from the available pool.
5. The scenario opens on your first week. You have a bill in pre-draft and an inbox of obligations. Start with the [[Legislation]] panel.

The world ticks with or without you. Pausing gives you time to think — use it.

---

## Keyboard and Accessibility

- Keyboard-first: all panels and controls are fully keyboard-navigable.
- Focus ring: a gold outline marks the active focusable element.
- Reduced motion: all animations respect `prefers-reduced-motion`.
- Extended tooltips: hold `Shift` while hovering any term for the full definition.

---

## Related

[[Game-Systems]] · [[Legislation]] · [[Character]] · [[FAQ]] · [[Contributing]]
