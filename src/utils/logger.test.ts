/**
 * Tests for the in-app logger ring buffer.
 *
 * Covers happy-path emission across each level, the level filter,
 * subscriber notification, ring-buffer trim at MAX_BUFFER, and
 * Error serialisation in serialiseLogs.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createLogger,
  getLogBuffer,
  clearLogBuffer,
  setLogLevel,
  subscribe,
  serialiseLogs,
  MAX_BUFFER,
} from './logger';

describe('logger', () => {
  beforeEach(() => {
    clearLogBuffer();
    setLogLevel('debug');
  });

  it('captures entries from each level with scope and message', () => {
    const log = createLogger('legislation');
    log.debug('vote opened', { billId: 'b1' });
    log.info('vote tallied');
    log.warn('quorum low');
    log.error('vote failed');

    const buf = getLogBuffer();
    expect(buf.length).toBe(4);
    expect(buf[0]?.scope).toBe('legislation');
    expect(buf[0]?.level).toBe('debug');
    expect(buf[0]?.message).toBe('vote opened');
    // structured payload preserved by reference in args
    expect(buf[0]?.args[0]).toEqual({ billId: 'b1' });
    expect(buf[3]?.level).toBe('error');
  });

  it('drops entries below the configured min level', () => {
    setLogLevel('warn');
    const log = createLogger('engine');
    log.debug('quiet'); // dropped
    log.info('quiet'); // dropped
    log.warn('loud');
    log.error('loud');
    expect(getLogBuffer().map((e) => e.level)).toEqual(['warn', 'error']);
  });

  it('notifies subscribers on each accepted push and supports unsubscribe', () => {
    let calls = 0;
    const unsub = subscribe(() => {
      calls++;
    });
    const log = createLogger('ui');
    log.info('a');
    log.info('b');
    expect(calls).toBe(2);
    unsub();
    log.info('c');
    expect(calls).toBe(2);
  });

  it('trims the ring buffer to MAX_BUFFER entries', () => {
    const log = createLogger('stress');
    for (let i = 0; i < MAX_BUFFER + 50; i++) log.info(`m${i}`);
    const buf = getLogBuffer();
    expect(buf.length).toBe(MAX_BUFFER);
    // Oldest entries rolled off the front; first remaining message
    // should be `m50` (50 entries dropped).
    expect(buf[0]?.message).toBe('m50');
  });

  it('serialiseLogs emits a JSON string with Error fields preserved', () => {
    const log = createLogger('boom');
    log.error('crashed', new Error('kaboom'));
    const json = serialiseLogs();
    const parsed = JSON.parse(json) as Array<{
      level: string;
      args: Array<{ name?: string; message?: string; stack?: string }>;
    }>;
    expect(parsed.length).toBe(1);
    expect(parsed[0]?.level).toBe('error');
    expect(parsed[0]?.args[0]?.name).toBe('Error');
    expect(parsed[0]?.args[0]?.message).toBe('kaboom');
    // stack present (string) — exact contents environment-dependent
    expect(typeof parsed[0]?.args[0]?.stack).toBe('string');
  });
});
