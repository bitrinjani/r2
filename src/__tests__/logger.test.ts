import * as logger from '../logger';
logger.options.enabled = true;

test('logger', () => {
  const log = logger.getLogger('');
  log.warn();
  log.info();
  log.error();
  log.debug();
  const log2 = logger.getLogger('');
  expect(log).toBe(log2);
});
