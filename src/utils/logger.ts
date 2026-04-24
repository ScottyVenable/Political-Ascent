/**
 * Dev-mode logging wrapper.
 *
 * In production (`import.meta.env.PROD`) all methods are no-ops. In dev, they
 * pass through to `console` with a module prefix so logs are greppable.
 */

type LogFn = (...args: unknown[]) => void;

interface Logger {
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
}

const isProd = typeof import.meta !== 'undefined' && import.meta.env?.PROD;

export function createLogger(scope: string): Logger {
  if (isProd) {
    const noop = (): void => undefined;
    return { debug: noop, info: noop, warn: noop, error: noop };
  }
  return {
    debug: (...a: unknown[]) => console.debug(`[${scope}]`, ...a),
    info: (...a: unknown[]) => console.info(`[${scope}]`, ...a),
    warn: (...a: unknown[]) => console.warn(`[${scope}]`, ...a),
    error: (...a: unknown[]) => console.error(`[${scope}]`, ...a),
  };
}

export const log = createLogger('app');
