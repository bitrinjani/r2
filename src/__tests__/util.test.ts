import * as util from '../util';

test('timestampToDate', () => {
  const dt = util.timestampToDate(1509586252);
  expect(dt.toISOString()).toBe('2017-11-02T01:30:52.000Z');
});

test('mkdir', () => {
  expect(() => util.mkdir(1)).toThrow();
});