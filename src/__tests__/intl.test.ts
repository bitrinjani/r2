import { getConfigRoot } from '../configUtil';

getConfigRoot = jest.fn().mockImplementation(() => {
  throw new Error();
});

test('intl catch', () => {
  expect(() => require('../intl')).not.toThrow();
});
