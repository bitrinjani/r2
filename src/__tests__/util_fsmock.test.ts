
jest.mock('fs', () => ({
  existsSync: jest.fn(() => false),
  readFileSync: jest.fn(() => '{"language": "test"}'),
  mkdirSync: jest.fn(() => { throw { code: 'EEXIST' }; })
}));

import * as fs from 'fs';
import * util from '../util';

test('getConfigRoot not found config.json', () => {
  const config = util.getConfigRoot();
  expect(fs.existsSync.mock.calls.length).toBe(1);
  expect(config.language).toBe('test');
});

test('getConfigRoot with process.env mock', () => {
  process.env.NODE_ENV = 'testmock';
  try {
    const config = util.getConfigRoot();
    expect(config.language).toBe('test');
  } finally {
    process.env.NODE_ENV = 'test';
  }
});

test('mkdir throws', () => {
  expect(() => util.mkdir('mockdir')).not.toThrow();
});

afterAll(() => jest.unmock('fs'));