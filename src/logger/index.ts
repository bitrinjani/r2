import * as _ from 'lodash';
import * as pino from 'pino';
import * as util from 'util';

export const options = { enabled: true };

const logger = pino({ level: 'debug' });
const cache = new Map();
const noop = () => {
  return;
};

export function getLogger(name: string) {
  if (!options.enabled) {
    return {
      debug: noop,
      info: noop,
      warn: noop,
      error: noop
    };
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
