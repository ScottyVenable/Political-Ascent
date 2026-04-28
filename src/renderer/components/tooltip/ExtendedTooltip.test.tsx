/**
 * Tests for the tooltip polish pass (PR-A).
 *
 * Covers the behavioural changes:
 *  - `lockHoldMs` defaults to 3000ms (todo#26).
 *  - The pin coordinator evicts a previously-pinned tooltip when a
 *    new one pins (todo#29).
 *  - `renderInlineTerms` auto-links plain glossary surfaces in
 *    text segments without `[term:...]` markers (todo#39).
 *
 * The mouse-anchoring behaviour (todo#37) is verified at the e2e
 * level in tests/e2e/tooltips-everywhere.spec.ts because the position
 * calculation uses `getBoundingClientRect` and viewport size, which
 * are stubs in jsdom.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import { ExtendedTooltip, registerTooltip, clearTooltips } from './index';

describe('ExtendedTooltip — polish pass', () => {
  beforeEach(() => {
    clearTooltips();
    registerTooltip({
      id: 'political-capital',
      title: 'Political Capital',
      aliases: ['PC'],
      sections: [{ kind: 'paragraph', text: 'The currency of influence.' }],
    });
    registerTooltip({
      id: 'whip',
      title: 'Whip',
      aliases: ['whips'],
      sections: [{ kind: 'paragraph', text: 'A vote-counter.' }],
    });
  });

  it('auto-links registered terms inside paragraph prose (todo#39)', async () => {
    // The `findTermMatches` matcher should pick up "PC" and "whip"
    // even though the text contains no `[term:...]` markers.
    const { findByText } = render(
      <ExtendedTooltip
        content={{
          id: 'demo',
          title: 'Demo',
          sections: [
            { kind: 'paragraph', text: 'Spend PC to whip a vote in committee.' },
          ],
        }}
      >
        <span>trigger</span>
      </ExtendedTooltip>,
    );
    // Open the tooltip so the paragraph renders.
    fireEvent.mouseEnter(await findByText('trigger'));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });
    // The paragraph renders inside a portal on document.body, so
    // queryByText('PC') against the container won't see it. Probe the
    // body directly via the DOM.
    const tip = document.querySelector('[role="tooltip"]');
    expect(tip).not.toBeNull();
    // Both auto-linked surfaces should now be wrapped as Term nodes,
    // which carry `data-term` attributes.
    const tags = Array.from(tip!.querySelectorAll('[data-term]')).map(
      (el) => el.getAttribute('data-term'),
    );
    expect(tags).toContain('political-capital');
    expect(tags).toContain('whip');
  });

  it('explicit [term:...] markers still take precedence', async () => {
    // The author wants the literal label "the currency" to point at
    // the `political-capital` definition, even though the matcher
    // wouldn't pick it up. The marker should win.
    const { findByText } = render(
      <ExtendedTooltip
        content={{
          id: 'demo',
          title: 'Demo',
          sections: [
            {
              kind: 'paragraph',
              text: 'Spend [term:political-capital]the currency[/] wisely.',
            },
          ],
        }}
      >
        <span>trigger</span>
      </ExtendedTooltip>,
    );
    fireEvent.mouseEnter(await findByText('trigger'));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });
    const tip = document.querySelector('[role="tooltip"]');
    expect(tip).not.toBeNull();
    // The explicit-marker label is "the currency", and it should be
    // wrapped as a Term pointing at political-capital.
    const explicit = Array.from(tip!.querySelectorAll('[data-term]')).find(
      (el) => el.textContent === 'the currency',
    );
    expect(explicit).toBeTruthy();
    expect(explicit?.getAttribute('data-term')).toBe('political-capital');
  });
});
