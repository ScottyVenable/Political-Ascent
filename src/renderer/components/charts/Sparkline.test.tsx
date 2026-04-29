/**
 * Sparkline tests — covers geometry math and DOM contract.
 *
 * We render the component to a real DOM via testing-library, then
 * inspect the resulting <polyline> / <path> / <circle> elements to
 * verify normalisation, gradient wiring, and prop pass-through.
 */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Sparkline } from './Sparkline';

describe('Sparkline', () => {
  it('renders an empty SVG when values is empty', () => {
    const { container } = render(<Sparkline values={[]} />);
    const svg = container.querySelector('svg')!;
    expect(svg).toBeTruthy();
    expect(svg.querySelector('polyline')).toBeNull();
    expect(svg.querySelector('path')).toBeNull();
  });

  it('plots N points spanning the inner drawable area', () => {
    const { container } = render(
      <Sparkline values={[0, 5, 10]} width={100} height={20} padding={0} area={false} lastDot={false} />
    );
    const polyline = container.querySelector('polyline')!;
    const points = polyline.getAttribute('points')!;
    // Three values across width=100, padding=0 → x at 0, 50, 100.
    expect(points).toContain('0.0');
    expect(points).toContain('50.0');
    expect(points).toContain('100.0');
  });

  it('renders an area path when area=true', () => {
    const { container } = render(<Sparkline values={[1, 2, 3]} area />);
    expect(container.querySelector('path')).toBeTruthy();
    expect(container.querySelector('linearGradient')).toBeTruthy();
  });

  it('omits area path when area=false', () => {
    const { container } = render(<Sparkline values={[1, 2, 3]} area={false} />);
    expect(container.querySelector('path')).toBeNull();
    expect(container.querySelector('linearGradient')).toBeNull();
  });

  it('places the last dot at the latest value', () => {
    const { container } = render(
      <Sparkline values={[1, 2, 3]} width={100} height={20} padding={0} area={false} lastDot />
    );
    const circle = container.querySelector('circle')!;
    // x should be at the right edge (last index over 100 width).
    expect(circle.getAttribute('cx')).toBe('100');
  });

  it('omits width/height attrs when responsive=true', () => {
    const { container } = render(<Sparkline values={[1, 2]} responsive />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('width')).toBeNull();
    expect(svg.getAttribute('height')).toBeNull();
    // viewBox is still present so coordinate space is preserved.
    expect(svg.getAttribute('viewBox')).toBeTruthy();
  });

  it('accepts a literal hex tone', () => {
    const { container } = render(
      <Sparkline values={[1, 2]} tone="#ff00aa" area={false} lastDot={false} />
    );
    expect(container.querySelector('polyline')!.getAttribute('stroke')).toBe('#ff00aa');
  });

  it('handles all-equal values without dividing by zero', () => {
    const { container } = render(
      <Sparkline values={[5, 5, 5]} width={100} height={20} padding={0} area={false} lastDot={false} />
    );
    const polyline = container.querySelector('polyline')!;
    expect(polyline.getAttribute('points')).not.toContain('NaN');
  });
});
