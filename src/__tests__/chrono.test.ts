import { getChronoDB, closeChronoDB } from '../chrono';

test('close undefined', () => {
  closeChronoDB();
});

test('get twice', () => {
  const store = getChronoDB(`${__dirname}/datastore/chronoDBTest`);
  const store2 = getChronoDB(`${__dirname}/datastore/chronoDBTest`);
  expect(store).toBe(store2);  
  closeChronoDB();
});