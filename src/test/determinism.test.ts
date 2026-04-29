/**
 * Seeded-determinism lint guard.
 *
 * Political Ascent's coding standards (AGENTS.md §2 hard rule, GDD §1.4) require
 * that every simulation outcome be reproducible from a single world seed. That
 * means `Math.random()` must NEVER appear inside the deterministic layers:
 *
 *   - src/engine/   (game-rule evaluators)
 *   - src/systems/  (per-tick simulation drivers)
 *   - src/store/    (Zustand action functions: any RNG inside an action becomes
 *                    a hidden non-deterministic input to the world state)
 *
 * Instead, those layers must take a `SeededRNG` (see src/utils/random.ts) and
 * thread it through their call sites.
 *
 * This test enforces the rule mechanically rather than relying on humans to
 * remember it during code review. It walks the deterministic layers and fails
 * if it finds `Math.random(` outside of an explicit allow-list comment.
 *
 * To intentionally allow a `Math.random()` call (for example, in a piece of
 * pure cosmetic UI sugar that lives in src/renderer/ but is shared into engine
 * for some good reason), add the directive comment on the same line:
 *
 *   const jitter = Math.random(); // eslint-disable-line determinism/seeded-rng
 *
 * Renderer code (src/renderer/) is exempt — UI sparkle (particle jitter,
 * background animation seeds) is allowed to be non-deterministic because it
 * doesn't feed back into world state.
 *
 * @module test/determinism
 */

import { describe, expect, test } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────

/**
 * Roots that must be deterministic. Each entry is resolved relative to the
 * repository root. Any `.ts` / `.tsx` file under these roots is scanned.
 */
const DETERMINISTIC_ROOTS = ['src/engine', 'src/systems', 'src/store'] as const;

/**
 * Files we explicitly skip. Test files are exempt because tests routinely
 * use Math.random() to generate fixture noise where determinism doesn't matter.
 */
const SKIP_SUFFIXES = ['.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx'] as const;

/**
 * Per-line escape hatch. If a line contains this directive (case-insensitive),
 * the Math.random() on that line is allowed.
 */
const ALLOW_DIRECTIVE = /determinism\/seeded-rng/i;

// ─────────────────────────────────────────────────────────────
// SCANNER
// ─────────────────────────────────────────────────────────────

/**
 * Recursively collect every .ts/.tsx file under `dir`, skipping test files.
 *
 * @param dir - Absolute directory path to walk.
 * @returns Absolute file paths.
 */
function collectSourceFiles(dir: string): string[] {
  const out: string[] = [];

  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    // Directory missing is not a determinism violation; just nothing to scan.
    return out;
  }

  for (const name of entries) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      out.push(...collectSourceFiles(full));
      continue;
    }
    const ext = extname(name);
    if (ext !== '.ts' && ext !== '.tsx') continue;
    if (SKIP_SUFFIXES.some((s) => name.endsWith(s))) continue;
    out.push(full);
  }

  return out;
}

/**
 * Scan a single file for forbidden Math.random() calls.
 *
 * @param filePath - Absolute path to the file.
 * @returns Array of "<file>:<line>: <snippet>" violation strings.
 */
function findViolations(filePath: string): string[] {
  const text = readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);
  const violations: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Look for Math.random( as a token. Substring match is fine because
    // anything containing this substring outside an allow-listed line is
    // a real violation worth surfacing.
    if (!line.includes('Math.random(')) continue;
    if (ALLOW_DIRECTIVE.test(line)) continue;

    // Skip comment-only lines. We accept three common forms:
    //   - JSDoc continuation:       "   * something"
    //   - Single-line comment:      "   // something"
    //   - Block-comment opener:     "   /* something"
    // This is intentionally syntactic, not a full parser — the rule is
    // "if the only thing on this line is a comment, ignore it". A line
    // that mixes code and a trailing comment still counts.
    const trimmed = line.trimStart();
    if (trimmed.startsWith('*') || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
      continue;
    }

    violations.push(`${filePath}:${i + 1}: ${line.trim()}`);
  }

  return violations;
}

// ─────────────────────────────────────────────────────────────
// TEST
// ─────────────────────────────────────────────────────────────

describe('seeded determinism lint guard', () => {
  test('no Math.random() in engine/systems/store', () => {
    const repoRoot = resolve(__dirname, '..', '..');
    const allViolations: string[] = [];

    for (const rel of DETERMINISTIC_ROOTS) {
      const root = resolve(repoRoot, rel);
      for (const file of collectSourceFiles(root)) {
        allViolations.push(...findViolations(file));
      }
    }

    if (allViolations.length > 0) {
      // Build a readable failure message so the offender is obvious.
      const msg = [
        'Math.random() is forbidden in deterministic layers (engine/systems/store).',
        'Use SeededRNG from src/utils/random.ts instead.',
        'Violations:',
        ...allViolations.map((v) => `  - ${v}`),
        '',
        'If a specific call is genuinely safe, add the directive comment',
        '  // eslint-disable-line determinism/seeded-rng',
        'on the same line and explain why in a code comment.',
      ].join('\n');
      throw new Error(msg);
    }

    expect(allViolations).toEqual([]);
  });
});
