// tslint:disable
import * as nock from 'nock';
import * as _ from 'lodash';
import BrokerApi from '../../Bitflyer/BrokerApi';
import nocksetup from './nocksetup';
import { options } from '@bitr/logger';
options.enabled = false;

nocksetup();
afterAll(() => {
  nock.restore();
});
const target = new BrokerApi('key', 'secret');

describe('BrokerApi', async () => {
  test('sendChildOrder', async () => {
    const req = {
      "product_code": "BTC_JPY",
      "child_order_type": "LIMIT",
      "side": "BUY",
      "price": 30000,
      "size": 0.1,
      "time_in_force": ""
    };
    const reply = await target.sendChildOrder(req);
    expect(reply.child_order_acceptance_id).toBe('JRF20150707-050237-639234');
  })

  test('cancel', async () => {
    const req = {
      "product_code": "BTC_JPY",
      "child_order_acceptance_id": "JRF20150707-033333-099999"
    };
    const reply = await target.cancelChildOrder(req);
    expect(reply).toEqual({});
  })

  test('board', async () => {
    const reply = await target.getBoard();
    expect(reply.asks.length).toBe(2);
    expect(reply.bids[1].price).toBe(25570);
  });

  test('getchildorders', async () => {
    const acceptanceId = 'JRF20150707-084547-396699';
    const reply = await target.getChildOrders({child_order_acceptance_id: acceptanceId});
    expect(reply[0].child_order_acceptance_id).toBe(acceptanceId);
  });

  test('getExecutions', async () => {
    const acceptanceId = 'JRF20150707-060559-396699';
    const reply = await target.getExecutions({child_order_acceptance_id: acceptanceId});
    expect(reply[0].child_order_acceptance_id).toBe(acceptanceId);
    expect(reply[0].exec_date.getUTCFullYear()).toBe(2015);
  })
});