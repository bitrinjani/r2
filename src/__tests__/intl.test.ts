import { expect, spy } from 'chai';
import * as config from '../configUtil';

// @ts-ignore 2540
config.getConfigRoot = spy(() => {
  throw new Error();
});

describe("intl", function(){
  it('intl catch', () => {
    expect(() => require('../intl')).not.to.throw();
  });
});
