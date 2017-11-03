// tslint:disable
import * as nock from 'nock';
import * as _ from 'lodash';
import Bitflyer from '../../Bitflyer/BrokerAdapterImpl';
import { OrderStatus, Broker, CashMarginType, OrderSide, OrderType } from '../../type';
import nocksetup from './nocksetup';
import Order from '../../Order';

nocksetup();
afterAll(() => {
  nock.restore();
});

const config = {
  brokers: [
    { broker: Broker.Bitflyer, key: '', secret: '', cashMarginType: CashMarginType.Cash }
  ]
};

describe('Coincheck BrokerAdapter', () => {

  test('getBtcPosition', async () => {
    const target = new Bitflyer.BrokerAdapterImpl({ config });
    const result = await target.getBtcPosition();
    expect(result).toBe(0.01084272);
  });

  test('fetchQuotes', async () => {
    const target = new Bitflyer.BrokerAdapterImpl({ config });
    const result = await target.fetchQuotes();
    expect(result.length).toBe(4);
    result.forEach(q => expect(q.broker).toBe(Broker.Bitflyer));
  });

  test('send wrong broker order', async () => {
    const target = new Bitflyer.BrokerAdapterImpl({ config });
    const order = { broker: Broker.Coincheck };
    try { 
      await target.send(order);
    } catch(ex) {
      return;
    }
    expect(false).toBe(true);
  });

  test('cancel', async () => {
    const target = new Bitflyer.BrokerAdapterImpl({ config });
    const order = { symbol: 'BTCJPY', brokerOrderId: 'JRF20150707-033333-099999' };
    await target.cancel(order);
    expect(order.status).toBe(OrderStatus.Canceled);
  });

  test('send buy limit', async () => {
    const target = new Bitflyer.BrokerAdapterImpl({ config });
    const order = new Order(
      Broker.Bitflyer, 
      OrderSide.Buy, 
      0.1, 
      30000, 
      CashMarginType.Cash, OrderType.Limit, undefined);
    await target.send(order);
    expect(order.status).toBe(OrderStatus.New);
    expect(order.brokerOrderId).toBe('JRF20150707-050237-639234');
  });  

  test('refresh', async () => {
    const target = new Bitflyer.BrokerAdapterImpl({ config });
    const order = {"symbol":"BTCJPY","type":"Limit","timeInForce":"None","id":"438f7c7b-ed72-4719-935f-477ea043e2b0","status":"New","creationTime":"2017-11-03T09:20:06.687Z","executions":[],"broker":"Bitflyer","size":0.01,"side":"Sell","price":846700,"cashMarginType":"Cash","brokerOrderId":"JRF20171103-092007-284294","sentTime":"2017-11-03T09:20:07.292Z","lastUpdated":"2017-11-03T09:20:07.292Z"};
    await target.refresh(order);
    expect(order.status).toBe(OrderStatus.Filled);
  });
});