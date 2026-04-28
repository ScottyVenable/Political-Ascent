/**
 * Tiny markdown -> React renderer for the Patch Notes panel.
 *
 * Closes part of docs/todo.md item 17. We need to render the bundled
 * changelog markdown files inside the game without adding a heavy
 * dependency like `react-markdown` (which pulls in `unified`, `mdast`,
 * etc.). The patch-notes content uses a tiny subset of markdown:
 *
 *   #/##/### headings
 *   - bullet lists
 *   `inline code`
 *   plain paragraphs separated by blank lines
 *
 * Anything more elaborate is rendered as a plain paragraph. If we
 * outgrow this we'll swap in a proper parser; for now the small
 * footprint is the right tradeoff.
 *
 * @module renderer/components/MarkdownLite
 */

import type { JSX, ReactNode } from 'react';

interface ParsedBlock {
  kind: 'h1' | 'h2' | 'h3' | 'p' | 'ul';
  text: string;
  items?: string[];
}

/**
 * Split the markdown source into a flat list of blocks. Blank lines
 * separate blocks; consecutive `- ` lines form a single `ul` block.
 * Exported so the parser can be unit-tested without rendering React.
 */
export function parseMarkdownLite(src: string): ParsedBlock[] {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const out: ParsedBlock[] = [];
  let buf: string[] = [];
  let mode: 'p' | 'ul' | null = null;

  function flush(): void {
    if (mode === null || buf.length === 0) {
      buf = [];
      mode = null;
      return;
    }
    if (mode === 'ul') {
      out.push({ kind: 'ul', text: '', items: buf.slice() });
    } else {
      out.push({ kind: 'p', text: buf.join(' ') });
    }
    buf = [];
    mode = null;
  }

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.trim() === '') {
      flush();
      continue;
    }
    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) {
      flush();
      out.push({ kind: 'h3', text: h3[1].trim() });
      continue;
    }
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      flush();
      out.push({ kind: 'h2', text: h2[1].trim() });
      continue;
    }
    const h1 = line.match(/^#\s+(.+)$/);
    if (h1) {
      flush();
      out.push({ kind: 'h1', text: h1[1].trim() });
      continue;
    }
    const li = line.match(/^[-*]\s+(.+)$/);
    if (li) {
      if (mode !== 'ul') flush();
      mode = 'ul';
      buf.push(li[1].trim());
      continue;
    }
    if (mode === 'ul') flush();
    mode = 'p';
    buf.push(line.trim());
  }
  flush();
  return out;
}

/**
 * Render inline markdown (`code` only for now) into React nodes.
 * Other inline markup is intentionally passed through as plain text.
 */
function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /`([^`]+)`/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) parts.push(text.slice(lastIndex, m.index));
    parts.push(
      <code
        key={parts.length}
        className="font-mono text-label bg-bg-tertiary text-accent-gold px-1 rounded-sm"
      >
        {m[1]}
      </code>,
    );
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

export interface MarkdownLiteProps {
  source: string;
}

/** Render the parsed blocks. */
export function MarkdownLite(props: MarkdownLiteProps): JSX.Element {
  const blocks = parseMarkdownLite(props.source);
  return (
    <div className="space-y-3" data-testid="markdown-lite">
      {blocks.map((b, i) => {
        switch (b.kind) {
          case 'h1':
            return (
              <h1
                key={i}
                className="font-headline text-panel-title text-text-primary"
              >
                {renderInline(b.text)}
              </h1>
            );
          case 'h2':
            return (
              <h2
                key={i}
                className="font-headline text-panel-section text-accent-gold mt-4"
              >
                {renderInline(b.text)}
              </h2>
            );
          case 'h3':
            return (
              <h3
                key={i}
                className="font-mono text-label uppercase tracking-wider text-accent-gold mt-3"
              >
                {renderInline(b.text)}
              </h3>
            );
          case 'p':
            return (
              <p key={i} className="text-body text-text-secondary leading-relaxed">
                {renderInline(b.text)}
              </p>
            );
          case 'ul':
            return (
              <ul key={i} className="list-disc pl-6 space-y-1">
                {(b.items ?? []).map((it, j) => (
                  <li key={j} className="text-body text-text-secondary leading-snug">
                    {renderInline(it)}
                  </li>
                ))}
              </ul>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
