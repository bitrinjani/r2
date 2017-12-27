import SingleLegHandler from '../SingleLegHandler';
import { OnSingleLegConfig } from '../types';

test('handle cancel action', () => {
  const config = { action: 'Cancel' } as OnSingleLegConfig;
  const handler = new SingleLegHandler(undefined, config);
  expect(() => handler.handle(undefined, false)).not.toThrow();
});

test('handle undefined config', () => {
  const handler = new SingleLegHandler(undefined, undefined);
  expect(() => handler.handle(undefined, false)).not.toThrow();
});

test('handle undefined config', () => {
  const config = { action: 'Cancel' } as OnSingleLegConfig;
  const handler = new SingleLegHandler(undefined, config);
  expect(() => handler.handle(undefined, true)).not.toThrow();
});