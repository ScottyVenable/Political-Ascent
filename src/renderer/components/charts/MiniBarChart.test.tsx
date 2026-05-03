/**
 * MiniBarChart tests — geometry, scale, label rendering.
 */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { MiniBarChart } from './MiniBarChart';

describe('MiniBarChart', () => {
  it('renders an empty SVG for empty data', () => {
    const { container } = render(<MiniBarChart data={[]} />);
    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.querySelectorAll('rect')).toHaveLength(0);
  });

  it('renders one rect + axis label per item', () => {
    const { container } = render(
      <MiniBarChart data={[{ label: 'D', value: 10 }, { label: 'R', value: 5 }, { label: 'I', value: 2 }]} />
    );
    expect(container.querySelectorAll('rect')).toHaveLength(3);
    const labels = Array.from(container.querySelectorAll('text')).map((t) => t.textContent);
    expect(labels).toEqual(expect.arrayContaining(['D', 'R', 'I']));
  });

  it('scales the tallest bar to drawable height', () => {
    const { container } = render(
      <MiniBarChart data={[{ label: 'a', value: 100 }, { label: 'b', value: 50 }]} height={60} />
    );
    const rects = container.querySelectorAll('rect');
    const h0 = parseFloat(rects[0]!.getAttribute('height')!);
    const h1 = parseFloat(rects[1]!.getAttribute('height')!);
    expect(h0).toBeGreaterThan(h1);
    // Bar 'a' is the peak — should occupy the full 60px draw area.
    expect(h0).toBe(60);
    // Bar 'b' is half the peak so half height.
    expect(h1).toBe(30);
  });

  it('renders value labels above bars when showValueLabels=true', () => {
    const { container } = render(
      <MiniBarChart data={[{ label: 'a', value: 7 }]} showValueLabels />
    );
    const texts = Array.from(container.querySelectorAll('text')).map((t) => t.textContent);
    expect(texts).toContain('7');
  });

  it('clamps negative values to zero-height bars', () => {
    const { container } = render(
      <MiniBarChart data={[{ label: 'a', value: 10 }, { label: 'b', value: -5 }]} />
    );
    const rects = container.querySelectorAll('rect');
    expect(parseFloat(rects[1]!.getAttribute('height')!)).toBe(0);
  });

  it('honours per-item tone overrides', () => {
    const { container } = render(
      <MiniBarChart data={[{ label: 'a', value: 1, tone: '#abcdef' }]} />
    );
    expect(container.querySelector('rect')!.getAttribute('fill')).toBe('#abcdef');
  });
});
