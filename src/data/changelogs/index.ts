/**
 * Patch-notes data loader.
 *
 * Closes part of docs/todo.md items 17 and 19. The canonical source
 * for changelogs lives under `docs/changelogs/{stable,development,
 * experimental}/*.md`. We pull those files into the bundle at build
 * time via Vite's `import.meta.glob` so the in-game Patch Notes panel
 * has them available without a network request.
 *
 * The branch (stable / development / experimental) is derived from the
 * folder the file lives in. The `slug` is the filename without `.md`,
 * sortable as a string in newest-first order when files are named
 * after semver tags or dates.
 *
 * @module data/changelogs
 */

export type ChangelogBranch = 'stable' | 'development' | 'experimental';

export interface ChangelogEntry {
  /** Branch derived from the parent folder. */
  branch: ChangelogBranch;
  /** Filename without the `.md` extension. Used as a stable id. */
  slug: string;
  /** Display title (extracted from the first `# heading`, or the slug). */
  title: string;
  /** Full markdown source. */
  markdown: string;
}

/**
 * Vite glob import: pulls every `.md` from the canonical changelog
 * folders. `eager: true` materialises them into the bundle directly,
 * `as: 'raw'` returns the file contents as a string.
 *
 * The path is relative to this module (src/data/changelogs/index.ts).
 */
const RAW = import.meta.glob('/docs/changelogs/{stable,development,experimental}/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

function branchOf(path: string): ChangelogBranch | null {
  if (path.includes('/stable/')) return 'stable';
  if (path.includes('/development/')) return 'development';
  if (path.includes('/experimental/')) return 'experimental';
  return null;
}

function slugOf(path: string): string {
  const last = path.split('/').pop() ?? path;
  return last.replace(/\.md$/, '');
}

/**
 * Pull a display title out of the markdown. Looks for the first
 * `# heading` line; falls back to the slug humanised.
 */
export function extractTitle(markdown: string, slug: string): string {
  const m = markdown.match(/^#\s+(.+?)\s*$/m);
  if (m) return m[1].trim();
  return slug;
}

/** All changelog entries known at build time, unfiltered. */
export const ALL_CHANGELOGS: ReadonlyArray<ChangelogEntry> = Object.entries(RAW)
  .map(([path, markdown]) => {
    const branch = branchOf(path);
    if (!branch) return null;
    const slug = slugOf(path);
    return {
      branch,
      slug,
      title: extractTitle(markdown, slug),
      markdown,
    } satisfies ChangelogEntry;
  })
  .filter((e): e is ChangelogEntry => e !== null)
  // README files are folder-level placeholders, not version notes.
  .filter((e) => e.slug.toLowerCase() !== 'readme')
  // Newest-first by slug. Slugs are typically version tags so this
  // gives a sensible order for v0.2.0 > v0.1.0 etc.
  .sort((a, b) => b.slug.localeCompare(a.slug, undefined, { numeric: true }));

/** Filter helper. */
export function changelogsForBranch(branch: ChangelogBranch): ChangelogEntry[] {
  return ALL_CHANGELOGS.filter((e) => e.branch === branch);
}
