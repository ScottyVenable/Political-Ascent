/**
 * PatchNotesPanel — in-game viewer for changelog markdown.
 *
 * Closes part of docs/todo.md item 17 and the foundation of item 19.
 * Reads bundled changelog files from `docs/changelogs/{stable,
 * development,experimental}/*.md` (loaded via `src/data/changelogs`)
 * and presents them as a tab-strip + list-rail + detail browser.
 *
 * Future iterations (deferred):
 *   - Pull "what's new since last launch" from the GitHub Releases API
 *     so external users see the latest stable notes without rebuilding.
 *   - Embed interactive elements (buttons that link to in-game panels)
 *     via the markdown-lite parser, per todo#19's "no-code editor"
 *     foundation.
 *
 * @module renderer/panels/PatchNotesPanel
 */

import { useMemo, useState } from 'react';
import { Card } from '../components/Card';
import { MarkdownLite } from '../components/MarkdownLite';
import {
  ALL_CHANGELOGS,
  changelogsForBranch,
  type ChangelogBranch,
  type ChangelogEntry,
} from '@/data/changelogs';

const TABS: ReadonlyArray<{ id: ChangelogBranch; label: string }> = [
  { id: 'stable', label: 'Stable' },
  { id: 'development', label: 'Development' },
  { id: 'experimental', label: 'Experimental' },
];

export function PatchNotesPanel(): JSX.Element {
  const [branch, setBranch] = useState<ChangelogBranch>('development');
  const entries = useMemo<ChangelogEntry[]>(() => changelogsForBranch(branch), [branch]);

  // Selection persists across tab switches when possible, otherwise
  // defaults to the newest entry of the current tab.
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const selected =
    entries.find((e) => e.slug === selectedSlug) ?? entries[0] ?? null;

  return (
    <div className="space-y-3" data-testid="patch-notes-panel">
      <header>
        <h1 className="font-headline text-panel-title text-text-primary">
          Patch Notes
        </h1>
        <p className="text-body text-text-secondary">
          What changed in each build. Switch tabs to see notes from a different
          release channel.
        </p>
      </header>

      <div className="flex gap-1.5" role="tablist" aria-label="Release channel">
        {TABS.map((t) => {
          const isOn = branch === t.id;
          const count = changelogsForBranch(t.id).length;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={isOn}
              data-testid={`patch-notes-tab-${t.id}`}
              onClick={() => setBranch(t.id)}
              className={
                'px-3 py-1 text-label font-mono uppercase tracking-wider rounded-sm border ' +
                (isOn
                  ? 'bg-accent-gold text-bg-primary border-accent-gold'
                  : 'bg-bg-secondary text-text-secondary border-rule hover:border-rule-strong')
              }
            >
              {t.label} <span className="opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {ALL_CHANGELOGS.length === 0 ? (
        <Card>
          <p className="text-body text-text-muted italic">
            No patch notes have been added yet.
          </p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-[16rem_1fr] gap-3">
          <ol
            data-testid="patch-notes-list"
            className="space-y-1 max-h-[70vh] overflow-y-auto pr-1"
          >
            {entries.length === 0 && (
              <li className="text-body text-text-muted italic px-2 py-3">
                No notes published on this channel.
              </li>
            )}
            {entries.map((e) => {
              const isSelected = selected?.slug === e.slug;
              return (
                <li key={`${e.branch}-${e.slug}`}>
                  <button
                    type="button"
                    data-testid={`patch-notes-row-${e.slug}`}
                    onClick={() => setSelectedSlug(e.slug)}
                    className={
                      'w-full text-left px-3 py-2 rounded-sm border transition-colors ' +
                      (isSelected
                        ? 'bg-bg-tertiary border-accent-gold'
                        : 'bg-bg-secondary border-rule hover:border-rule-strong')
                    }
                  >
                    <span className="font-headline text-body text-text-primary leading-snug block">
                      {e.title}
                    </span>
                    <span className="font-mono text-label uppercase tracking-wider text-text-muted">
                      {e.slug}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div data-testid="patch-notes-detail">
            {selected ? (
              <Card>
                <MarkdownLite source={selected.markdown} />
              </Card>
            ) : (
              <Card>
                <p className="text-body text-text-muted italic">
                  Select an entry to view its notes.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
