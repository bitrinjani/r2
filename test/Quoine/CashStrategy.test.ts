import CashStrategy from '../../Quoine/CashStrategy';
import BrokerApi from '../../Quoine/BrokerApi';
import nocksetup from './nocksetup';
import * as nock from 'nock';
import { options } from '@bitr/logger';
import { expect } from 'chai';
options.enabled = false;

describe('Quoine.CashStrategy', function(){
  this.beforeAll(() => {
    nocksetup();
  });

  this.afterAll(() => {
    nock.restore();
  });

  it('getBtcBalance', async () => {
    const strategy = new CashStrategy(new BrokerApi('key', 'secret'));
    const balance = await strategy.getBtcPosition();
    expect(balance).to.equal(0.04925688);
  });

  it('getBtcBalance unable to find', async () => {
    const strategy = new CashStrategy(new BrokerApi('key', 'secret'));
    try {
      const balance = await strategy.getBtcPosition();
    } catch (ex) {
      expect(ex.message).to.contain('Unable to find');
      return;
    }
    throw new Error();
  });
});
