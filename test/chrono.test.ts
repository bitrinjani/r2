import { expect } from 'chai';
import { getChronoDB, closeChronoDB } from '../chrono';

describe("ChronoTest", function(){
  it('close undefined', () => {
    closeChronoDB();
  });

  it('get twice', () => {
    const store = getChronoDB(`${__dirname}/datastore/chronoDBTest`);
    const store2 = getChronoDB(`${__dirname}/datastore/chronoDBTest`);
    expect(store).to.equal(store2);  
    closeChronoDB();
  });
});
