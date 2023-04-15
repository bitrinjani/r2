import { expect, spy } from 'chai';
import * as config from '../src/configUtil';

// @ts-ignore 2540
config.getConfigRoot = spy(() => {
  throw new Error();
});

describe("intl", function(){
  it('intl catch', () => {
    expect(() => require('../i18n')).not.to.throw();
  });
});
