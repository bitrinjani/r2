// tslint:disable:object-literal-key-quotes
// tslint:disable:max-line-length
import * as nock from 'nock';
import * as _ from 'lodash';
import BrokerApi from '../../Quoine/BrokerApi';
import nocksetup from './nocksetup';

nocksetup();

const key = 'key';
const secret = 'secret';

describe('Quoine BrokerApi', () => {
  test('sendOrder', async () => {
    const target = new BrokerApi(key, secret);
    const request = { order: { price: 783000, product_id: '5', order_direction: 'netout', order_type: 'limit', side: 'buy', quantity: 0.01, leverage_level: 10 } };
    const res = await target.sendOrder(request);
    expect(res.id).toBe("118573146");
    expect(res.created_at).toBe(1509624642);
  });

  test('getOrders', async () => {
    const target = new BrokerApi(key, secret);
    const res = await target.getOrders(118573146);
    expect(res.id).toBe('118573146');
  });

  test('getTradingAccounts', async () => {
    const target = new BrokerApi(key , secret);
    const res = await target.getTradingAccounts();
    expect(res[0].id).toBe('123456');
  });

  test('getPriceLevels', async () => {
    const target = new BrokerApi(key , secret);
    const res = await target.getPriceLevels();
    expect(res.buy_price_levels.length).toBe(21);
    expect(res.sell_price_levels.length).toBe(21);
  });

  afterAll(() => {
    nock.restore();
  });
});