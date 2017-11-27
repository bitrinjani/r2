import * as util from '../util';

test('timestampToDate', () => {
  const dt = util.timestampToDate(1509586252);
  expect(dt.toISOString()).toBe('2017-11-02T01:30:52.000Z');
});

test('mkdir', () => {
  expect(() => util.mkdir(1)).toThrow();
});

test('nonce', async () => {
  const result = [];
  setTimeout(() => result.push(util.nonce()), 50);
  setTimeout(() => result.push(util.nonce()), 50);
  setTimeout(() => result.push(util.nonce()), 50);
  setTimeout(() => result.push(util.nonce()), 50);
  setTimeout(() => result.push(util.nonce()), 50);
  setTimeout(() => result.push(util.nonce()), 50);
  await util.delay(100);
  const resultSet = new Set(result);
  expect(result.length).toBe(6);
  expect(result.length).toBe(resultSet.size);
});