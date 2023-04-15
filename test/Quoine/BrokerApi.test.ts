// tslint:disable:object-literal-key-quotes
// tslint:disable:max-line-length
import * as nock from 'nock';
import * as _ from 'lodash';
import BrokerApi from '../../src/Quoine/BrokerApi';
import nocksetup from './nocksetup';
import { options } from '@bitr/logger';
import { expect } from 'chai';
options.enabled = false;

nocksetup();

const key = 'key';
const secret = 'secret';

describe('Quoine BrokerApi', function(){
  it('sendOrder', async () => {
    const target = new BrokerApi(key, secret);
    const request = { order: { price: 783000, product_id: '5', order_direction: 'netout', order_type: 'limit', side: 'buy', quantity: 0.01, leverage_level: 10 } };
    const res = await target.sendOrder(request);
    expect(res.id).to.equal("118573146");
    expect(res.created_at).to.equal(1509624642);
  });

  it('getOrders', async () => {
    const target = new BrokerApi(key, secret);
    const res = await target.getOrders("118573146");
    expect(res.id).to.equal('118573146');
  });

  it('getTradingAccounts', async () => {
    const target = new BrokerApi(key , secret);
    const res = await target.getTradingAccounts();
    expect(res[0].id).to.equal('123456');
  });

  it('getPriceLevels', async () => {
    const target = new BrokerApi(key , secret);
    const res = await target.getPriceLevels();
    expect(res.buy_price_levels.length).to.equal(21);
    expect(res.sell_price_levels.length).to.equal(21);
  });

  it('closeAll', async () => {
    const target = new BrokerApi(key, secret);
    const res = await target.closeAll();
    expect(res[0].id).to.equal(12345);
  });

  this.afterAll(() => {
    nock.restore();
  });
});
