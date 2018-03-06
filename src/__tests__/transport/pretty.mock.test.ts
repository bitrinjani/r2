jest.mock('date-fns', () => ({
  format: jest
    .fn()
    .mockImplementationOnce(() => {
      throw new Error();
    })
    .mockImplementationOnce(() => {
      throw new Error('test');
    })
}));

import { pretty } from '../../transport/transform';
import { Readable } from 'stream';

test('pretty split callback throws', () => {
  const result = pretty({ colorize: true, withLabel: true, debug: true, hidden: false });
  const stream = new Readable();
  stream.push('{ "msg": "Test message", "time": 1514074545477, "level": 40, "label": "TestStream" }');
  stream.push(null);
  stream.pipe(result).pipe(process.stdout);
});

test('pretty split callback throws 2', () => {
  const result = pretty({ colorize: true, withLabel: true, debug: true, hidden: false });
  const stream = new Readable();
  stream.push('{ "msg": "Test message", "time": 1514074545477, "level": 40, "label": "TestStream" }');
  stream.push(null);
  stream.pipe(result).pipe(process.stdout);
});
