/**
 * Political Ascent in-app logging system.
 *
 * Where this fits in the architecture:
 *   - Engine, systems, store actions, and renderer components all
 *     reach for `createLogger(scope)` when they need to emit
 *     diagnostic information. The returned `Logger` mirrors the
 *     console API so call sites read naturally (`log.info(...)`).
 *   - Every accepted entry is appended to a module-level ring buffer
 *     of the last `MAX_BUFFER` entries. The buffer is the single
 *     source of truth for the in-game log viewer (todo#22) and the
 *     player-facing crash report attachment (see ErrorBoundary).
 *   - Subscribers (e.g. an in-game log panel) register via
 *     {@link subscribe} to re-render on new entries.
 *
 * Why a ring buffer rather than localStorage / files:
 *   - In the browser/Capacitor renderer there is no filesystem.
 *     Persistent on-disk logs need an Electron main-process IPC
 *     bridge or a Capacitor plugin; both are out of scope for this
 *     pass. The ring buffer + "Download logs" export gives players a
 *     way to attach diagnostics to a bug report immediately.
 *   - Ring buffer caps memory at a known constant.
 *
 * @module utils/logger
 */

/** Severity levels in increasing order of importance. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** A single captured log entry. */
export interface LogEntry {
  /** Wall-clock timestamp (ms since epoch). */
  ts: number;
  /** Severity. */
  level: LogLevel;
  /** Module/component scope passed to `createLogger`. */
  scope: string;
  /** First stringified argument; used as headline by simple viewers. */
  message: string;
  /** Remaining arguments captured by reference for structured renderers. */
  args: readonly unknown[];
}

/**
 * Maximum number of entries retained. Tuned so a busy session stays
 * in memory without bloat; older entries roll off the front.
 */
export const MAX_BUFFER = 500;

const buffer: LogEntry[] = [];
const subscribers = new Set<() => void>();
const isProd = typeof import.meta !== 'undefined' && import.meta.env?.PROD;

/**
 * Filter level: entries below this level are dropped before reaching
 * buffer or console. Defaults to `'debug'` in dev, `'info'` in prod.
 */
let minLevel: LogLevel = isProd ? 'info' : 'debug';
const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/** Adjust the global log threshold at runtime. */
export function setLogLevel(level: LogLevel): void {
  minLevel = level;
}

/** Read the current global threshold. */
export function getLogLevel(): LogLevel {
  return minLevel;
}

function notifySubscribers(): void {
  for (const cb of subscribers) cb();
}

function push(entry: LogEntry): void {
  if (LEVEL_RANK[entry.level] < LEVEL_RANK[minLevel]) return;
  buffer.push(entry);
  if (buffer.length > MAX_BUFFER) buffer.splice(0, buffer.length - MAX_BUFFER);
  notifySubscribers();
}

/**
 * Subscribe to buffer updates. The callback fires after every accepted
 * push. Returns an unsubscribe function so React effects can clean up.
 */
export function subscribe(cb: () => void): () => void {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

/** Snapshot the current ring buffer (a copy — safe to sort/filter). */
export function getLogBuffer(): readonly LogEntry[] {
  return buffer.slice();
}

/** Remove every entry from the ring buffer. */
export function clearLogBuffer(): void {
  buffer.length = 0;
  notifySubscribers();
}

/**
 * Return the buffer as a JSON string. Errors are serialised as
 * `{ name, message, stack }` because `JSON.stringify` produces `{}`
 * for them by default.
 */
export function serialiseLogs(): string {
  return JSON.stringify(buffer.map(serialiseEntry), null, 2);
}

function serialiseEntry(entry: LogEntry): unknown {
  return {
    ts: new Date(entry.ts).toISOString(),
    level: entry.level,
    scope: entry.scope,
    message: entry.message,
    args: entry.args.map(serialiseArg),
  };
}

function serialiseArg(arg: unknown): unknown {
  if (arg instanceof Error) {
    return { name: arg.name, message: arg.message, stack: arg.stack };
  }
  return arg;
}

/**
 * Public Logger handle returned by {@link createLogger}. The shape
 * mirrors `console` so call sites are familiar.
 */
export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

/**
 * Build a scoped logger. The `scope` appears in console lines so logs
 * are greppable (`[engine] tick 42`) and is preserved on the captured
 * entry so the in-game viewer can filter by source.
 *
 * @example
 *   const log = createLogger('legislation');
 *   log.info('vote opened', { billId, sponsor });
 */
export function createLogger(scope: string): Logger {
  function emit(level: LogLevel, args: unknown[]): void {
    const message = args.length > 0 ? String(args[0]) : '';
    const rest = args.slice(1);
    push({ ts: Date.now(), level, scope, message, args: rest });
    if (!isProd) {
      const consoleMethod = console[level] ?? console.log;
      consoleMethod.call(console, `[${scope}]`, ...args);
    }
  }
  return {
    debug: (...args) => emit('debug', args),
    info: (...args) => emit('info', args),
    warn: (...args) => emit('warn', args),
    error: (...args) => emit('error', args),
  };
}

/** Default scope used by quick `log.info(...)` call sites. */
export const log = createLogger('app');
