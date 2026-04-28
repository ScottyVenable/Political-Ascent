import { describe, expect, it } from 'vitest';
import { parseMarkdownLite } from './MarkdownLite';

describe('parseMarkdownLite', () => {
  it('parses headings at all three levels', () => {
    const out = parseMarkdownLite('# Big\n\n## Medium\n\n### Small');
    expect(out).toEqual([
      { kind: 'h1', text: 'Big' },
      { kind: 'h2', text: 'Medium' },
      { kind: 'h3', text: 'Small' },
    ]);
  });

  it('groups consecutive bullet lines into a single ul block', () => {
    const out = parseMarkdownLite('- one\n- two\n- three');
    expect(out).toEqual([
      { kind: 'ul', text: '', items: ['one', 'two', 'three'] },
    ]);
  });

  it('separates a ul from a following paragraph by blank line', () => {
    const out = parseMarkdownLite('- a\n- b\n\nA paragraph.');
    expect(out).toEqual([
      { kind: 'ul', text: '', items: ['a', 'b'] },
      { kind: 'p', text: 'A paragraph.' },
    ]);
  });

  it('joins wrapped paragraph lines with single spaces', () => {
    const out = parseMarkdownLite('Line one\nline two\nline three');
    expect(out).toEqual([{ kind: 'p', text: 'Line one line two line three' }]);
  });

  it('treats * as a valid bullet marker', () => {
    const out = parseMarkdownLite('* alpha\n* beta');
    expect(out).toEqual([
      { kind: 'ul', text: '', items: ['alpha', 'beta'] },
    ]);
  });

  it('returns an empty array for empty input', () => {
    expect(parseMarkdownLite('')).toEqual([]);
    expect(parseMarkdownLite('\n\n\n')).toEqual([]);
  });

  it('handles CRLF line endings', () => {
    const out = parseMarkdownLite('# Title\r\n\r\nA line.');
    expect(out).toEqual([
      { kind: 'h1', text: 'Title' },
      { kind: 'p', text: 'A line.' },
    ]);
  });

  it('merges indented continuation lines into the current bullet', () => {
    // Wrapped bullets in our changelog look like this. Without the
    // continuation rule, the second line would split off as a new
    // paragraph and break the list.
    const out = parseMarkdownLite('- first item that\n  wraps onto two lines\n- second item');
    expect(out).toEqual([
      {
        kind: 'ul',
        text: '',
        items: ['first item that wraps onto two lines', 'second item'],
      },
    ]);
  });

  it('starts a new paragraph after a list when no continuation indent', () => {
    const out = parseMarkdownLite('- a\nNot a continuation.');
    // No leading whitespace → not a continuation; the list flushes
    // and a new paragraph begins.
    expect(out).toEqual([
      { kind: 'ul', text: '', items: ['a'] },
      { kind: 'p', text: 'Not a continuation.' },
    ]);
  });
});
