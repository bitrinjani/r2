import { promisify } from 'util';
import * as child_process from 'child_process';

jest.setTimeout(30000);

test('tsc', async () => {
  const out = await promisify(child_process.exec)('tsc --noEmit --listFiles');
  expect(out.stdout.length).toBeGreaterThan(0);
  expect(out.stderr.length).toBe(0);
});