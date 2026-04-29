/**
 * Build-time constants injected by Vite via `define` (see vite.config.ts).
 * These are inlined as string literals at compile time, so consumers
 * read them like any other string.
 *
 * @module types/build
 */

/** Short git commit hash of the build (`git rev-parse --short HEAD`). */
declare const __BUILD_COMMIT__: string;

/** ISO date (YYYY-MM-DD) the bundle was built. */
declare const __BUILD_DATE__: string;
