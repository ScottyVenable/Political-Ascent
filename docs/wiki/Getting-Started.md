# Getting Started

Political Ascent is early-alpha. This page describes how to build and
run it from source.

## Requirements

- Node.js 20 LTS or newer
- npm 10 or newer
- Git
- (Optional) Android Studio for the Android build

## Clone and install

```bash
git clone https://github.com/ScottyVenable/Political-Ascent.git
cd Political-Ascent
npm ci
```

## Run the web build

```bash
npm run dev
```

Open the URL printed by Vite (typically `http://localhost:5173`).

## Run the desktop build (Electron)

```bash
npm run dev:electron
```

## Tests

- Unit tests: `npm test`
- Playwright end-to-end + screenshots: `npm run test:e2e`
- Update screenshot baselines: `npm run test:e2e:update`

## Related pages

- [[Game-Systems]]
- [[Contributing]]
