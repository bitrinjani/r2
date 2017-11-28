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

test('almostEqual', () => {
  expect(util.almostEqual(1, 1, 0)).toBe(true);
  expect(util.almostEqual(1, 1, 1)).toBe(true);
  expect(util.almostEqual(1, 0.99, 2)).toBe(true);
  expect(util.almostEqual(1.00001, 0.99, 2)).toBe(true);
  expect(util.almostEqual(1.50001, 0.99, 70)).toBe(true);  
  expect(util.almostEqual(1, -1, 1)).toBe(false);
  expect(util.almostEqual(1, -0.99, 2)).toBe(false);
  expect(util.almostEqual(1.00001, 0.99, 1)).toBe(false);
  expect(util.almostEqual(1, 0.99, 0.1)).toBe(false);
  expect(util.almostEqual(1.50001, 0.99, 20)).toBe(false);
})