
test('logger', () => {
  const temp = process.env.NODE_ENV;
  process.env.NODE_ENV = 'dummy prod';
  const logger2 = require('../logger');
  expect(logger2.options.enabled).toBe(true);
  process.env.NODE_ENV = temp;
});