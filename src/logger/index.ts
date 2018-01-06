import * as _ from 'lodash';
import * as pino from 'pino';
import * as util from 'util';

export const options = { enabled: process.env.NODE_ENV === 'test' ? false : true };

export interface Logger {
  debug: (s: string, ...args: any[]) => void;
  info: (s: string, ...args: any[]) => void;
  warn: (s: string, ...args: any[]) => void;
  error: (s: string, ...args: any[]) => void;
}

const logger = pino({ level: 'debug' });
const cache = new Map();

export function getLogger(name: string): Logger {
  if (!options.enabled) {
    return new Proxy({}, { get: () => _.noop }) as Logger;
  }
  const label = _.trimEnd(name, 'Impl');
  if (cache.has(label)) {
    return cache.get(label);
  }
  const childLogger = logger.child({ label });
  const wrappedLogger = {
    debug: (s: string, ...args) => childLogger.debug(util.format(s, ...args)),
    info: (s: string, ...args) => childLogger.info(util.format(s, ...args)),
    warn: (s: string, ...args) => childLogger.warn(util.format(s, ...args)),
    error: (s: string, ...args) => childLogger.error(util.format(s, ...args))
  };
  cache.set(label, wrappedLogger);
  return wrappedLogger;
}
