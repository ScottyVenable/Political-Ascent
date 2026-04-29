/**
 * Unit tests for the formatting utilities.
 *
 * Covers the helpers added in the April 2026 UI passes:
 *   - formatBillionsUSD — compact economy display (`$34.0T`, `$1.7T`, `-$900B`)
 *   - describeIdeology  — humanized compass label for the dashboard
 *   - formatTag         — human-readable labels for snake_case tag identifiers
 *
 * Pre-existing helpers (`formatDateLong`, `formatCurrency`, etc.) are left
 * to the broader utility suite; this file is scoped to the additions.
 */
import { describe, it, expect } from 'vitest';
import { formatBillionsUSD, describeIdeology, formatTag } from './format';

describe('formatBillionsUSD', () => {
  it('compacts values of 1000B or more into trillions with one decimal', () => {
    expect(formatBillionsUSD(1000)).toBe('$1.0T');
    expect(formatBillionsUSD(1700)).toBe('$1.7T');
    expect(formatBillionsUSD(34000)).toBe('$34.0T');
  });

  it('renders values between 1B and 1000B as whole billions', () => {
    expect(formatBillionsUSD(1)).toBe('$1B');
    expect(formatBillionsUSD(42)).toBe('$42B');
    expect(formatBillionsUSD(999)).toBe('$999B');
  });

  it('renders sub-billion values as whole millions', () => {
    // 0.4B === 400M — the economy currently never produces sub-billion
    // values, but the helper should behave sensibly for modders.
    expect(formatBillionsUSD(0.4)).toBe('$400M');
    expect(formatBillionsUSD(0.05)).toBe('$50M');
  });

  it('prefixes negative values with a minus sign outside the dollar', () => {
    expect(formatBillionsUSD(-900)).toBe('-$900B');
    expect(formatBillionsUSD(-1700)).toBe('-$1.7T');
  });

  it('returns "$0" for exactly zero', () => {
    expect(formatBillionsUSD(0)).toBe('$0');
  });
});

describe('describeIdeology', () => {
  it('returns "Centrist" when both axes are within the default threshold', () => {
    expect(describeIdeology(0, 0)).toBe('Centrist');
    expect(describeIdeology(0.1, -0.1)).toBe('Centrist');
    expect(describeIdeology(-0.14, 0.14)).toBe('Centrist');
  });

  it('labels the four quadrants outside the threshold', () => {
    // y < 0 is libertarian, x < 0 is economic left
    expect(describeIdeology(-0.5, -0.5)).toBe('Libertarian Left');
    expect(describeIdeology(0.5, -0.5)).toBe('Libertarian Right');
    expect(describeIdeology(-0.5, 0.5)).toBe('Authoritarian Left');
    expect(describeIdeology(0.5, 0.5)).toBe('Authoritarian Right');
  });

  it('honours a custom centre threshold', () => {
    // With a wider threshold, (0.2, 0.2) should still count as centrist.
    expect(describeIdeology(0.2, 0.2, 0.25)).toBe('Centrist');
    // With a tighter threshold, the same point becomes a quadrant label.
    expect(describeIdeology(0.2, 0.2, 0.05)).toBe('Authoritarian Right');
  });

  it('treats threshold as an inclusive boundary', () => {
    // |x| === threshold on both axes → still centrist.
    expect(describeIdeology(0.15, 0.15)).toBe('Centrist');
    // Anything strictly above becomes a quadrant.
    expect(describeIdeology(0.16, 0.16)).toBe('Authoritarian Right');
  });
});

describe('formatTag', () => {
  it('title-cases a single lowercase word', () => {
    expect(formatTag('economy')).toBe('Economy');
    expect(formatTag('healthcare')).toBe('Healthcare');
    expect(formatTag('media')).toBe('Media');
  });

  it('converts underscores to spaces and title-cases each word', () => {
    expect(formatTag('civil_rights')).toBe('Civil Rights');
    expect(formatTag('criminal_justice')).toBe('Criminal Justice');
    expect(formatTag('floor_debate')).toBe('Floor Debate');
  });

  it('applies known overrides from the lookup table', () => {
    expect(formatTag('pork')).toBe('Pork Barrel');
    expect(formatTag('dark')).toBe('Dark Money');
  });

  it('handles multi-segment snake_case', () => {
    expect(formatTag('foreign_policy_aid')).toBe('Foreign Policy Aid');
  });
});
